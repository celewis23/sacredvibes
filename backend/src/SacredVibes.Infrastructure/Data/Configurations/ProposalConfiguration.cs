using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SacredVibes.Domain.Entities;

namespace SacredVibes.Infrastructure.Data.Configurations;

public class ProposalConfiguration : IEntityTypeConfiguration<Proposal>
{
    public void Configure(EntityTypeBuilder<Proposal> builder)
    {
        builder.ToTable("proposals");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Title).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Subject).HasMaxLength(300);
        builder.Property(p => p.RecipientName).HasMaxLength(200);
        builder.Property(p => p.RecipientEmail).HasMaxLength(320);
        builder.Property(p => p.HeaderBackgroundColor).HasMaxLength(20);
        builder.Property(p => p.HeaderTextColor).HasMaxLength(20);
        builder.Property(p => p.FooterBackgroundColor).HasMaxLength(20);
        builder.Property(p => p.FooterTextColor).HasMaxLength(20);
        builder.Property(p => p.BodyContentHtml).HasColumnType("text");
        builder.Property(p => p.Status).HasConversion<int>();

        builder.HasIndex(p => p.Status);
        builder.HasIndex(p => p.RecipientEmail);

        builder.HasOne(p => p.HeaderImageAsset).WithMany().HasForeignKey(p => p.HeaderImageAssetId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(p => p.FooterImageAsset).WithMany().HasForeignKey(p => p.FooterImageAssetId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
    }
}

public class ProposalLineItemConfiguration : IEntityTypeConfiguration<ProposalLineItem>
{
    public void Configure(EntityTypeBuilder<ProposalLineItem> builder)
    {
        builder.ToTable("proposal_line_items");
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Description).IsRequired().HasMaxLength(500);
        builder.Property(l => l.Price).HasColumnType("decimal(10,2)");

        builder.HasIndex(l => new { l.ProposalId, l.SortOrder });

        builder.HasOne(l => l.Proposal).WithMany(p => p.LineItems).HasForeignKey(l => l.ProposalId).OnDelete(DeleteBehavior.Cascade);
    }
}
