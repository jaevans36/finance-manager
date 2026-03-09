# Email System Guide

## How It Works

The Life Manager app uses **nodemailer** to send emails for:
- Password reset requests
- Email verification
- Account lockout notifications  
- Login alerts from new devices

## Development Mode (No Setup Required!) ✅

When you run `.\start-dev.ps1`, the app **automatically**:

1. Creates a free Ethereal test email account
2. Displays credentials in the console
3. Captures all outgoing emails
4. Provides preview URLs to view emails

### Viewing Test Emails

**Console Output:**
```
┌─────────────────────────────────────────────────────────────┐
│ Email Test Account Created (Ethereal)                       │
├─────────────────────────────────────────────────────────────┤
│ View emails at: https://ethereal.email/messages             │
│ Username: abc123@ethereal.email                             │
│ Password: YourPassword                                       │
└─────────────────────────────────────────────────────────────┘
```

**Steps:**
1. Start your dev servers: `.\start-dev.ps1`
2. Copy the username and password from console
3. Go to https://ethereal.email/login
4. Login with those credentials
5. Trigger an email (register, request password reset, etc.)
6. View the email in the Ethereal inbox!

**Alternative:** Check logs for direct preview links:
```powershell
.\view-logs.ps1 -Follow
```

When an email is sent, you'll see:
```
📧 Preview email at: https://ethereal.email/message/ABC123...
```

Click that link to view the email directly!

## Production Mode (Real Emails)

For production, add SMTP credentials to `apps/api/.env`:

### Option 1: Gmail
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@yourapp.com
APP_URL=https://yourapp.com
```

**Gmail Setup:**
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Generate App Password (not your regular password!)
4. Use that app password in `.env`

### Option 2: SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@yourapp.com
APP_URL=https://yourapp.com
```

### Option 3: AWS SES
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-ses-smtp-username
EMAIL_PASSWORD=your-ses-smtp-password
EMAIL_FROM=noreply@yourapp.com
APP_URL=https://yourapp.com
```

### Option 4: Custom SMTP
```env
EMAIL_HOST=mail.yourprovider.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-username
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@yourapp.com
APP_URL=https://yourapp.com
```

## Disable Email Entirely

To disable all email sending:

```env
DISABLE_EMAIL=true
```

The app will:
- Still accept API requests
- Generate tokens and store them in database
- Log email content to console (development only)
- Return success responses
- Not attempt to send actual emails

## Email Templates

The app includes 4 email templates:

### 1. Password Reset
**Trigger:** POST `/api/v1/password-reset/request`
**Contains:**
- Reset link with token (1-hour expiration)
- Security warning message
- Instructions if not requested

### 2. Email Verification  
**Trigger:** POST `/api/v1/auth/register`
**Contains:**
- Verification link with token (24-hour expiration)
- Welcome message
- Account activation instructions

### 3. Account Lockout
**Trigger:** 5 failed login attempts
**Contains:**
- Lockout duration (30 minutes)
- Unlock time
- Security recommendations

### 4. Login Notification
**Trigger:** Login from new device/location
**Contains:**
- Device information
- IP address
- Login time
- Security recommendations

## Testing Email Flows

### Test 1: Password Reset
```powershell
# Request reset
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/password-reset/request" `
  -Method Post -ContentType "application/json" `
  -Body '{"email":"test@example.com"}'

# Check Ethereal inbox for email with reset link
```

### Test 2: Email Verification
```powershell
# Register new user
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/register" `
  -Method Post -ContentType "application/json" `
  -Body '{"email":"newuser@example.com","password":"Test123!"}'

# Check Ethereal inbox for verification email
```

### Test 3: Account Lockout
```powershell
# Fail login 5 times
1..5 | ForEach-Object {
  try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" `
      -Method Post -ContentType "application/json" `
      -Body '{"email":"test@example.com","password":"wrongpassword"}'
  } catch { Write-Host "Attempt $_ failed (expected)" }
}

# Check Ethereal inbox for lockout email
```

