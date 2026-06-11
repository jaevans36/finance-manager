using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceApi.Migrations
{
    /// <inheritdoc />
    public partial class AddCreditAccountFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CreditLimit",
                schema: "finance",
                table: "Accounts",
                type: "numeric(18,4)",
                precision: 18,
                scale: 4,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "InterestRate",
                schema: "finance",
                table: "Accounts",
                type: "numeric(6,3)",
                precision: 6,
                scale: 3,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PromotionalBalance",
                schema: "finance",
                table: "Accounts",
                type: "numeric(18,4)",
                precision: 18,
                scale: 4,
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "PromotionalExpiry",
                schema: "finance",
                table: "Accounts",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PromotionalRate",
                schema: "finance",
                table: "Accounts",
                type: "numeric(6,3)",
                precision: 6,
                scale: 3,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PromotionalRevertRate",
                schema: "finance",
                table: "Accounts",
                type: "numeric(6,3)",
                precision: 6,
                scale: 3,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreditLimit",
                schema: "finance",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "InterestRate",
                schema: "finance",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "PromotionalBalance",
                schema: "finance",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "PromotionalExpiry",
                schema: "finance",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "PromotionalRate",
                schema: "finance",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "PromotionalRevertRate",
                schema: "finance",
                table: "Accounts");
        }
    }
}
