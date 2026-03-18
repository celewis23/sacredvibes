using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SacredVibes.Domain.Entities;

namespace SacredVibes.Infrastructure.Data.Configurations;

public class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.ToTable("bookings");
        builder.HasKey(b => b.Id);
        builder.Property(b => b.CustomerName).IsRequired().HasMaxLength(300);
        builder.Property(b => b.CustomerEmail).IsRequired().HasMaxLength(320);
        builder.Property(b => b.CustomerPhone).HasMaxLength(30);
        builder.Property(b => b.Currency).HasMaxLength(3);
        builder.Property(b => b.Amount).HasColumnType("decimal(10,2)");
        builder.Property(b => b.MetadataJson).HasColumnType("jsonb").HasDefaultValue("{}");
        builder.Property(b => b.Status).HasConversion<int>();
        builder.Property(b => b.PaymentStatus).HasConversion<int>();
        builder.Property(b => b.BookingType).HasConversion<int>();
        builder.HasIndex(b => b.Status);
        builder.HasIndex(b => b.CustomerEmail);
        builder.HasOne(b => b.Brand).WithMany(br => br.Bookings).HasForeignKey(b => b.BrandId);
        builder.HasOne(b => b.ServiceOffering).WithMany(s => s.Bookings).HasForeignKey(b => b.ServiceOfferingId).IsRequired(false);
        builder.HasOne(b => b.EventOffering).WithMany(e => e.Bookings).HasForeignKey(b => b.EventOfferingId).IsRequired(false);
    }
}

public class PaymentRecordConfiguration : IEntityTypeConfiguration<PaymentRecord>
{
    public void Configure(EntityTypeBuilder<PaymentRecord> builder)
    {
        builder.ToTable("payment_records");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Provider).IsRequired().HasMaxLength(50);
        builder.Property(p => p.ProviderPaymentId).IsRequired().HasMaxLength(300);
        builder.Property(p => p.Amount).HasColumnType("decimal(10,2)");
        builder.Property(p => p.Currency).HasMaxLength(3);
        builder.Property(p => p.RawPayloadJson).HasColumnType("jsonb");
        builder.Property(p => p.Status).HasConversion<int>();
        builder.HasOne(p => p.Booking).WithMany(b => b.PaymentRecords).HasForeignKey(p => p.BookingId);
    }
}

public class ServiceOfferingConfiguration : IEntityTypeConfiguration<ServiceOffering>
{
    public void Configure(EntityTypeBuilder<ServiceOffering> builder)
    {
        builder.ToTable("service_offerings");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Name).IsRequired().HasMaxLength(300);
        builder.Property(s => s.Slug).IsRequired().HasMaxLength(300);
        builder.HasIndex(s => new { s.BrandId, s.Slug }).IsUnique();
        builder.Property(s => s.Price).HasColumnType("decimal(10,2)");
        builder.Property(s => s.PriceMin).HasColumnType("decimal(10,2)");
        builder.Property(s => s.PriceMax).HasColumnType("decimal(10,2)");
        builder.Property(s => s.Currency).HasMaxLength(3);
        builder.Property(s => s.PriceType).HasConversion<int>();
        builder.Property(s => s.ScheduleJson).HasColumnType("jsonb");
        builder.HasOne(s => s.Brand).WithMany(b => b.ServiceOfferings).HasForeignKey(s => s.BrandId);
    }
}

public class EventOfferingConfiguration : IEntityTypeConfiguration<EventOffering>
{
    public void Configure(EntityTypeBuilder<EventOffering> builder)
    {
        builder.ToTable("event_offerings");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Name).IsRequired().HasMaxLength(300);
        builder.Property(e => e.Slug).IsRequired().HasMaxLength(300);
        builder.HasIndex(e => new { e.BrandId, e.Slug }).IsUnique();
        builder.HasIndex(e => e.StartAt);
        builder.HasIndex(e => e.IsSoundOnTheRiver);
        builder.Property(e => e.Price).HasColumnType("decimal(10,2)");
        builder.Property(e => e.Currency).HasMaxLength(3);
        builder.Property(e => e.PriceType).HasConversion<int>();
        builder.HasOne(e => e.Brand).WithMany(b => b.EventOfferings).HasForeignKey(e => e.BrandId);
    }
}

public class IntegrationSettingConfiguration : IEntityTypeConfiguration<IntegrationSetting>
{
    public void Configure(EntityTypeBuilder<IntegrationSetting> builder)
    {
        builder.ToTable("integration_settings");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Provider).IsRequired().HasMaxLength(100);
        builder.HasIndex(i => i.Provider).IsUnique();
        builder.Property(i => i.SettingsJson).HasColumnType("jsonb").HasDefaultValue("{}");
    }
}

public class WebhookEventConfiguration : IEntityTypeConfiguration<WebhookEvent>
{
    public void Configure(EntityTypeBuilder<WebhookEvent> builder)
    {
        builder.ToTable("webhook_events");
        builder.HasKey(w => w.Id);
        builder.Property(w => w.Provider).IsRequired().HasMaxLength(50);
        builder.Property(w => w.EventType).IsRequired().HasMaxLength(200);
        builder.Property(w => w.ExternalEventId).IsRequired().HasMaxLength(300);
        builder.HasIndex(w => w.ExternalEventId).IsUnique();
        builder.Property(w => w.PayloadJson).HasColumnType("jsonb").HasDefaultValue("{}");
    }
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("refresh_tokens");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Token).IsRequired().HasMaxLength(500);
        builder.HasIndex(r => r.Token);
        builder.HasOne(r => r.User).WithMany().HasForeignKey(r => r.UserId);
    }
}
