using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SacredVibes.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNewsletterScheduling : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "newsletter_templates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    HeaderBackgroundColor = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    HeaderImageAssetId = table.Column<Guid>(type: "uuid", nullable: true),
                    HeaderText = table.Column<string>(type: "text", nullable: true),
                    HeaderTextColor = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    BodyContentHtml = table.Column<string>(type: "text", nullable: false),
                    FooterBackgroundColor = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    FooterImageAssetId = table.Column<Guid>(type: "uuid", nullable: true),
                    FooterText = table.Column<string>(type: "text", nullable: true),
                    FooterTextColor = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_newsletter_templates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_newsletter_templates_assets_FooterImageAssetId",
                        column: x => x.FooterImageAssetId,
                        principalTable: "assets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_newsletter_templates_assets_HeaderImageAssetId",
                        column: x => x.HeaderImageAssetId,
                        principalTable: "assets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "newsletters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Subject = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    TemplateId = table.Column<Guid>(type: "uuid", nullable: true),
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
                    RecipientGroupId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    RecipientGroupLabel = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ScheduledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SendStartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancelledReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FailureReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    RecipientCount = table.Column<int>(type: "integer", nullable: false),
                    SentCount = table.Column<int>(type: "integer", nullable: false),
                    FailedCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_newsletters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_newsletters_assets_FooterImageAssetId",
                        column: x => x.FooterImageAssetId,
                        principalTable: "assets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_newsletters_assets_HeaderImageAssetId",
                        column: x => x.HeaderImageAssetId,
                        principalTable: "assets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_newsletters_newsletter_templates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "newsletter_templates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "newsletter_recipient_logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NewsletterId = table.Column<Guid>(type: "uuid", nullable: false),
                    SubscriberId = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_newsletter_recipient_logs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_newsletter_recipient_logs_newsletters_NewsletterId",
                        column: x => x.NewsletterId,
                        principalTable: "newsletters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_newsletter_recipient_logs_NewsletterId_Status",
                table: "newsletter_recipient_logs",
                columns: new[] { "NewsletterId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_newsletter_templates_FooterImageAssetId",
                table: "newsletter_templates",
                column: "FooterImageAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_newsletter_templates_HeaderImageAssetId",
                table: "newsletter_templates",
                column: "HeaderImageAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_newsletters_FooterImageAssetId",
                table: "newsletters",
                column: "FooterImageAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_newsletters_HeaderImageAssetId",
                table: "newsletters",
                column: "HeaderImageAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_newsletters_Status_ScheduledAt",
                table: "newsletters",
                columns: new[] { "Status", "ScheduledAt" });

            migrationBuilder.CreateIndex(
                name: "IX_newsletters_TemplateId",
                table: "newsletters",
                column: "TemplateId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "newsletter_recipient_logs");

            migrationBuilder.DropTable(
                name: "newsletters");

            migrationBuilder.DropTable(
                name: "newsletter_templates");
        }
    }
}
