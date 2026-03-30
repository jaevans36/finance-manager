using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LifeApi.Migrations
{
    /// <inheritdoc />
    public partial class AddEnergyTaggingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "energy_level",
                table: "tasks",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "estimated_minutes",
                table: "tasks",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_tasks_user_id_energy_level",
                table: "tasks",
                columns: new[] { "user_id", "energy_level" });

            migrationBuilder.CreateIndex(
                name: "IX_tasks_user_id_energy_level_estimated_minutes",
                table: "tasks",
                columns: new[] { "user_id", "energy_level", "estimated_minutes" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_tasks_user_id_energy_level",
                table: "tasks");

            migrationBuilder.DropIndex(
                name: "IX_tasks_user_id_energy_level_estimated_minutes",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "energy_level",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "estimated_minutes",
                table: "tasks");
        }
    }
}
