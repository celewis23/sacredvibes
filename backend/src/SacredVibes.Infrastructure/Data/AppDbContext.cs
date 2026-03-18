using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SacredVibes.Domain.Entities;

namespace SacredVibes.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Brand / Site
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Page> Pages => Set<Page>();

    // Blog
    public DbSet<BlogPost> BlogPosts => Set<BlogPost>();
    public DbSet<BlogCategory> BlogCategories => Set<BlogCategory>();
    public DbSet<BlogTag> BlogTags => Set<BlogTag>();
    public DbSet<BlogPostCategory> BlogPostCategories => Set<BlogPostCategory>();
    public DbSet<BlogPostTag> BlogPostTags => Set<BlogPostTag>();

    // Assets & Gallery
    public DbSet<Asset> Assets => Set<Asset>();
    public DbSet<Gallery> Galleries => Set<Gallery>();
    public DbSet<GalleryAsset> GalleryAssets => Set<GalleryAsset>();

    // Subscribers & Imports
    public DbSet<Subscriber> Subscribers => Set<Subscriber>();
    public DbSet<SubscriberTag> SubscriberTags => Set<SubscriberTag>();
    public DbSet<SubscriberTagMap> SubscriberTagMaps => Set<SubscriberTagMap>();
    public DbSet<ImportJob> ImportJobs => Set<ImportJob>();
    public DbSet<ImportJobItem> ImportJobItems => Set<ImportJobItem>();

    // Leads
    public DbSet<Lead> Leads => Set<Lead>();

    // Services & Events
    public DbSet<ServiceOffering> ServiceOfferings => Set<ServiceOffering>();
    public DbSet<EventOffering> EventOfferings => Set<EventOffering>();

    // Bookings & Payments
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<PaymentRecord> PaymentRecords => Set<PaymentRecord>();

    // System
    public DbSet<IntegrationSetting> IntegrationSettings => Set<IntegrationSetting>();
    public DbSet<WebhookEvent> WebhookEvents => Set<WebhookEvent>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Default schema and soft-delete global filter
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                builder.Entity(entityType.ClrType)
                    .HasQueryFilter(
                        System.Linq.Expressions.Expression.Lambda(
                            System.Linq.Expressions.Expression.Equal(
                                System.Linq.Expressions.Expression.Property(
                                    System.Linq.Expressions.Expression.Parameter(entityType.ClrType, "e"),
                                    nameof(BaseEntity.IsDeleted)
                                ),
                                System.Linq.Expressions.Expression.Constant(false)
                            ),
                            System.Linq.Expressions.Expression.Parameter(entityType.ClrType, "e")
                        )
                    );
            }
        }
    }

    public override async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.UpdatedAt = now;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    break;
            }
        }
        return await base.SaveChangesAsync(ct);
    }
}
