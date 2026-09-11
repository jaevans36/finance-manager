# Finance API

ASP.NET Core 8 microservice providing personal finance management — accounts, transactions, categories, and bank CSV import.

---

## Quick Start

```powershell
# From repo root — starts everything (DB + life-api + finance-api + web):
.\scripts\start-dev.ps1

# Finance API only (DB must already be running):
cd apps/finance-api
dotnet watch run --launch-profile http
```

- **Dev URL**: http://localhost:5002  
- **Swagger UI**: http://localhost:5002/swagger  
- **Health check**: http://localhost:5002/api/v1/finance/health

---

## Architecture

```
apps/
  life-api/        ← Life Manager core API  (port 5000)  — auth, todos, fitness
  finance-api/     ← Finance API            (port 5002)  — this service
  web/             ← React/Vite frontend    (port 5173)
```

### Authentication

Finance API shares the **same JWT tokens** issued by life-api. When a user logs in via `/api/auth/login` on life-api they receive a Bearer token. All finance endpoints require that token in `Authorization: Bearer <token>`.

The Finance API validates tokens using the same secret, issuer, and audience — it does not issue tokens itself.

```
appsettings.json:
  Jwt:Secret    — must match life-api
  Jwt:Issuer    — must match life-api
  Jwt:Audience  — must match life-api
```

### Database Isolation

Finance API uses the **`finance` schema** inside the shared `life_manager_dev` PostgreSQL database. This keeps finance tables completely isolated from life-api's `public` schema while sharing the same DB instance in development.

```
PostgreSQL database: life_manager_dev
  public schema   → life-api tables (users, todos, etc.)
  finance schema  → accounts, transactions, categories
```

In production, these could be split into separate databases without changing application code — just update the connection string.

---

## Project Structure

```
apps/finance-api/
  Program.cs                        ← Bootstrap: DI, JWT, EF Core, Serilog, CORS
  appsettings.json                  ← DB connection, JWT config, CORS origins
  appsettings.Development.json      ← Dev overrides (EF log level)
  Dockerfile                        ← Multi-stage build (aspnet:8.0 runtime)
  Data/
    FinanceDbContext.cs             ← EF Core context, schema config, category seeds
  Features/
    Accounts/
      Models/Account.cs            ← Account entity + AccountType enum
      Services/AccountService.cs   ← CRUD + net worth calculation
      Controllers/AccountsController.cs
    Transactions/
      Models/Transaction.cs        ← Transaction entity + enums
      Services/TransactionService.cs  ← CRUD + paginated search + balance updates
      Services/CsvImportService.cs    ← 7 bank CSV parsers + duplicate detection
      Controllers/TransactionsController.cs
    Categories/
      Models/Category.cs           ← Category entity (self-referencing hierarchy)
      Services/CategoryService.cs  ← Get all (system + user), create, soft delete
      Controllers/CategoriesController.cs
    Health/
      Controllers/HealthController.cs  ← Unauthenticated health endpoint
  Migrations/                       ← EF Core migrations
```

---

## API Endpoints

All endpoints require `Authorization: Bearer <token>` except `/health`.

### Accounts — `api/v1/finance/accounts`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/accounts` | List all accounts for authenticated user |
| GET | `/accounts/{id}` | Get single account |
| POST | `/accounts` | Create account |
| PATCH | `/accounts/{id}` | Update account fields |
| DELETE | `/accounts/{id}` | Soft delete (sets `IsActive = false`) |
| GET | `/accounts/net-worth` | Sum of active, non-excluded account balances |

**Account types**: `Checking`, `Savings`, `Credit`, `CashIsa`, `StocksIsa`, `Sipp`, `PremiumBonds`, `LifetimeIsa`, `Investment`, `Mortgage`, `Loan`, `Other`

