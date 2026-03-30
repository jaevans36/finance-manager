using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LifeApi.Migrations
{
    /// <inheritdoc />
    public partial class AddEventShareTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "event_shares",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: false),
                    shared_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    shared_with_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    permission = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_event_shares", x => x.id);
                    table.ForeignKey(
                        name: "FK_event_shares_events_event_id",
                        column: x => x.event_id,
                        principalTable: "events",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_event_shares_users_shared_by_user_id",
                        column: x => x.shared_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_event_shares_users_shared_with_user_id",
                        column: x => x.shared_with_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_event_shares_event_id_shared_with_user_id",
                table: "event_shares",
                columns: new[] { "event_id", "shared_with_user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_event_shares_shared_by_user_id",
                table: "event_shares",
                column: "shared_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_event_shares_shared_with_user_id",
                table: "event_shares",
                column: "shared_with_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_event_shares_status",
                table: "event_shares",
                column: "status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "event_shares");
        }
    }
}
