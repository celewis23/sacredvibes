using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SacredVibes.Domain.Entities;

namespace SacredVibes.Infrastructure.Data.Configurations;

public class StudioContentConfiguration : IEntityTypeConfiguration<StudioContent>
{
    public void Configure(EntityTypeBuilder<StudioContent> builder)
    {
        builder.ToTable("studio_content");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Title).IsRequired().HasMaxLength(300);
        builder.Property(s => s.Description).HasMaxLength(2000);
        builder.Property(s => s.Duration).HasMaxLength(50);
        builder.Property(s => s.Category).HasConversion<int>();
        builder.Property(s => s.RequiredTier).HasConversion<int>();
        builder.HasIndex(s => new { s.Category, s.SortOrder });
        builder.HasIndex(s => s.IsPublished);
        builder.HasOne(s => s.Asset).WithMany().HasForeignKey(s => s.AssetId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(s => s.ThumbnailAsset).WithMany().HasForeignKey(s => s.ThumbnailAssetId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(s => s.Brand).WithMany().HasForeignKey(s => s.BrandId).IsRequired(false);
    }
}

public class MemberSubscriptionConfiguration : IEntityTypeConfiguration<MemberSubscription>
{
    public void Configure(EntityTypeBuilder<MemberSubscription> builder)
    {
        builder.ToTable("member_subscriptions");
        builder.HasKey(m => m.Id);
        builder.Property(m => m.UserId).IsRequired();
        builder.Property(m => m.Tier).HasConversion<int>();
        builder.Property(m => m.Status).HasConversion<int>();
        builder.Property(m => m.StripeSubscriptionId).HasMaxLength(200);
        builder.Property(m => m.StripeCustomerId).HasMaxLength(200);
        builder.Property(m => m.RawEventJson).HasColumnType("jsonb");
        builder.HasIndex(m => m.UserId).IsUnique();
        builder.HasIndex(m => m.StripeSubscriptionId);
        builder.HasOne(m => m.User).WithOne(u => u.Subscription).HasForeignKey<MemberSubscription>(m => m.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}
