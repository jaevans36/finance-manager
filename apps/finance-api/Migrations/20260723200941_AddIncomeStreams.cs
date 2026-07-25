using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceApi.Migrations
{
    /// <inheritdoc />
    public partial class AddIncomeStreams : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "IncomeStreams",
                schema: "finance",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    MonthlyAmount = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    AccountId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IncomeStreams", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IncomeStreams_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalSchema: "finance",
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_IncomeStreams_AccountId",
                schema: "finance",
                table: "IncomeStreams",
                column: "AccountId");

            migrationBuilder.CreateIndex(
                name: "IX_IncomeStreams_UserId",
                schema: "finance",
                table: "IncomeStreams",
                column: "UserId");

            // Preserve any existing single manual income value as a named stream before
            // the ManualMonthlyIncome column is dropped below.
            migrationBuilder.Sql(@"
                INSERT INTO finance.""IncomeStreams"" (""Id"", ""UserId"", ""Name"", ""MonthlyAmount"", ""AccountId"", ""CreatedAt"", ""UpdatedAt"")
                SELECT gen_random_uuid(), ""UserId"", 'My income', ""ManualMonthlyIncome"", NULL, now(), now()
                FROM finance.""UserFinanceSettings""
                WHERE ""ManualMonthlyIncome"" IS NOT NULL AND ""ManualMonthlyIncome"" <> 0;
            ");

            migrationBuilder.DropColumn(
                name: "ManualMonthlyIncome",
                schema: "finance",
                table: "UserFinanceSettings");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IncomeStreams",
                schema: "finance");

            migrationBuilder.AddColumn<decimal>(
                name: "ManualMonthlyIncome",
                schema: "finance",
                table: "UserFinanceSettings",
                type: "numeric(18,4)",
                precision: 18,
                scale: 4,
                nullable: true);
        }
    }
}
