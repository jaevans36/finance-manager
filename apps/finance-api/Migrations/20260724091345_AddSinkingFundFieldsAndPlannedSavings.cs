using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceApi.Migrations
{
    /// <inheritdoc />
    public partial class AddSinkingFundFieldsAndPlannedSavings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AccumulatedAmount",
                schema: "finance",
                table: "SpendingPots",
                type: "numeric(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "AnnualAmount",
                schema: "finance",
                table: "SpendingPots",
                type: "numeric(18,4)",
                precision: 18,
                scale: 4,
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "NextPaymentDate",
                schema: "finance",
                table: "SpendingPots",
                type: "date",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AccumulatedAmount",
                schema: "finance",
                table: "SpendingPots");

            migrationBuilder.DropColumn(
                name: "AnnualAmount",
                schema: "finance",
                table: "SpendingPots");

            migrationBuilder.DropColumn(
                name: "NextPaymentDate",
                schema: "finance",
                table: "SpendingPots");
        }
    }
}
