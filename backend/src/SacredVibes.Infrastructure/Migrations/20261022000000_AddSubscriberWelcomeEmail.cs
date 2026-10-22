using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SacredVibes.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSubscriberWelcomeEmail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "WelcomeEmailSentAt",
                table: "subscribers",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WelcomeEmailSentAt",
                table: "subscribers");
        }
    }
}