### Transactions — `api/v1/finance/transactions`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/transactions` | Paginated list with optional filters |
| GET | `/transactions/{id}` | Get single transaction |
| POST | `/transactions` | Create transaction (adjusts account balance) |
| PATCH | `/transactions/{id}` | Update transaction fields |
| DELETE | `/transactions/{id}` | Delete transaction (reverses balance adjustment) |
| POST | `/transactions/import` | Upload CSV file (multipart/form-data) |
| GET | `/transactions/import/formats` | List supported bank formats |

**GET /transactions query parameters**:
- `accountId` — filter by account
- `startDate`, `endDate` — ISO date range
- `categoryId` — filter by category
- `type` — `Debit`, `Credit`, or `Transfer`
- `search` — text search on description/payee
- `page` (default 1), `pageSize` (default 50)

**POST /transactions/import form fields**:
- `file` — CSV file (`.csv` or `.txt`, max 10 MB)
- `accountId` — account to import into
- `bankFormat` — `Barclays`, `HSBC`, `Lloyds`, `Monzo`, `Starling`, `NatWest`, or `Generic`

### Categories — `api/v1/finance/categories`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/categories` | All system categories + user's custom categories |
| POST | `/categories` | Create custom category |
| DELETE | `/categories/{id}` | Delete custom category (cannot delete system categories) |

### Health — `api/v1/finance/health`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Returns `{status, service, timestamp}` |

---

## Data Models

### Account
```csharp
string UserId       // From JWT claim
string Name         // e.g. "Current Account"
AccountType Type    // Enum — see account types above
string Currency     // ISO 4217, default "GBP"
decimal Balance     // Current balance
string? Institution // Bank name
string? AccountNumberSuffix  // Last 4 digits
bool IsActive       // Soft delete flag
bool ExcludeFromNetWorth     // Exclude from net worth calculation
string? Colour, Icon
```

### Transaction
```csharp
string UserId, AccountId
Guid? CategoryId
Guid? ImportBatchId       // Groups transactions from a single CSV import
decimal Amount            // Always positive
decimal BaseCurrencyAmount // In GBP
string Currency           // ISO 4217
TransactionType Type      // Debit, Credit, Transfer
string Description        // Normalised description
string? OriginalDescription  // Raw text from bank
string? Payee, Reference
DateTime TransactionDate, PostingDate
bool IsDuplicate, IsRecurring, IsReviewed
ImportSource Source       // Manual, CsvImport, BankSync
```

### Category
```csharp
string Name
string? ParentId      // Self-referencing hierarchy
string? UserId        // null = system category
bool IsSystem         // System categories cannot be deleted
string? Colour, Icon
bool IsActive         // Soft delete flag
```

---

## CSV Import

### Supported bank formats

| Format | Date column | Amount columns | Notes |
|--------|------------|----------------|-------|
| `Barclays` | `Date` | `Amount` (signed) | |
| `HSBC` | `Date` | `Credit Amount`, `Debit Amount` | |
| `Lloyds` | `Transaction Date` | `Credit Amount`, `Debit Amount` | |
| `Monzo` | `Date` | `Amount` (signed) | |
| `Starling` | `Date` | `Amount` (signed) | |
| `NatWest` | `Date` | `Credit Amount`, `Debit Amount` | |
| `Generic` | `Date` | `Amount` (signed) | Fallback for other banks |

### Duplicate detection
A transaction is marked as a duplicate if an existing transaction exists with the same `AccountId`, `TransactionDate`, `Amount`, and `OriginalDescription`. Duplicates are imported with `IsDuplicate = true` rather than rejected, allowing manual review.

### Adding a new bank format
1. Add the format name to the `BankFormat` enum in `Transaction.cs`
2. Add a parser method `Parse<BankName>Csv()` in `CsvImportService.cs` following the pattern of existing parsers
3. Add a `case BankFormat.<BankName>:` branch in `ImportAsync()`
4. Add the new format to the `GetSupportedFormats()` return list

---

## Configuration

