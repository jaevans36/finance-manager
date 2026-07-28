using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceApi.Migrations
{
    /// <inheritdoc />
    public partial class AddIncomeAccountScope : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IncomeAccountIds",
                schema: "finance",
                table: "UserFinanceSettings",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IncomeAccountIds",
                schema: "finance",
                table: "UserFinanceSettings");
        }
    }
}
