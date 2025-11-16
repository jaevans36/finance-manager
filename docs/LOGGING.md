# 📝 Logging System Documentation

## Overview

Finance Manager uses **Winston** for comprehensive structured logging with automatic log rotation, multiple log levels, and easy search capabilities.

## Log Levels

Logs are organized by severity:

1. **error** (0) - Application errors, exceptions
2. **warn** (1) - Warning messages, potential issues
3. **info** (2) - General informational messages
4. **http** (3) - HTTP request/response logs
5. **debug** (4) - Detailed debug information

## Log Files

Logs are automatically written to `apps/api/logs/` with daily rotation:

### Application Logs
- **File**: `application-YYYY-MM-DD.log`
- **Content**: All log levels (error, warn, info, http, debug)
- **Retention**: 14 days
- **Max Size**: 20MB per file
- **Format**: JSON for easy parsing

### Error Logs
- **File**: `error-YYYY-MM-DD.log`
- **Content**: Only error-level logs
- **Retention**: 30 days
- **Max Size**: 20MB per file
- **Purpose**: Quick error investigation

### HTTP Logs
- **File**: `http-YYYY-MM-DD.log`
- **Content**: HTTP request/response data
- **Retention**: 7 days
- **Max Size**: 20MB per file
- **Purpose**: API usage analysis

## Viewing Logs

### PowerShell Script (Recommended)

```powershell
# View last 50 lines of application log
.\view-logs.ps1

# View today's logs
.\view-logs.ps1 -Today

# View error logs
.\view-logs.ps1 -LogType error

# View HTTP logs
.\view-logs.ps1 -LogType http

# Search for specific text
.\view-logs.ps1 -Search "userId"

# Follow log in real-time (like tail -f)
.\view-logs.ps1 -Follow

# View last 100 lines
.\view-logs.ps1 -Lines 100

# Search errors for "database"
.\view-logs.ps1 -LogType error -Search "database"
```

### Manual Viewing

```powershell
# View latest application log
Get-Content apps\api\logs\application-2025-11-14.log -Tail 50

# Search all logs for a pattern
Get-ChildItem apps\api\logs\*.log | Select-String "error"

# Follow log file
Get-Content apps\api\logs\application-2025-11-14.log -Tail 10 -Wait
```

## Usage in Code

### Basic Logging

```typescript
import logger from './utils/logger';

// Info log
logger.info('User action completed');

// Warning
logger.warn('Deprecated API used');

// Error
logger.error('Database connection failed');

// Debug (development only)
logger.debug('Variable value', { userId: '123', action: 'create' });
```

### Structured Logging Helpers

```typescript
import { logError, logAuth, logDatabase, logApiCall } from './utils/logger';

// Log errors with context
try {
  await riskyOperation();
} catch (error) {
  logError('Operation failed', error as Error, {
    userId: user.id,
    operation: 'riskyOperation',
    data: { foo: 'bar' }
  });
}

// Log authentication events
logAuth('User registered', userId, { email: user.email });
logAuth('Failed login attempt', undefined, { email, reason: 'Invalid password' });

// Log database operations
const startTime = Date.now();
await prisma.user.findMany();
logDatabase('findMany users', Date.now() - startTime, { count: users.length });

// Log external API calls
logApiCall('Stripe', '/v1/charges', 200, { amount: 1000, currency: 'USD' });
```

### HTTP Request Logging

HTTP requests are automatically logged by middleware:

```typescript
// Automatically logs:
// - HTTP method (GET, POST, etc.)
// - URL path
// - Status code
// - Response time
// - User agent
// - IP address
// - User ID (if authenticated)
```

### Error Logging

Errors are automatically logged with full context:

```typescript
// Operational errors (expected)
throw new AppError('Resource not found', 404);
// Logged at WARN level with request context

// Unexpected errors
throw new Error('Unexpected database error');
// Logged at ERROR level with full stack trace
```

## Searching Logs

### Search by Text Pattern

```powershell
# Find all logs mentioning a user
.\view-logs.ps1 -Search "userId.*abc123"

# Find authentication failures
.\view-logs.ps1 -LogType error -Search "authentication"

# Find slow requests (>1000ms)
.\view-logs.ps1 -LogType http -Search "responseTime.*[2-9][0-9]{3,}"
```

### Search by Time Range

```bash
# Using jq (if installed)
cat apps/api/logs/application-2025-11-14.log | jq 'select(.timestamp > "2025-11-14T10:00:00")'

# Using PowerShell
Get-Content apps/api/logs/application-2025-11-14.log | ConvertFrom-Json | Where-Object { $_.timestamp -gt "2025-11-14T10:00:00" }
```

