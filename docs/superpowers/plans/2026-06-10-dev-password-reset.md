# Dev Password Reset Bypass — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dev-only, config-gated password reset endpoint and frontend page so developers can recover from a forgotten password without email.

**Architecture:** A `DevController` at `POST /api/v1/dev/reset-password` is double-gated by `IHostEnvironment.IsDevelopment()` and a `DevFeatures:AllowDirectPasswordReset` config flag — returning `404` if either guard fails. The frontend registers a `/dev/reset-password` route only when `VITE_ENABLE_DEV_RESET=true` is set in `.env.local`.

**Tech Stack:** .NET 8 / xUnit / Moq / FluentAssertions (backend); React 18 / TypeScript / Jest + RTL / shadcn/ui (frontend).

---

## File Map

### New files
| File | Responsibility |
|------|---------------|
| `apps/life-api/Features/Dev/Models/DevPasswordResetRequest.cs` | Request DTO with validation attributes |
| `apps/life-api/Features/Dev/Controllers/DevController.cs` | Single endpoint; both env + config guards inline |
| `apps/life-api-tests/LifeApi.UnitTests/Features/Dev/Controllers/DevControllerTests.cs` | Unit tests for the controller |
| `apps/web/src/services/devService.ts` | `resetPassword(email, newPassword)` via `apiClient` |
| `apps/web/src/pages/dev/DevPasswordResetPage.tsx` | Standalone reset form; no app shell |
| `apps/web/tests/components/DevPasswordResetPage.test.tsx` | Jest + RTL tests for the page |
| `docs/guides/DEV-PASSWORD-RESET.md` | Developer guide: enable, use, disable |

### Modified files
| File | Change |
|------|--------|
| `apps/life-api/appsettings.Development.json` | Add `DevFeatures` config block |
| `apps/web/.env.example` | Document `VITE_ENABLE_DEV_RESET` variable |
| `apps/web/src/App.tsx` | Conditional lazy import + route registration |
| `CLAUDE.md` | Add dev reset guide reference to scripts section |
| `docs/CURRENT_STATE.md` | Note the dev bypass under dev tooling |

---

## Task 1: Config changes

**Files:**
- Modify: `apps/life-api/appsettings.Development.json`
- Modify: `apps/web/.env.example`

- [ ] **Step 1: Add `DevFeatures` block to `appsettings.Development.json`**

The flag defaults to `false` — you opt in explicitly when you need it. Add after the closing `}` of the `RateLimit` block:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=life_manager_dev;Username=postgres;Password=password"
  },
  "RateLimit": {
    "Enabled": false,
    "MaxRequestsPerMinute": 1000,
    "MaxRequestsPerHour": 10000
  },
  "DevFeatures": {
    "AllowDirectPasswordReset": false
  }
}
```

- [ ] **Step 2: Document the env var in `.env.example`**

Append to `apps/web/.env.example`:

```
# Dev-only direct password reset bypass. Set to true to enable /dev/reset-password.
# Never set this in production. See docs/guides/DEV-PASSWORD-RESET.md
# VITE_ENABLE_DEV_RESET=false
```

- [ ] **Step 3: Commit**

```bash
git add apps/life-api/appsettings.Development.json apps/web/.env.example
git commit -m "config: add DevFeatures password reset flag and VITE_ENABLE_DEV_RESET env var"
```

---

## Task 2: Backend — model, controller tests, controller implementation

**Files:**
- Create: `apps/life-api/Features/Dev/Models/DevPasswordResetRequest.cs`
- Create: `apps/life-api/Features/Dev/Controllers/DevController.cs`
- Create: `apps/life-api-tests/LifeApi.UnitTests/Features/Dev/Controllers/DevControllerTests.cs`

- [ ] **Step 1: Write the failing tests**

Create `apps/life-api-tests/LifeApi.UnitTests/Features/Dev/Controllers/DevControllerTests.cs`:

```csharp
using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using LifeApi.Data;
using LifeApi.Features.Auth.Models;
using LifeApi.Features.Auth.Services;
using LifeApi.Features.Dev.Controllers;
using LifeApi.Features.Dev.Models;

