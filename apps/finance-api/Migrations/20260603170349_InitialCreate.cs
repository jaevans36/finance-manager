using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FinanceApi.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "finance");

            migrationBuilder.CreateTable(
                name: "Accounts",
                schema: "finance",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    Balance = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    Institution = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    AccountNumberSuffix = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ExcludeFromNetWorth = table.Column<bool>(type: "boolean", nullable: false),
                    Colour = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    Icon = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Accounts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Categories",
                schema: "finance",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ParentId = table.Column<Guid>(type: "uuid", nullable: true),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Colour = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    Icon = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IsSystem = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Categories_Categories_ParentId",
                        column: x => x.ParentId,
                        principalSchema: "finance",
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Transactions",
                schema: "finance",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    AccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: true),
                    ImportBatchId = table.Column<Guid>(type: "uuid", nullable: true),
                    Type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    BaseCurrencyAmount = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    OriginalDescription = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    Payee = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    TransactionDate = table.Column<DateOnly>(type: "date", nullable: false),
                    PostingDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Reference = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IsDuplicate = table.Column<bool>(type: "boolean", nullable: false),
                    IsRecurring = table.Column<bool>(type: "boolean", nullable: false),
                    IsReviewed = table.Column<bool>(type: "boolean", nullable: false),
                    ImportSource = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Transactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Transactions_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalSchema: "finance",
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Transactions_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalSchema: "finance",
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.InsertData(
                schema: "finance",
                table: "Categories",
                columns: new[] { "Id", "Colour", "CreatedAt", "Icon", "IsActive", "IsSystem", "Name", "ParentId", "UpdatedAt", "UserId" },
                values: new object[,]
                {
                    { new Guid("10000000-0000-0000-0000-000000000001"), "#22C55E", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "utensils", true, true, "Food & Drink", null, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000002"), "#3B82F6", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "car", true, true, "Transport", null, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000003"), "#8B5CF6", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "home", true, true, "Housing", null, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000004"), "#F59E0B", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "tv", true, true, "Entertainment", null, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000005"), "#EF4444", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "heart-pulse", true, true, "Health", null, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000006"), "#EC4899", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "shopping-bag", true, true, "Shopping", null, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000007"), "#F97316", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "zap", true, true, "Bills & Utilities", null, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000008"), "#0EA5E9", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "piggy-bank", true, true, "Savings", null, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000009"), "#10B981", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "trending-up", true, true, "Income", null, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000010"), "#6B7280", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "arrow-left-right", true, true, "Transfers", null, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000011"), "#94A3B8", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "circle-dot", true, true, "Other", null, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000101"), "#16A34A", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "shopping-cart", true, true, "Groceries", new Guid("10000000-0000-0000-0000-000000000001"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000102"), "#15803D", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "utensils", true, true, "Restaurants", new Guid("10000000-0000-0000-0000-000000000001"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000103"), "#78350F", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "coffee", true, true, "Coffee", new Guid("10000000-0000-0000-0000-000000000001"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000104"), "#991B1B", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "wine", true, true, "Alcohol", new Guid("10000000-0000-0000-0000-000000000001"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000201"), "#1D4ED8", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "fuel", true, true, "Fuel", new Guid("10000000-0000-0000-0000-000000000002"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000202"), "#2563EB", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "bus", true, true, "Public Transport", new Guid("10000000-0000-0000-0000-000000000002"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000203"), "#3B82F6", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "square-parking", true, true, "Parking", new Guid("10000000-0000-0000-0000-000000000002"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000204"), "#60A5FA", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "car-taxi-front", true, true, "Taxi / Ride Share", new Guid("10000000-0000-0000-0000-000000000002"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000701"), "#D97706", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "zap", true, true, "Electricity", new Guid("10000000-0000-0000-0000-000000000007"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000702"), "#B45309", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "flame", true, true, "Gas", new Guid("10000000-0000-0000-0000-000000000007"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000703"), "#F59E0B", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "wifi", true, true, "Broadband", new Guid("10000000-0000-0000-0000-000000000007"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000704"), "#FBBF24", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "smartphone", true, true, "Mobile Phone", new Guid("10000000-0000-0000-0000-000000000007"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000705"), "#FCD34D", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "repeat", true, true, "Subscriptions", new Guid("10000000-0000-0000-0000-000000000007"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000901"), "#059669", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "banknote", true, true, "Salary", new Guid("10000000-0000-0000-0000-000000000009"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000902"), "#10B981", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "briefcase", true, true, "Freelance", new Guid("10000000-0000-0000-0000-000000000009"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000903"), "#34D399", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "landmark", true, true, "Benefits", new Guid("10000000-0000-0000-0000-000000000009"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000904"), "#6EE7B7", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "trending-up", true, true, "Dividends", new Guid("10000000-0000-0000-0000-000000000009"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_UserId",
                schema: "finance",
                table: "Accounts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_ParentId",
                schema: "finance",
                table: "Categories",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_UserId",
                schema: "finance",
                table: "Categories",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_AccountId",
                schema: "finance",
                table: "Transactions",
                column: "AccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_CategoryId",
                schema: "finance",
                table: "Transactions",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_ImportBatchId",
                schema: "finance",
                table: "Transactions",
                column: "ImportBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_TransactionDate",
                schema: "finance",
                table: "Transactions",
                column: "TransactionDate");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_UserId",
                schema: "finance",
                table: "Transactions",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Transactions",
                schema: "finance");

            migrationBuilder.DropTable(
                name: "Accounts",
                schema: "finance");

            migrationBuilder.DropTable(
                name: "Categories",
                schema: "finance");
        }
    }
}
