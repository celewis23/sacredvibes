using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SacredVibes.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProposals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "proposals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Subject = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    RecipientName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    RecipientEmail = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    HeaderBackgroundColor = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    HeaderImageAssetId = table.Column<Guid>(type: "uuid", nullable: true),
                    HeaderText = table.Column<string>(type: "text", nullable: true),
                    HeaderTextColor = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    BodyContentHtml = table.Column<string>(type: "text", nullable: false),
                    FooterBackgroundColor = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    FooterImageAssetId = table.Column<Guid>(type: "uuid", nullable: true),
                    FooterText = table.Column<string>(type: "text", nullable: true),
                    FooterTextColor = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ViewCount = table.Column<int>(type: "integer", nullable: false),
                    FirstViewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastViewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_proposals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_proposals_assets_FooterImageAssetId",
                        column: x => x.FooterImageAssetId,
                        principalTable: "assets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_proposals_assets_HeaderImageAssetId",
                        column: x => x.HeaderImageAssetId,
                        principalTable: "assets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "proposal_line_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProposalId = table.Column<Guid>(type: "uuid", nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Price = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    ServiceOfferingId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_proposal_line_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_proposal_line_items_proposals_ProposalId",
                        column: x => x.ProposalId,
                        principalTable: "proposals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_proposal_line_items_ProposalId_SortOrder",
                table: "proposal_line_items",
                columns: new[] { "ProposalId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_proposals_FooterImageAssetId",
                table: "proposals",
                column: "FooterImageAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_proposals_HeaderImageAssetId",
                table: "proposals",
                column: "HeaderImageAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_proposals_RecipientEmail",
                table: "proposals",
                column: "RecipientEmail");

            migrationBuilder.CreateIndex(
                name: "IX_proposals_Status",
                table: "proposals",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "proposal_line_items");

            migrationBuilder.DropTable(
                name: "proposals");
        }
    }
}