### Search by Log Level

```bash
# Errors only
cat apps/api/logs/application-2025-11-14.log | jq 'select(.level == "error")'

# Warnings and errors
cat apps/api/logs/application-2025-11-14.log | jq 'select(.level | test("error|warn"))'
```

## Log Format

### JSON Structure

```json
{
  "level": "error",
  "message": "Database connection failed",
  "timestamp": "2025-11-14 21:30:15:123",
  "error": {
    "message": "Connection timeout",
    "stack": "Error: Connection timeout\n    at ...",
    "name": "ConnectionError"
  },
  "method": "POST",
  "url": "/api/v1/tasks",
  "userId": "abc-123",
  "ip": "127.0.0.1"
}
```

### Console Output (Development)

```
2025-11-14 21:30:15 [error]: Database connection failed {"method":"POST","url":"/api/v1/tasks"}
Error: Connection timeout
    at Connection.connect (database.ts:45:10)
    at ...
```

## Best Practices

### DO ✅

1. **Use appropriate log levels**
   ```typescript
   logger.error('Critical failure');  // For errors
   logger.warn('Deprecated usage');   // For warnings
   logger.info('User action');        // For important info
   logger.debug('Variable state');    // For debugging
   ```

2. **Include context in logs**
   ```typescript
   logger.info('Task created', {
     userId: user.id,
     taskId: task.id,
     priority: task.priority
   });
   ```

3. **Log authentication events**
   ```typescript
   logAuth('User logged in', userId, { email, ip });
   ```

4. **Log errors with full context**
   ```typescript
   logError('Payment failed', error, {
     userId: user.id,
     amount: payment.amount,
     provider: 'stripe'
   });
   ```

### DON'T ❌

1. **Don't log sensitive data**
   ```typescript
   // BAD
   logger.info('User data', { password: user.password });
   
   // GOOD
   logger.info('User updated', { userId: user.id, email: user.email });
   ```

2. **Don't log in tight loops**
   ```typescript
   // BAD
   users.forEach(user => logger.debug('Processing', user));
   
   // GOOD
   logger.debug('Processing users', { count: users.length });
   ```

3. **Don't log raw objects without context**
   ```typescript
   // BAD
   logger.info(req.body);
   
   // GOOD
   logger.info('Request received', { method: req.method, url: req.url });
   ```

## Monitoring & Alerts

### Daily Log Review

```powershell
# Check for errors today
.\view-logs.ps1 -LogType error -Today

# Check for slow requests
.\view-logs.ps1 -LogType http -Search "responseTime.*[5-9][0-9]{3,}"
```

### Log Rotation

Logs automatically rotate daily and compress after rotation:
- Old logs are gzipped to save space
- Logs older than retention period are automatically deleted
- No manual intervention needed

## Troubleshooting

### Logs Directory Missing

```powershell
# Create logs directory
New-Item -Path "apps\api\logs" -ItemType Directory -Force
```

### View Compressed Logs

```powershell
# Windows doesn't natively support .gz, use 7-Zip or similar
# Or use WSL
wsl gunzip -c apps/api/logs/application-2025-11-13.log.gz | less
```

### No Logs Appearing

1. Check if server is running: `pnpm dev`
2. Check logs directory exists: `ls apps\api\logs`
3. Check file permissions
4. Verify LOG_LEVEL environment variable

## VS Code Task

Add to `.vscode/tasks.json`:

```json
{
  "label": "View Logs",
  "type": "shell",
  "command": "${workspaceFolder}/view-logs.ps1",
  "args": ["-Follow"],
  "presentation": {
    "reveal": "always",
    "panel": "dedicated"
  }
}
```

## Advanced Usage

### Parsing JSON Logs

```powershell
# Get all error messages from today
Get-Content apps\api\logs\error-2025-11-14.log | 
  ConvertFrom-Json | 
  Select-Object timestamp, message, error
```

### Export Logs

```powershell
# Export errors to CSV
Get-Content apps\api\logs\error-2025-11-14.log | 
  ConvertFrom-Json | 
  Export-Csv -Path errors-report.csv -NoTypeInformation
```

### Live Dashboard

For real-time monitoring, consider tools like:
- PM2 logs
- Logstash
- Grafana Loki
- CloudWatch (for production)

---

**Questions?** See the main README or check Winston documentation: <https://github.com/winstonjs/winston>
