using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FinanceApi.Migrations
{
    /// <inheritdoc />
    public partial class ConsolidateUtilityCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Reassign anything still pointing at Gas/Water to Electricity (being renamed to
            // "Utilities" below) before dropping those rows — otherwise the CategoryId FK's
            // SetNull behaviour would silently blank the category on affected rows instead.
            migrationBuilder.Sql(@"
                UPDATE finance.""Bills"" SET ""CategoryId"" = '10000000-0000-0000-0000-000000000701'
                WHERE ""CategoryId"" IN ('10000000-0000-0000-0000-000000000702', '10000000-0000-0000-0000-000000000706');
                UPDATE finance.""Transactions"" SET ""CategoryId"" = '10000000-0000-0000-0000-000000000701'
                WHERE ""CategoryId"" IN ('10000000-0000-0000-0000-000000000702', '10000000-0000-0000-0000-000000000706');
                UPDATE finance.""Budgets"" SET ""CategoryId"" = '10000000-0000-0000-0000-000000000701'
                WHERE ""CategoryId"" IN ('10000000-0000-0000-0000-000000000702', '10000000-0000-0000-0000-000000000706');
                UPDATE finance.""CategoryRules"" SET ""CategoryId"" = '10000000-0000-0000-0000-000000000701'
                WHERE ""CategoryId"" IN ('10000000-0000-0000-0000-000000000702', '10000000-0000-0000-0000-000000000706');
            ");

            migrationBuilder.DeleteData(
                schema: "finance",
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000702"));

            migrationBuilder.DeleteData(
                schema: "finance",
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000706"));

            migrationBuilder.UpdateData(
                schema: "finance",
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000701"),
                column: "Name",
                value: "Utilities");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                schema: "finance",
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000701"),
                column: "Name",
                value: "Electricity");

            migrationBuilder.InsertData(
                schema: "finance",
                table: "Categories",
                columns: new[] { "Id", "Colour", "CreatedAt", "Icon", "IsActive", "IsSystem", "Name", "ParentId", "UpdatedAt", "UserId" },
                values: new object[,]
                {
                    { new Guid("10000000-0000-0000-0000-000000000702"), "#B45309", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "flame", true, true, "Gas", new Guid("10000000-0000-0000-0000-000000000007"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { new Guid("10000000-0000-0000-0000-000000000706"), "#0891B2", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "droplet", true, true, "Water", new Guid("10000000-0000-0000-0000-000000000007"), new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null }
                });
        }
    }
}