### appsettings.json keys

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=...;Port=5432;Database=life_manager_dev;Username=postgres;Password=..."
  },
  "Jwt": {
    "Secret": "your-secret-key-change-in-production",
    "Issuer": "life-manager-dev",
    "Audience": "life-manager-dev",
    "ExpiresInMinutes": 60
  },
  "Encryption": {
    "Key": "base64-encoded 32-byte AES-256 key — see Column Encryption below"
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:5173"]
  },
  "Serilog": { ... }
}
```

### Environment variables (override appsettings)

| Variable | Description |
|----------|-------------|
| `ASPNETCORE_ENVIRONMENT` | `Development`, `Production` |
| `ConnectionStrings__DefaultConnection` | Full PostgreSQL connection string |
| `Jwt__Secret` | JWT signing secret (must match life-api) |
| `Encryption__Key` | Base64 AES-256 key for column encryption (see below) — no default, app fails to start without it |

---

## Column Encryption

Free-text fields that are never used in SQL `WHERE`/`GROUP BY`/`.Contains()` (account names,
institution, notes, bill/budget/pot/goal names, category-rule patterns) are encrypted at rest
with AES-256-GCM, via an EF Core `ValueConverter` (`Infrastructure/Encryption/`). Transaction
amounts/balances and transaction description/payee fields stay plaintext — they're required by
SQL-side aggregation, search, and CSV-import dedup, and encrypting them would need those features
rewritten. See the "Column Encryption" ADR in `docs/ARCHITECTURAL_DECISIONS.md` for the full
field-by-field reasoning.

Stored values are prefixed `ENC1:` so a decrypt against not-yet-migrated plaintext fails loudly
instead of throwing a cryptic AES error.

### One-time setup for an existing database

Applies once, the first time this feature is deployed to a database that already has data in the
encrypted columns (a brand-new database just needs `Encryption:Key` configured — migrations
create the columns as `text` from the start).

1. **Back up first** — `pg_dump` the database. This changes data in place; make sure you can
   roll back.
2. **Stop the app** if it's running — starting it normally between steps 3 and 4 would apply the
   encrypting `ValueConverter` against still-plaintext data and every read would throw.
3. Apply the schema migration only (widens the encrypted columns to `text`, touches no data):
   ```powershell
   cd apps/finance-api
   dotnet ef database update
   ```
4. Run the one-time backfill (encrypts existing plaintext rows in place; safe to re-run — it
   skips rows already prefixed `ENC1:`):
   ```powershell
   dotnet run --project apps/finance-api -- --backfill-encrypt-columns
   ```
5. Start the app normally.

---

## Database Migrations

```powershell
# Ensure dotnet-ef is installed:
dotnet tool install --global dotnet-ef

# Add migration (run from apps/finance-api):
cd apps/finance-api
dotnet ef migrations add <MigrationName>

# Apply migrations (also runs automatically on startup):
dotnet ef database update

# List applied migrations:
dotnet ef migrations list
```

Migrations run automatically on startup via `dbContext.Database.MigrateAsync()` in `Program.cs`.

---

## Docker

```bash
# Build image:
docker build -t finance-api ./apps/finance-api

# Run standalone (DB must be accessible):
docker run -p 5002:8080 \
  -e ConnectionStrings__DefaultConnection="Host=host.docker.internal;..." \
  -e Jwt__Secret="your-secret" \
  finance-api
```

The service is included in `docker-compose.yml` as `finance-api` — use `docker compose up -d` from the repo root.

---

## Logs

Serilog writes to:
- Console (Development)
- `logs/api/finance-api-YYYYMMDD.log` (rolling daily, 7-day retention)

---

## Tests

Tests live in `apps/life-api-tests/` (shared test project). Finance API unit and integration tests are tracked as T1173–T1175 (not yet implemented).

```powershell
# Run all tests from repo root:
.\scripts\run-tests.ps1
```
