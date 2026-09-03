using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FinanceApi.Migrations
{
    /// <inheritdoc />
    public partial class AddBillCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                schema: "finance",
                table: "Categories",
                columns: new[] { "Id", "Colour", "CreatedAt", "Icon", "IsActive", "IsSystem", "Name", "ParentId", "UpdatedAt", "UserId" },
                values: new object[,]
                {
                    { new Guid("10000000-0000-0000-0000-000000000012"), "#B91C1C", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "credit-card", true, true, "Debt Repayment", null, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000706"), "#0891B2", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "droplet", true, true, "Water", new Guid("10000000-0000-0000-0000-000000000007"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000707"), "#CA8A04", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "landmark", true, true, "Council Tax", new Guid("10000000-0000-0000-0000-000000000007"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000708"), "#EA580C", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "tv", true, true, "TV Licence", new Guid("10000000-0000-0000-0000-000000000007"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000709"), "#4F46E5", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "shield", true, true, "Insurance", new Guid("10000000-0000-0000-0000-000000000007"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000710"), "#DB2777", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "clapperboard", true, true, "Streaming & Media", new Guid("10000000-0000-0000-0000-000000000007"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000001201"), "#DC2626", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "credit-card", true, true, "Credit Card Payment", new Guid("10000000-0000-0000-0000-000000000012"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000001202"), "#EA580C", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "hand-coins", true, true, "Loan Repayment", new Guid("10000000-0000-0000-0000-000000000012"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000001203"), "#C2410C", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "home", true, true, "Mortgage Payment", new Guid("10000000-0000-0000-0000-000000000012"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                schema: "finance",
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000706"));

            migrationBuilder.DeleteData(
                schema: "finance",
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000707"));

            migrationBuilder.DeleteData(
                schema: "finance",
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000708"));

            migrationBuilder.DeleteData(
                schema: "finance",
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000709"));

            migrationBuilder.DeleteData(
                schema: "finance",
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000710"));

            migrationBuilder.DeleteData(
                schema: "finance",
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("10000000-0000-0000-0000-000000001201"));

            migrationBuilder.DeleteData(
                schema: "finance",
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("10000000-0000-0000-0000-000000001202"));

            migrationBuilder.DeleteData(
                schema: "finance",
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("10000000-0000-0000-0000-000000001203"));

            migrationBuilder.DeleteData(
                schema: "finance",
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000012"));
        }
    }
}
