using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LifeApi.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskGroups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "group_id",
                table: "tasks",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "task_groups",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    colour = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    icon = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    is_default = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_task_groups", x => x.id);
                    table.ForeignKey(
                        name: "FK_task_groups_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_tasks_group_id",
                table: "tasks",
                column: "group_id");

            migrationBuilder.CreateIndex(
                name: "IX_tasks_user_id_group_id_completed",
                table: "tasks",
                columns: new[] { "user_id", "group_id", "completed" });

            migrationBuilder.CreateIndex(
                name: "IX_task_groups_user_id",
                table: "task_groups",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_task_groups_user_id_name",
                table: "task_groups",
                columns: new[] { "user_id", "name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_tasks_task_groups_group_id",
                table: "tasks",
                column: "group_id",
                principalTable: "task_groups",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_tasks_task_groups_group_id",
                table: "tasks");

            migrationBuilder.DropTable(
                name: "task_groups");

            migrationBuilder.DropIndex(
                name: "IX_tasks_group_id",
                table: "tasks");

            migrationBuilder.DropIndex(
                name: "IX_tasks_user_id_group_id_completed",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "group_id",
                table: "tasks");
        }
    }
}
