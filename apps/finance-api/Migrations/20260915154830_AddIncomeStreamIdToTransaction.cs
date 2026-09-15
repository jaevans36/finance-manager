using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceApi.Migrations
{
    /// <inheritdoc />
    public partial class AddIncomeStreamIdToTransaction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "IncomeStreamId",
                schema: "finance",
                table: "Transactions",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_IncomeStreamId",
                schema: "finance",
                table: "Transactions",
                column: "IncomeStreamId");

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_IncomeStreams_IncomeStreamId",
                schema: "finance",
                table: "Transactions",
                column: "IncomeStreamId",
                principalSchema: "finance",
                principalTable: "IncomeStreams",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_IncomeStreams_IncomeStreamId",
                schema: "finance",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_IncomeStreamId",
                schema: "finance",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "IncomeStreamId",
                schema: "finance",
                table: "Transactions");
        }
    }
}
