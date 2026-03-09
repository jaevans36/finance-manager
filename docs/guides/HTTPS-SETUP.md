# HTTPS Setup with mkcert

Life Manager uses [mkcert](https://github.com/FiloSottile/mkcert) to generate locally-trusted TLS certificates for LAN use. This gives you a proper padlock in the browser without any certificate warnings.

## How it works

nginx acts as the single entry point on ports 80 and 443:

- `http://life-manager` → redirects to `https://life-manager`
- `https://life-manager` → serves the React frontend
- `https://life-manager/api/...` → proxied internally to the .NET API container (port 5000 is no longer exposed to the host)

---

## One-time setup (on the host machine)

### 1. Install mkcert

```powershell
winget install FiloSottile.mkcert
```

Restart your terminal after installation.

### 2. Install the root CA into Windows

```powershell
mkcert -install
```

This adds mkcert's local CA to your Windows certificate trust store. Browsers (Chrome, Edge, Firefox) will trust certificates signed by it.

### 3. Generate the certificate for `life-manager`

Run this from the project root:

```powershell
mkdir certs
cd certs
mkcert life-manager localhost 127.0.0.1
```

This creates two files in the `certs/` directory:

- `life-manager+2.pem` — the certificate
- `life-manager+2-key.pem` — the private key

> **Note**: The filenames include `+2` because we added two extra SANs (localhost and 127.0.0.1). Rename them to match the nginx config:

```powershell
Rename-Item life-manager+2.pem life-manager.pem
Rename-Item life-manager+2-key.pem life-manager-key.pem
```

The `certs/` directory is gitignored — these files must never be committed.

### 4. Update .env.production

Ensure these values are set:

```env
VITE_API_URL=https://life-manager
FRONTEND_ORIGIN=https://life-manager
```

### 5. Rebuild and start

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production up -d --build
```

Open `https://life-manager` in your browser. You should see the padlock.

---

## Trusting the certificate on other LAN devices

For phones, tablets, or other computers to trust your certificates without warnings, they need to trust the same mkcert root CA.

The root CA is at:

```
%LOCALAPPDATA%\mkcert\rootCA.pem
```

### Windows (another PC)
Copy `rootCA.pem` to the other machine, double-click it → Install Certificate → Local Machine → Trusted Root Certification Authorities.

### iOS (iPhone/iPad)
1. AirDrop or email `rootCA.pem` to the device (rename to `rootCA.crt` first)
2. Open it → Settings prompts to install the profile
3. Go to **Settings → General → About → Certificate Trust Settings** and toggle the mkcert CA to trusted

### Android
1. Copy `rootCA.pem` to the device (rename to `rootCA.crt`)
2. **Settings → Security → Install from storage** (varies by manufacturer)

---

## Certificate renewal

mkcert certificates expire after 2-3 years. To renew, simply repeat steps 3–5 above.

---

## Troubleshooting

**"ERR_CERT_AUTHORITY_INVALID" in browser**
- Verify `mkcert -install` was run on this machine
- Close and reopen the browser after installing

**nginx fails to start with SSL errors**
- Check the cert files exist: `ls certs/`
- Verify filenames match exactly: `life-manager.pem` and `life-manager-key.pem`

**Other devices still show warnings**
- Ensure the rootCA is installed on that device (see above)
- Some browsers (Firefox) have their own certificate store — install in Firefox settings too if needed
