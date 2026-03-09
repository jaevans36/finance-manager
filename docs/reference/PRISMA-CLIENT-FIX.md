# Prisma Client Generation Fix

## Issue
Windows file lock (EPERM error) preventing Prisma client from regenerating after schema changes.

## Symptoms
```
EPERM: operation not permitted, rename '...query_engine-windows.dll.node.tmp...' -> '...query_engine-windows.dll.node'
```

## Solutions (Try in Order)

### 1. Close All Terminals and Restart VS Code (Recommended)
1. Close all terminals in VS Code (trash can icon)
2. Close VS Code completely (File → Exit or Alt+F4)
3. Reopen VS Code
4. Run: `cd "c:\Projects\Life Manager\apps\api"; pnpm prisma generate`

### 2. Kill Node Processes Manually
```powershell
# Kill all Node.js processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Then try generating again
cd "c:\Projects\Life Manager\apps\api"
pnpm prisma generate
```

### 3. Delete node_modules and Reinstall (Nuclear Option)
```powershell
# Stop everything
.\stop-dev.ps1

# Delete node_modules
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force apps/api/node_modules
Remove-Item -Recurse -Force apps/web/node_modules

# Reinstall
pnpm install

# Generate Prisma client
cd apps/api
pnpm prisma generate
```

### 4. Restart Computer (If All Else Fails)
Sometimes Windows needs a full restart to release stubborn file locks.

## Current Status
- ✅ Database schema updated successfully
- ✅ Both migrations applied (original + Phase 1 security features)
- ❌ Prisma Client not regenerated (TypeScript errors will persist until fixed)

## Impact
- Code will show TypeScript errors for new models (emailToken, session, activityLog)
- Runtime will fail if you try to use the new features
- Once Prisma client is regenerated, all errors will disappear

## Verification After Fix
```powershell
# Check if generation succeeded
cd apps/api
pnpm prisma generate

# Should see:
# "✔ Generated Prisma Client (v5.22.0) to ...node_modules\@prisma\client in XXms"

# Verify TypeScript recognizes new models
# Open apps/api/src/services/tokenService.ts
# TypeScript errors should be gone
```

## Prevention
- Always stop dev servers before running `prisma generate`
- Close VS Code before major schema changes
- Use `.\stop-dev.ps1` before running `.\reset-db.ps1`
