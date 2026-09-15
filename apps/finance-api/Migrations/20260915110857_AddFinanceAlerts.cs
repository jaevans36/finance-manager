using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceApi.Migrations
{
    /// <inheritdoc />
    public partial class AddFinanceAlerts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "NotificationRuns",
                schema: "finance",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RunDate = table.Column<DateOnly>(type: "date", nullable: false),
                    CompletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationRuns", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RecurringPaymentBaselines",
                schema: "finance",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    MerchantName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    AccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    LastAlertedAmount = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    LastAlertedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecurringPaymentBaselines", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_NotificationRuns_RunDate",
                schema: "finance",
                table: "NotificationRuns",
                column: "RunDate",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RecurringPaymentBaselines_UserId_MerchantName_AccountId",
                schema: "finance",
                table: "RecurringPaymentBaselines",
                columns: new[] { "UserId", "MerchantName", "AccountId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NotificationRuns",
                schema: "finance");

            migrationBuilder.DropTable(
                name: "RecurringPaymentBaselines",
                schema: "finance");
        }
    }
}
