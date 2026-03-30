using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LifeApi.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskStatusFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "blocked_reason",
                table: "tasks",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "started_at",
                table: "tasks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "status",
                table: "tasks",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_tasks_user_id_status",
                table: "tasks",
                columns: new[] { "user_id", "status" });

            // Data migration: sync existing completed tasks to Completed status (enum value 3)
            migrationBuilder.Sql("UPDATE tasks SET status = 3 WHERE completed = true");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_tasks_user_id_status",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "blocked_reason",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "started_at",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "status",
                table: "tasks");
        }
    }
}
