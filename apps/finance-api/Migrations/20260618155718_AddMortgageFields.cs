using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceApi.Migrations
{
    /// <inheritdoc />
    public partial class AddMortgageFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "MortgageStartDate",
                schema: "finance",
                table: "Accounts",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MortgageTermYears",
                schema: "finance",
                table: "Accounts",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MortgageStartDate",
                schema: "finance",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "MortgageTermYears",
                schema: "finance",
                table: "Accounts");
        }
    }
}
