using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceApi.Migrations
{
    /// <inheritdoc />
    public partial class AddDebtPaymentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CurrentMonthlyPayment",
                schema: "finance",
                table: "Accounts",
                type: "numeric(18,4)",
                precision: 18,
                scale: 4,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsInterestOnly",
                schema: "finance",
                table: "Accounts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateOnly>(
                name: "LoanEndDate",
                schema: "finance",
                table: "Accounts",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MinimumMonthlyPayment",
                schema: "finance",
                table: "Accounts",
                type: "numeric(18,4)",
                precision: 18,
                scale: 4,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CurrentMonthlyPayment",
                schema: "finance",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "IsInterestOnly",
                schema: "finance",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "LoanEndDate",
                schema: "finance",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "MinimumMonthlyPayment",
                schema: "finance",
                table: "Accounts");
        }
    }
}
