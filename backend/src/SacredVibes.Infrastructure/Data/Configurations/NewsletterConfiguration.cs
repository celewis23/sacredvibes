using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SacredVibes.Domain.Entities;

namespace SacredVibes.Infrastructure.Data.Configurations;

public class NewsletterTemplateConfiguration : IEntityTypeConfiguration<NewsletterTemplate>
{
    public void Configure(EntityTypeBuilder<NewsletterTemplate> builder)
    {
        builder.ToTable("newsletter_templates");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Name).IsRequired().HasMaxLength(200);
        builder.Property(t => t.Description).HasMaxLength(500);
        builder.Property(t => t.HeaderBackgroundColor).HasMaxLength(20);
        builder.Property(t => t.HeaderTextColor).HasMaxLength(20);
        builder.Property(t => t.FooterBackgroundColor).HasMaxLength(20);
        builder.Property(t => t.FooterTextColor).HasMaxLength(20);
        builder.Property(t => t.BodyContentHtml).HasColumnType("text");

        builder.HasOne(t => t.HeaderImageAsset).WithMany().HasForeignKey(t => t.HeaderImageAssetId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(t => t.FooterImageAsset).WithMany().HasForeignKey(t => t.FooterImageAssetId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
    }
}

public class NewsletterConfiguration : IEntityTypeConfiguration<Newsletter>
{
    public void Configure(EntityTypeBuilder<Newsletter> builder)
    {
        builder.ToTable("newsletters");
        builder.HasKey(n => n.Id);
        builder.Property(n => n.Name).IsRequired().HasMaxLength(200);
        builder.Property(n => n.Subject).IsRequired().HasMaxLength(300);
        builder.Property(n => n.HeaderBackgroundColor).HasMaxLength(20);
        builder.Property(n => n.HeaderTextColor).HasMaxLength(20);
        builder.Property(n => n.FooterBackgroundColor).HasMaxLength(20);
        builder.Property(n => n.FooterTextColor).HasMaxLength(20);
        builder.Property(n => n.BodyContentHtml).HasColumnType("text");
        builder.Property(n => n.Status).HasConversion<int>();
        builder.Property(n => n.RecipientGroupId).HasMaxLength(200);
        builder.Property(n => n.RecipientGroupLabel).HasMaxLength(200);
        builder.Property(n => n.FailureReason).HasMaxLength(500);
        builder.Property(n => n.CancelledReason).HasMaxLength(500);

        builder.HasIndex(n => new { n.Status, n.ScheduledAt });

        builder.HasOne(n => n.Template).WithMany(t => t.Newsletters).HasForeignKey(n => n.TemplateId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(n => n.HeaderImageAsset).WithMany().HasForeignKey(n => n.HeaderImageAssetId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(n => n.FooterImageAsset).WithMany().HasForeignKey(n => n.FooterImageAssetId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
    }
}

public class NewsletterRecipientLogConfiguration : IEntityTypeConfiguration<NewsletterRecipientLog>
{
    public void Configure(EntityTypeBuilder<NewsletterRecipientLog> builder)
    {
        builder.ToTable("newsletter_recipient_logs");
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Email).IsRequired().HasMaxLength(320);
        builder.Property(l => l.Status).HasConversion<int>();
        builder.Property(l => l.ErrorMessage).HasMaxLength(1000);

        builder.HasIndex(l => new { l.NewsletterId, l.Status });

        builder.HasOne(l => l.Newsletter).WithMany(n => n.RecipientLogs).HasForeignKey(l => l.NewsletterId).OnDelete(DeleteBehavior.Cascade);
    }
}
