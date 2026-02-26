using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceApi.Migrations
{
    /// <inheritdoc />
    public partial class AddUsernameToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add username column as nullable first to accommodate existing users
            migrationBuilder.AddColumn<string>(
                name: "username",
                table: "users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            // Generate temporary usernames for existing users (user_<guid prefix>)
            migrationBuilder.Sql(@"
                UPDATE users 
                SET username = CONCAT('user_', SUBSTRING(CAST(id AS TEXT), 1, 8))
                WHERE username IS NULL;
            ");

            // Make column non-nullable now that all rows have values
            migrationBuilder.AlterColumn<string>(
                name: "username",
                table: "users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false);

            // Add unique index
            migrationBuilder.CreateIndex(
                name: "IX_users_username",
                table: "users",
                column: "username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_users_username",
                table: "users");

            migrationBuilder.DropColumn(
                name: "username",
                table: "users");
        }
    }
}