namespace LifeApi.UnitTests.Features.Dev.Controllers;

public class DevControllerTests : IDisposable
{
    private readonly FinanceDbContext _context;
    private readonly Mock<IPasswordHasher> _mockPasswordHasher;
    private readonly Mock<ILogger<DevController>> _mockLogger;

    public DevControllerTests()
    {
        var options = new DbContextOptionsBuilder<FinanceDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new FinanceDbContext(options);
        _mockPasswordHasher = new Mock<IPasswordHasher>();
        _mockLogger = new Mock<ILogger<DevController>>();
    }

    private DevController CreateController(bool isDevelopment, bool flagEnabled)
    {
        var mockEnv = new Mock<IHostEnvironment>();
        mockEnv.Setup(e => e.EnvironmentName)
               .Returns(isDevelopment ? "Development" : "Production");

        var configData = new Dictionary<string, string?>
        {
            ["DevFeatures:AllowDirectPasswordReset"] = flagEnabled ? "true" : "false"
        };
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        return new DevController(
            mockEnv.Object,
            config,
            _context,
            _mockPasswordHasher.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async System.Threading.Tasks.Task ResetPassword_WhenNotDevelopment_Returns404()
    {
        var controller = CreateController(isDevelopment: false, flagEnabled: true);
        var request = new DevPasswordResetRequest { Email = "test@example.com", NewPassword = "Password1" };

        var result = await controller.ResetPassword(request);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async System.Threading.Tasks.Task ResetPassword_WhenFlagDisabled_Returns404()
    {
        var controller = CreateController(isDevelopment: true, flagEnabled: false);
        var request = new DevPasswordResetRequest { Email = "test@example.com", NewPassword = "Password1" };

        var result = await controller.ResetPassword(request);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async System.Threading.Tasks.Task ResetPassword_WhenUserNotFound_Returns404()
    {
        var controller = CreateController(isDevelopment: true, flagEnabled: true);
        var request = new DevPasswordResetRequest { Email = "nobody@example.com", NewPassword = "Password1" };

        var result = await controller.ResetPassword(request);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async System.Threading.Tasks.Task ResetPassword_WithValidRequest_UpdatesPasswordHash()
    {
        _context.Users.Add(new User
        {
            Email = "jay@example.com",
            Username = "jay",
            PasswordHash = "old-hash",
            FailedLoginAttempts = 3,
            AccountLockedUntil = DateTime.UtcNow.AddMinutes(10)
        });
        await _context.SaveChangesAsync();

        _mockPasswordHasher
            .Setup(h => h.HashPassword("NewPass1!"))
            .Returns("new-hash");

        var controller = CreateController(isDevelopment: true, flagEnabled: true);
        var request = new DevPasswordResetRequest { Email = "jay@example.com", NewPassword = "NewPass1!" };

        var result = await controller.ResetPassword(request);

        result.Should().BeOfType<OkObjectResult>();
        var user = await _context.Users.FirstAsync(u => u.Email == "jay@example.com");
        user.PasswordHash.Should().Be("new-hash");
        user.FailedLoginAttempts.Should().Be(0);
        user.AccountLockedUntil.Should().BeNull();
    }

    public void Dispose() => _context.Dispose();
}
```

- [ ] **Step 2: Run tests to confirm they fail (type/namespace not found)**

```bash
cd "apps/life-api-tests/LifeApi.UnitTests"
dotnet test --filter "FullyQualifiedName~DevControllerTests" --no-build 2>&1 | head -30
```

Expected: build error — `DevController` and `DevPasswordResetRequest` do not exist yet.

- [ ] **Step 3: Create the request model**

Create `apps/life-api/Features/Dev/Models/DevPasswordResetRequest.cs`:

```csharp
using System.ComponentModel.DataAnnotations;

namespace LifeApi.Features.Dev.Models;

public class DevPasswordResetRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters.")]
    [RegularExpression(
        @"^(?=.*[A-Z])(?=.*\d).+$",
        ErrorMessage = "Password must contain at least one uppercase letter and one digit.")]
    public string NewPassword { get; set; } = string.Empty;
}
```

- [ ] **Step 4: Create the controller**

Create `apps/life-api/Features/Dev/Controllers/DevController.cs`:

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using LifeApi.Data;
using LifeApi.Features.Auth.Services;
using LifeApi.Features.Dev.Models;

namespace LifeApi.Features.Dev.Controllers;

[ApiController]
[Route("api/v1/dev")]
public class DevController : ControllerBase
{
    private readonly IHostEnvironment _env;
    private readonly IConfiguration _config;
    private readonly FinanceDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILogger<DevController> _logger;

    public DevController(
        IHostEnvironment env,
        IConfiguration config,
        FinanceDbContext context,
        IPasswordHasher passwordHasher,
        ILogger<DevController> logger)
    {
        _env = env;
        _config = config;
        _context = context;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    [HttpPost("reset-password")]
    public async System.Threading.Tasks.Task<IActionResult> ResetPassword(
        [FromBody] DevPasswordResetRequest request)
    {
        if (!_env.IsDevelopment() ||
            !_config.GetValue<bool>("DevFeatures:AllowDirectPasswordReset"))
        {
            return NotFound();
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null)
            return NotFound();

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        user.FailedLoginAttempts = 0;
        user.AccountLockedUntil = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogWarning("[DEV] Direct password reset used for {Email}", request.Email);

        return Ok(new { message = "Password reset successfully." });
    }
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
cd "apps/life-api-tests/LifeApi.UnitTests"
dotnet test --filter "FullyQualifiedName~DevControllerTests" -v normal
```

Expected output:
```
DevControllerTests
  [PASS] ResetPassword_WhenNotDevelopment_Returns404
  [PASS] ResetPassword_WhenFlagDisabled_Returns404
  [PASS] ResetPassword_WhenUserNotFound_Returns404
  [PASS] ResetPassword_WithValidRequest_UpdatesPasswordHash
```

- [ ] **Step 6: Run the full test suite to check for regressions**

```bash
cd "c:/Projects/Finance Manager"
.\run-tests.ps1
```

Expected: all existing tests still pass.

- [ ] **Step 7: Commit**

```bash
git add apps/life-api/Features/Dev/ apps/life-api-tests/LifeApi.UnitTests/Features/Dev/
git commit -m "feat: add dev-only direct password reset endpoint with config gate"
```

---

## Task 3: Frontend service

**Files:**
- Create: `apps/web/src/services/devService.ts`

- [ ] **Step 1: Create `devService.ts`**

```typescript
import { apiClient } from './api-client';

export const devService = {
  async resetPassword(email: string, newPassword: string): Promise<void> {
    await apiClient.post('/dev/reset-password', { email, newPassword });
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/services/devService.ts
git commit -m "feat: add devService.resetPassword for dev password bypass"
```

---

## Task 4: Frontend page — tests then implementation

**Files:**
- Create: `apps/web/tests/components/DevPasswordResetPage.test.tsx`
- Create: `apps/web/src/pages/dev/DevPasswordResetPage.tsx`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/tests/components/DevPasswordResetPage.test.tsx`:

```tsx
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders as render } from '../utils/test-utils';
import DevPasswordResetPage from '../../src/pages/dev/DevPasswordResetPage';
import { devService } from '../../src/services/devService';

jest.mock('../../src/services/devService');
const mockDevService = devService as jest.Mocked<typeof devService>;

describe('DevPasswordResetPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the dev warning banner', () => {
    render(<DevPasswordResetPage />);
    expect(screen.getByText(/Dev mode only/i)).toBeInTheDocument();
  });

  it('renders email, new password, and confirm password fields', () => {
    render(<DevPasswordResetPage />);
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    render(<DevPasswordResetPage />);
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('New password'), {
      target: { value: 'Password1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), {
      target: { value: 'Different1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Reset password/i }));

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
  });

  it('calls devService.resetPassword with correct args and shows success', async () => {
    mockDevService.resetPassword.mockResolvedValue(undefined);
    render(<DevPasswordResetPage />);
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'jay@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('New password'), {
      target: { value: 'Password1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), {
      target: { value: 'Password1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Reset password/i }));

    expect(await screen.findByText(/Password reset successfully/i)).toBeInTheDocument();
    expect(mockDevService.resetPassword).toHaveBeenCalledWith('jay@example.com', 'Password1');
  });

  it('shows API error message on failure', async () => {
    mockDevService.resetPassword.mockRejectedValue({
      response: { data: { error: { message: 'User not found' } } },
    });
    render(<DevPasswordResetPage />);
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'nobody@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('New password'), {
      target: { value: 'Password1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), {
      target: { value: 'Password1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Reset password/i }));

    expect(await screen.findByText('User not found')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail (module not found)**

```bash
cd "apps/web"
npx jest tests/components/DevPasswordResetPage.test.tsx --no-coverage 2>&1 | tail -20
```

Expected: test run fails with "Cannot find module '../../src/pages/dev/DevPasswordResetPage'".

- [ ] **Step 3: Create the page**

Create `apps/web/src/pages/dev/DevPasswordResetPage.tsx`:

```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { devService } from '../../services/devService';
import { getErrorMessage } from '../../utils/errorHelpers';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const DevPasswordResetPage = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await devService.resetPassword(email, newPassword);
      setSuccess(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to reset password.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Password reset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="success">
              <AlertDescription>
                Password reset successfully. You can now{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary hover:underline"
                >
                  log in
                </Link>{' '}
                with your new password.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Dev: Reset password</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              Dev mode only — this page does not exist in production.
            </AlertDescription>
          </Alert>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <Input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Resetting...' : 'Reset password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevPasswordResetPage;
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd "apps/web"
npx jest tests/components/DevPasswordResetPage.test.tsx --no-coverage
```

Expected:
```
PASS tests/components/DevPasswordResetPage.test.tsx
  DevPasswordResetPage
    ✓ renders the dev warning banner
    ✓ renders email, new password, and confirm password fields
    ✓ shows error when passwords do not match
    ✓ calls devService.resetPassword with correct args and shows success
    ✓ shows API error message on failure
```

- [ ] **Step 5: Run the full frontend test suite**

```bash
cd "apps/web"
npx jest --no-coverage 2>&1 | tail -10
```

Expected: all existing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/dev/ apps/web/tests/components/DevPasswordResetPage.test.tsx
git commit -m "feat: add DevPasswordResetPage with dev warning banner and form"
```

---

## Task 5: Route registration

**Files:**
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Add the conditional lazy import**

In `apps/web/src/App.tsx`, add after the last existing `const ... = lazy(...)` line (currently line 43, `FinancePage`):

```tsx
const DevPasswordResetPage = import.meta.env.VITE_ENABLE_DEV_RESET === 'true'
  ? lazy(() => import('./pages/dev/DevPasswordResetPage'))
  : null;
```

- [ ] **Step 2: Register the conditional route**

In `App.tsx`, inside the `<Routes>` block, add after the `/resend-verification` route (currently around line 113):

```tsx
{DevPasswordResetPage && (
  <Route path="/dev/reset-password" element={<DevPasswordResetPage />} />
)}
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```bash
cd "apps/web"
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/App.tsx
git commit -m "feat: register /dev/reset-password route when VITE_ENABLE_DEV_RESET=true"
```

---

## Task 6: Documentation

**Files:**
- Create: `docs/guides/DEV-PASSWORD-RESET.md`
- Modify: `CLAUDE.md`
- Modify: `docs/CURRENT_STATE.md`

- [ ] **Step 1: Create the developer guide**

Create `docs/guides/DEV-PASSWORD-RESET.md`:

```markdown
# Dev Password Reset Bypass

A local-only tool for resetting a forgotten password when the email reset flow is unavailable.

> **Security:** The bypass endpoint returns `404` in all non-development environments and when the flag is disabled. It cannot be activated in production.

---

## How to enable

1. In `apps/life-api/appsettings.Development.json`, set:
   ```json
   "DevFeatures": {
     "AllowDirectPasswordReset": true
   }
   ```
2. In `apps/web/.env.local`, add:
   ```
   VITE_ENABLE_DEV_RESET=true
   ```
3. Restart the API (`.\restart-dev.ps1`).

---

## How to use

Navigate to: `http://localhost:5173/dev/reset-password`

Enter your email address and a new password (min 8 chars, one uppercase, one digit). On success a confirmation message is shown — no redirect. Log in normally afterwards.

---

## How to disable

Set both flags back to `false` (or remove `VITE_ENABLE_DEV_RESET` from `.env.local`) and restart the API. The page will no longer exist in the frontend bundle and the endpoint will return `404`.

---

## Security notes

- The endpoint is double-gated: `ASPNETCORE_ENVIRONMENT=Development` **and** `DevFeatures:AllowDirectPasswordReset=true`
- When either guard fails the endpoint returns `404 Not Found` — indistinguishable from any missing route
- Every use is logged as a Serilog `Warning` entry in the API console
- The frontend route is absent from production builds (Vite tree-shakes the dead import)
```

- [ ] **Step 2: Add guide reference to `CLAUDE.md`**

In `CLAUDE.md`, find the line:
```
.\scripts\reset-user-password.ps1 -Email "..." -NewPassword "..."  # Reset a user's password
```
Add immediately after it (still inside the code block):
```
# Dev UI bypass: enable DevFeatures:AllowDirectPasswordReset + VITE_ENABLE_DEV_RESET, visit /dev/reset-password. See docs/guides/DEV-PASSWORD-RESET.md
```

- [ ] **Step 3: Add a note to `docs/CURRENT_STATE.md`**

Under the **Technical Foundation (Complete)** section, find the bullet point that mentions backup/restore scripts or production setup, and add:

```markdown
- **Dev password reset bypass** — `/dev/reset-password` page and `POST /api/v1/dev/reset-password` endpoint, double-gated by environment + config flag; see `docs/guides/DEV-PASSWORD-RESET.md`
```

- [ ] **Step 4: Commit**

```bash
git add docs/guides/DEV-PASSWORD-RESET.md CLAUDE.md docs/CURRENT_STATE.md
git commit -m "docs: add dev password reset guide and references in CLAUDE.md and CURRENT_STATE.md"
```

---

## Task 7: End-to-end smoke test

- [ ] **Step 1: Enable both flags**

In `apps/life-api/appsettings.Development.json`, set `AllowDirectPasswordReset` to `true`.

In `apps/web/.env.local`, add `VITE_ENABLE_DEV_RESET=true`.

- [ ] **Step 2: Start the app**

```powershell
.\restart-dev.ps1
```

- [ ] **Step 3: Verify the endpoint exists**

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/dev/reset-password" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"your@email.com","newPassword":"NewPass1!"}'
```

Expected: `{ "message": "Password reset successfully." }`

- [ ] **Step 4: Verify the page loads**

Open `http://localhost:5173/dev/reset-password` in a browser. Confirm the warning banner and form are visible.

- [ ] **Step 5: Perform a full reset via the UI**

Enter your email and a new password in the UI form, submit, and confirm the success message appears. Log in at `/login` with the new password.

- [ ] **Step 6: Disable the flags and verify the bypass is gone**

Set both flags back to `false`. Restart. Confirm:
- `http://localhost:5173/dev/reset-password` returns the 404 page
- The API endpoint returns `404`

- [ ] **Step 7: Reset flags to `false` before committing**

Make sure `AllowDirectPasswordReset` is `false` in `appsettings.Development.json` before the final commit so the bypass is opt-in by default.

```bash
git add apps/life-api/appsettings.Development.json
git commit -m "config: ensure DevFeatures.AllowDirectPasswordReset defaults to false"
```
