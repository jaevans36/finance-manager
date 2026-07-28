using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceApi.Migrations
{
    /// <inheritdoc />
    public partial class AddBillsAndSavingsGoals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Bills",
                schema: "finance",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    Frequency = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DueDay = table.Column<int>(type: "integer", nullable: false),
                    ReminderDaysBefore = table.Column<int>(type: "integer", nullable: false),
                    IsPaid = table.Column<bool>(type: "boolean", nullable: false),
                    LastPaidDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bills", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Bills_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalSchema: "finance",
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "SavingsGoals",
                schema: "finance",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TargetAmount = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    CurrentAmount = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    TargetDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MonthlyContribution = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SavingsGoals", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Bills_CategoryId",
                schema: "finance",
                table: "Bills",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Bills_UserId",
                schema: "finance",
                table: "Bills",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SavingsGoals_UserId",
                schema: "finance",
                table: "SavingsGoals",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Bills",
                schema: "finance");

            migrationBuilder.DropTable(
                name: "SavingsGoals",
                schema: "finance");
        }
    }
}