## Troubleshooting

### Email not appearing in Ethereal

1. **Check console for credentials**
   - Make sure you're logged into the correct Ethereal account
   - Credentials change each time server restarts

2. **Check logs**
   ```powershell
   .\view-logs.ps1 -Follow
   ```
   Look for: "Email sent successfully" or error messages

3. **Verify service initialized**
   Look for: "Email Test Account Created (Ethereal)" on startup

4. **Check for errors**
   ```powershell
   .\view-logs.ps1 -LogType error
   ```

### Email not sending in production

1. **Verify SMTP credentials**
   - Test with a simple email client first
   - Check port numbers (587 for TLS, 465 for SSL)
   - Verify `EMAIL_SECURE` setting matches your port

2. **Check firewall/network**
   - Some hosting providers block outbound SMTP
   - May need to use provider's email service

3. **Verify connection**
   The app logs connection status on startup

4. **Test with curl**
   ```bash
   curl -v telnet://smtp.gmail.com:587
   ```

### Emails going to spam

1. **Set up SPF record** for your domain
2. **Set up DKIM** signing
3. **Use authenticated SMTP** (not anonymous)
4. **Match FROM address** to domain
5. **Avoid spam trigger words** in subject/body

## Environment Variables Reference

```env
# Email Service
EMAIL_HOST=smtp.gmail.com              # SMTP server hostname
EMAIL_PORT=587                         # SMTP port (587=TLS, 465=SSL, 25=plain)
EMAIL_SECURE=false                     # true for port 465, false for other ports
EMAIL_USER=your-email@gmail.com        # SMTP username
EMAIL_PASSWORD=your-password           # SMTP password or app password
EMAIL_FROM=noreply@yourapp.com         # From address in emails
DISABLE_EMAIL=false                    # Set to true to disable emails

# Application
APP_URL=http://localhost:5173          # Frontend URL for email links
NODE_ENV=development                   # development, production, or test
```

## How It Works Behind the Scenes

### Development (No Credentials)
```
1. App starts → checks for EMAIL_USER/EMAIL_PASSWORD
2. None found → calls nodemailer.createTestAccount()
3. Ethereal creates temporary SMTP server
4. Returns credentials → logged to console
5. All emails go to Ethereal inbox (not real recipients)
```

### Production (With Credentials)
```
1. App starts → finds EMAIL_USER/EMAIL_PASSWORD
2. Creates transporter with your SMTP provider
3. Verifies connection
4. Emails sent to real recipients via SMTP
```

### Disabled Mode
```
1. DISABLE_EMAIL=true
2. No transporter created
3. Email content logged to console (dev only)
4. API returns success but doesn't send
```

## Email Storage

- **Tokens:** Stored in `EmailToken` table (password_reset, email_verification)
- **Expiration:** 1 hour (password reset), 24 hours (verification)
- **Cleanup:** Automatically invalidated when used
- **Security:** 48-byte random hex tokens

## Best Practices

### Development
✅ Use Ethereal (automatic)  
✅ Check logs for preview URLs  
✅ Test all email flows  
✅ Verify email content and links  

### Production
✅ Use reputable SMTP provider  
✅ Enable 2FA for email accounts  
✅ Use app-specific passwords  
✅ Set up SPF/DKIM records  
✅ Monitor email delivery rates  
✅ Handle bounce/complaint webhooks  

### Security
✅ Never commit SMTP credentials  
✅ Use environment variables  
✅ Rotate passwords regularly  
✅ Rate limit email endpoints  
✅ Validate email addresses  
✅ Include unsubscribe links (production)  

---

**Pro Tip:** During development, keep the Ethereal inbox open in a browser tab. Each server restart creates a new account, so you'll need to login again with the new credentials!

**Last Updated:** November 19, 2025
