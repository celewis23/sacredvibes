using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SacredVibes.Infrastructure.Migrations
{
    /// <inheritdoc />
    // NOTE: This is the first EF Core migration ever generated for this project — the
    // existing production schema was never under migration control. `dotnet ef migrations add`
    // therefore produced a full from-scratch schema (every table), which would fail/be
    // destructive if run against the live database. This file has been hand-trimmed to contain
    // only the genuinely new changes from this session: three new nullable columns + an index
    // on `bookings`, and the new `push_subscriptions` table. The BookingStatus.Denied enum
    // value needs no schema change (stored as a plain int). The model snapshot/designer files
    // were left as EF generated them (the full current model) — only this Up()/Down() pair
    // was edited, which is the standard way to adopt migrations against an existing database.
    public partial class AddBookingApprovalWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "RequestedStartAt",
                table: "bookings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RequestedEndAt",
                table: "bookings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RequestedTimeZone",
                table: "bookings",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_bookings_RequestedStartAt",
                table: "bookings",
                column: "RequestedStartAt");

            migrationBuilder.CreateTable(
                name: "push_subscriptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Endpoint = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    P256dhKey = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    AuthKey = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastUsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_push_subscriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_push_subscriptions_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_push_subscriptions_Endpoint",
                table: "push_subscriptions",
                column: "Endpoint",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_push_subscriptions_UserId",
                table: "push_subscriptions",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "push_subscriptions");

            migrationBuilder.DropIndex(
                name: "IX_bookings_RequestedStartAt",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "RequestedStartAt",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "RequestedEndAt",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "RequestedTimeZone",
                table: "bookings");
        }
    }
}
