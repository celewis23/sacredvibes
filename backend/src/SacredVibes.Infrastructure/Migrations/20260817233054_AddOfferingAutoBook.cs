using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SacredVibes.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOfferingAutoBook : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsAutoBook",
                table: "service_offerings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsAutoBook",
                table: "event_offerings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // Free and donation-based offerings default to auto-book — backfill existing rows
            // to match, not just new ones going forward. PriceType: Free = 2, Donation = 3.
            migrationBuilder.Sql("UPDATE service_offerings SET \"IsAutoBook\" = true WHERE \"PriceType\" IN (2, 3);");
            migrationBuilder.Sql("UPDATE event_offerings SET \"IsAutoBook\" = true WHERE \"PriceType\" IN (2, 3);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsAutoBook",
                table: "service_offerings");

            migrationBuilder.DropColumn(
                name: "IsAutoBook",
                table: "event_offerings");
        }
    }
}
