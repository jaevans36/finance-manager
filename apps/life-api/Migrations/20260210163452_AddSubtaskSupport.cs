using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LifeApi.Migrations
{
    /// <inheritdoc />
    public partial class AddSubtaskSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "depth",
                table: "tasks",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "parent_task_id",
                table: "tasks",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "sort_order",
                table: "tasks",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_tasks_parent_task_id",
                table: "tasks",
                column: "parent_task_id");

            migrationBuilder.CreateIndex(
                name: "IX_tasks_parent_task_id_completed",
                table: "tasks",
                columns: new[] { "parent_task_id", "completed" });

            migrationBuilder.CreateIndex(
                name: "IX_tasks_parent_task_id_sort_order",
                table: "tasks",
                columns: new[] { "parent_task_id", "sort_order" });

            migrationBuilder.AddForeignKey(
                name: "FK_tasks_tasks_parent_task_id",
                table: "tasks",
                column: "parent_task_id",
                principalTable: "tasks",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_tasks_tasks_parent_task_id",
                table: "tasks");

            migrationBuilder.DropIndex(
                name: "IX_tasks_parent_task_id",
                table: "tasks");

            migrationBuilder.DropIndex(
                name: "IX_tasks_parent_task_id_completed",
                table: "tasks");

            migrationBuilder.DropIndex(
                name: "IX_tasks_parent_task_id_sort_order",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "depth",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "parent_task_id",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "sort_order",
                table: "tasks");
        }
    }
}
