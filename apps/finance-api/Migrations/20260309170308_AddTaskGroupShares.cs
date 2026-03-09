using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceApi.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskGroupShares : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "task_group_shares",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    task_group_id = table.Column<Guid>(type: "uuid", nullable: false),
                    shared_with_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    permission = table.Column<string>(type: "text", nullable: false),
                    shared_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_task_group_shares", x => x.id);
                    table.ForeignKey(
                        name: "FK_task_group_shares_task_groups_task_group_id",
                        column: x => x.task_group_id,
                        principalTable: "task_groups",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_task_group_shares_users_shared_with_user_id",
                        column: x => x.shared_with_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_task_group_shares_shared_with_user_id",
                table: "task_group_shares",
                column: "shared_with_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_task_group_shares_task_group_id_shared_with_user_id",
                table: "task_group_shares",
                columns: new[] { "task_group_id", "shared_with_user_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "task_group_shares");
        }
    }
}
