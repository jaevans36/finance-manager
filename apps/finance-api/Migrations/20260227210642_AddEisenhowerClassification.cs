using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceApi.Migrations
{
    /// <inheritdoc />
    public partial class AddEisenhowerClassification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "importance",
                table: "tasks",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "urgency",
                table: "tasks",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_tasks_user_id_urgency_importance",
                table: "tasks",
                columns: new[] { "user_id", "urgency", "importance" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_tasks_user_id_urgency_importance",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "importance",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "urgency",
                table: "tasks");
        }
    }
}
