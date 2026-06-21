using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceApi.Migrations
{
    /// <inheritdoc />
    public partial class AddBillAccountLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "BillId",
                schema: "finance",
                table: "Transactions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AccountId",
                schema: "finance",
                table: "Bills",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_BillId",
                schema: "finance",
                table: "Transactions",
                column: "BillId");

            migrationBuilder.CreateIndex(
                name: "IX_Bills_AccountId",
                schema: "finance",
                table: "Bills",
                column: "AccountId");

            migrationBuilder.AddForeignKey(
                name: "FK_Bills_Accounts_AccountId",
                schema: "finance",
                table: "Bills",
                column: "AccountId",
                principalSchema: "finance",
                principalTable: "Accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Bills_BillId",
                schema: "finance",
                table: "Transactions",
                column: "BillId",
                principalSchema: "finance",
                principalTable: "Bills",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bills_Accounts_AccountId",
                schema: "finance",
                table: "Bills");

            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Bills_BillId",
                schema: "finance",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_BillId",
                schema: "finance",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Bills_AccountId",
                schema: "finance",
                table: "Bills");

            migrationBuilder.DropColumn(
                name: "BillId",
                schema: "finance",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "AccountId",
                schema: "finance",
                table: "Bills");
        }
    }
}
