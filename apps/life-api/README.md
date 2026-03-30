# Finance API (C# .NET)

ASP.NET Core Web API for managing financial transactions, accounts, budgets, and categories.

## Prerequisites

- .NET 8.0 SDK or higher
- PostgreSQL database (shared with Node.js API)

## Getting Started

### Install Dependencies

The dependencies are already configured in the `.csproj` file. To restore them:

```powershell
dotnet restore
```

### Database Migrations

Create and apply migrations:

```powershell
# Create initial migration
dotnet ef migrations add InitialCreate

# Apply migrations to database
dotnet ef database update
```

### Running the API

```powershell
# Development mode (hot reload enabled)
dotnet watch run

# Or standard run
dotnet run
```

The API will start on:
- HTTP: `http://localhost:5000`
- HTTPS: `https://localhost:5001`
- Swagger UI: `http://localhost:5000/swagger`

## Project Structure

```
finance-api/
├── Controllers/        # API endpoints
├── Models/            # Entity models (Account, Transaction, Category, Budget)
├── Data/              # EF Core DbContext
├── Services/          # Business logic (to be added)
├── Migrations/        # EF Core migrations
├── Tests/             # xUnit tests (to be added)
└── Program.cs         # Application entry point
```

## Configuration

The API uses `appsettings.json` and `appsettings.Development.json` for configuration:

- **Database**: PostgreSQL connection string
- **JWT**: Secret key (must match Node.js API for token compatibility)
- **CORS**: Configured for React frontend (http://localhost:5173)

## Entity Models

### Account
- User's bank accounts (checking, savings, credit, investment)
- Tracks balance and institution details

### Transaction
- Financial transactions linked to accounts
- Supports categorization and reconciliation

### Category
- Hierarchical categories for income/expense tracking
- Supports parent-child relationships

### Budget
- Budget tracking by category
- Supports different periods (monthly, yearly, weekly)

## API Endpoints

### Health Check
- `GET /api/v1/health` - Check API status

### Accounts (To be implemented)
- `GET /api/v1/accounts` - List user accounts
- `POST /api/v1/accounts` - Create account
- `PUT /api/v1/accounts/{id}` - Update account
- `DELETE /api/v1/accounts/{id}` - Delete account

### Transactions (To be implemented)
- `GET /api/v1/transactions` - List transactions
- `POST /api/v1/transactions` - Create transaction
- `POST /api/v1/transactions/import` - Import from CSV
- `PUT /api/v1/transactions/{id}` - Update transaction
- `DELETE /api/v1/transactions/{id}` - Delete transaction

### Categories (To be implemented)
- `GET /api/v1/categories` - List categories
- `POST /api/v1/categories` - Create category
- `PUT /api/v1/categories/{id}` - Update category
- `DELETE /api/v1/categories/{id}` - Delete category

### Budgets (To be implemented)
- `GET /api/v1/budgets` - List budgets
- `POST /api/v1/budgets` - Create budget
- `PUT /api/v1/budgets/{id}` - Update budget
- `DELETE /api/v1/budgets/{id}` - Delete budget

## Authentication

The API uses JWT authentication compatible with the Node.js API. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

The token should be obtained from the Node.js auth API (`/api/v1/auth/login` or `/api/v1/auth/register`).

## Testing

```powershell
# Run all tests
dotnet test

# Run tests with coverage
dotnet test /p:CollectCoverage=true
```

## Development Tips

### EF Core CLI Commands

```powershell
# Add migration
dotnet ef migrations add <MigrationName>

# Update database
dotnet ef database update

# Rollback migration
dotnet ef database update <PreviousMigration>

# Remove last migration (if not applied)
dotnet ef migrations remove

# Generate SQL script
dotnet ef migrations script
```

### Watch Mode
Development with hot reload:

```powershell
dotnet watch run
```

Changes to C# files will automatically rebuild and restart the API.
