using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.OpenApi.Models;
using SacredVibes.Infrastructure;
using SacredVibes.Infrastructure.Data;
using SacredVibes.Infrastructure.Data.Seeds;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;

QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

const long AdminMediaMaxFileSizeBytes = 25L * 1024 * 1024 * 1024;
const int AdminMediaMaxBatchFiles = 10;
const long AdminMediaMaxRequestBodySizeBytes = AdminMediaMaxFileSizeBytes * AdminMediaMaxBatchFiles;

// Allow large admin uploads (audio/video for Digital Studio)
builder.WebHost.ConfigureKestrel(opts =>
    opts.Limits.MaxRequestBodySize = AdminMediaMaxRequestBodySizeBytes);

static bool IsAllowedFrontendOrigin(string? origin)
{
    if (string.IsNullOrWhiteSpace(origin)) return false;
    if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;

    var host = uri.Host;
    return host == "localhost"
        || host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase)
        || host.EndsWith("sacredvibesyoga.com", StringComparison.OrdinalIgnoreCase)
        || host.EndsWith("railway.app", StringComparison.OrdinalIgnoreCase);
}

// Railway injects PORT at runtime — bind to it so the health check can reach us
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://+:{port}");

// ── Services ──────────────────────────────────────────────────────────────────

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.Configure<FormOptions>(opts =>
{
    opts.MultipartBodyLengthLimit = AdminMediaMaxRequestBodySizeBytes;
});
builder.Services.AddEndpointsApiExplorer();

// OpenAPI / Swagger
builder.Services.AddSwaggerGen(opts =>
{
    opts.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Sacred Vibes Yoga API",
        Version = "v1",
        Description = "Backend API for the Sacred Vibes Yoga multi-brand wellness platform"
    });

    opts.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your_token}"
    });

    opts.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

// CORS — allow frontend origins
builder.Services.AddCors(opts =>
{
    opts.AddPolicy("FrontendPolicy", policy =>
    {
        policy
            .SetIsOriginAllowed(IsAllowedFrontendOrigin)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Rate limiting
builder.Services.AddRateLimiter(opts =>
{
    opts.AddFixedWindowLimiter("leads", limiterOpts =>
    {
        limiterOpts.PermitLimit = 5;
        limiterOpts.Window = TimeSpan.FromMinutes(1);
        limiterOpts.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOpts.QueueLimit = 2;
    });

    opts.AddFixedWindowLimiter("auth", limiterOpts =>
    {
        limiterOpts.PermitLimit = 10;
        limiterOpts.Window = TimeSpan.FromMinutes(5);
        limiterOpts.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOpts.QueueLimit = 0;
    });

    opts.AddFixedWindowLimiter("bookings", limiterOpts =>
    {
        limiterOpts.PermitLimit = 5;
        limiterOpts.Window = TimeSpan.FromMinutes(10);
        limiterOpts.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOpts.QueueLimit = 0;
    });

    opts.RejectionStatusCode = 429;
});

// Health checks — DB reported as Degraded (not Unhealthy) so a slow/missing DB
// doesn't prevent the service from starting and passing Railway's health gate.
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>(failureStatus: Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Degraded);

builder.Services.AddAuthorization();

// ── App pipeline ──────────────────────────────────────────────────────────────

var app = builder.Build();

static string GetUploadBasePath(IConfiguration config)
{
    var configuredPath = config["Storage:BasePath"] ?? Path.Combine("wwwroot", "uploads");
    return Path.IsPathRooted(configuredPath)
        ? configuredPath
        : Path.Combine(Directory.GetCurrentDirectory(), configuredPath);
}

// R2 (see Storage:R2:BucketName / R2StorageService) is the host-independent path for
// uploads — this check only matters for the legacy local-disk fallback, where a container's
// filesystem is wiped on every redeploy and isn't shared between hosts at all. Once R2 is
// configured, local disk is just an unused scratch dir and this is skipped entirely.
static void EnsurePersistentLocalUploads(IHostEnvironment env, IConfiguration config, string uploadBasePath)
{
    if (!env.IsProduction()) return;
    if (!string.IsNullOrWhiteSpace(config["Storage:R2:BucketName"])) return;

    // UPLOADS_MOUNT_PATH is the host-agnostic name; RAILWAY_VOLUME_MOUNT_PATH is kept as a
    // fallback so this doesn't break before Railway's dashboard var is renamed.
    var mountPath = Environment.GetEnvironmentVariable("UPLOADS_MOUNT_PATH")
        ?? Environment.GetEnvironmentVariable("RAILWAY_VOLUME_MOUNT_PATH");
    if (string.IsNullOrWhiteSpace(mountPath))
        throw new InvalidOperationException("Production uploads require either Storage:R2:BucketName (preferred) or a persistent volume at UPLOADS_MOUNT_PATH.");

    var normalizedUploadPath = Path.GetFullPath(uploadBasePath)
        .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
    var normalizedMountPath = Path.GetFullPath(mountPath)
        .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);

    var isMountedPath = normalizedUploadPath.Equals(normalizedMountPath, StringComparison.Ordinal)
        || normalizedUploadPath.StartsWith($"{normalizedMountPath}{Path.DirectorySeparatorChar}", StringComparison.Ordinal);

    if (!isMountedPath)
        throw new InvalidOperationException($"Production uploads must be stored under the mounted volume path '{normalizedMountPath}'. Current path: '{normalizedUploadPath}'.");
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(opts =>
    {
        opts.SwaggerEndpoint("/swagger/v1/swagger.json", "Sacred Vibes API v1");
        opts.RoutePrefix = "swagger";
    });
}

// Railway and most PaaS hosts terminate TLS at the proxy — don't redirect internally
if (app.Environment.IsDevelopment())
    app.UseHttpsRedirection();
app.UseStaticFiles();

var uploadBasePath = GetUploadBasePath(app.Configuration);
EnsurePersistentLocalUploads(app.Environment, app.Configuration, uploadBasePath);
Directory.CreateDirectory(uploadBasePath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadBasePath),
    RequestPath = "/uploads"
});

app.UseCors("FrontendPolicy");

// Catch unhandled request exceptions inside the main pipeline so we can preserve
// CORS headers on JSON error responses for browser-based clients.
app.Use(async (ctx, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        var logger = ctx.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Unhandled exception for {Method} {Path}", ctx.Request.Method, ctx.Request.Path);

        if (ctx.Response.HasStarted)
        {
            throw;
        }

        ctx.Response.Clear();

        var origin = ctx.Request.Headers.Origin.ToString();
        if (IsAllowedFrontendOrigin(origin))
        {
            ctx.Response.Headers.AccessControlAllowOrigin = origin;
            ctx.Response.Headers.AccessControlAllowCredentials = "true";
            ctx.Response.Headers.Append("Vary", "Origin");
        }

        ctx.Response.StatusCode = 500;
        ctx.Response.ContentType = "application/json";
        await ctx.Response.WriteAsJsonAsync(new { success = false, errors = new[] { "An internal server error occurred" } });
    }
});

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

// ── Seed database ─────────────────────────────────────────────────────────────

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();

    try
    {
        var userManager = services.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<SacredVibes.Domain.Entities.ApplicationUser>>();
        var roleManager = services.GetRequiredService<Microsoft.AspNetCore.Identity.RoleManager<Microsoft.AspNetCore.Identity.IdentityRole>>();
        var db = services.GetRequiredService<AppDbContext>();

        await SeedData.SeedAsync(db, userManager, roleManager);
        logger.LogInformation("Database seeded successfully");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error seeding database");
        throw;
    }
}

app.Run();
