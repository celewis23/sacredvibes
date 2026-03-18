using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SacredVibes.Domain.Entities;

namespace SacredVibes.Infrastructure.Data.Configurations;

public class SubscriberConfiguration : IEntityTypeConfiguration<Subscriber>
{
    public void Configure(EntityTypeBuilder<Subscriber> builder)
    {
        builder.ToTable("subscribers");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Email).IsRequired().HasMaxLength(320);
        builder.HasIndex(s => s.Email).IsUnique();
        builder.HasIndex(s => s.IsSubscribed);
        builder.HasIndex(s => s.Source);
        builder.Property(s => s.FirstName).HasMaxLength(100);
        builder.Property(s => s.LastName).HasMaxLength(100);
        builder.Property(s => s.Phone).HasMaxLength(30);
        builder.Property(s => s.MetadataJson).HasColumnType("jsonb").HasDefaultValue("{}");
        builder.Property(s => s.Source).HasConversion<int>();
        builder.Property(s => s.ConsentStatus).HasConversion<int>();
        builder.HasOne(s => s.ImportJob).WithMany(j => j.Subscribers).HasForeignKey(s => s.ImportJobId).IsRequired(false);
    }
}

public class SubscriberTagConfiguration : IEntityTypeConfiguration<SubscriberTag>
{
    public void Configure(EntityTypeBuilder<SubscriberTag> builder)
    {
        builder.ToTable("subscriber_tags");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Name).IsRequired().HasMaxLength(100);
        builder.Property(t => t.Slug).IsRequired().HasMaxLength(100);
        builder.HasIndex(t => t.Slug).IsUnique();
        builder.Property(t => t.Color).HasMaxLength(20);
    }
}

public class SubscriberTagMapConfiguration : IEntityTypeConfiguration<SubscriberTagMap>
{
    public void Configure(EntityTypeBuilder<SubscriberTagMap> builder)
    {
        builder.ToTable("subscriber_tag_maps");
        builder.HasKey(m => new { m.SubscriberId, m.SubscriberTagId });
        builder.HasOne(m => m.Subscriber).WithMany(s => s.SubscriberTagMaps).HasForeignKey(m => m.SubscriberId);
        builder.HasOne(m => m.SubscriberTag).WithMany(t => t.SubscriberTagMaps).HasForeignKey(m => m.SubscriberTagId);
    }
}

public class ImportJobConfiguration : IEntityTypeConfiguration<ImportJob>
{
    public void Configure(EntityTypeBuilder<ImportJob> builder)
    {
        builder.ToTable("import_jobs");
        builder.HasKey(j => j.Id);
        builder.Property(j => j.Source).HasConversion<int>();
        builder.Property(j => j.Status).HasConversion<int>();
        builder.Property(j => j.ColumnMappingJson).HasColumnType("jsonb");
        builder.Property(j => j.OptionsJson).HasColumnType("jsonb");
    }
}

public class ImportJobItemConfiguration : IEntityTypeConfiguration<ImportJobItem>
{
    public void Configure(EntityTypeBuilder<ImportJobItem> builder)
    {
        builder.ToTable("import_job_items");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.RawDataJson).HasColumnType("jsonb").HasDefaultValue("{}");
        builder.Property(i => i.Status).HasConversion<int>();
        builder.HasOne(i => i.ImportJob).WithMany(j => j.Items).HasForeignKey(i => i.ImportJobId);
    }
}
