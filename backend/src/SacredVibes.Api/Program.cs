using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using SacredVibes.Infrastructure;
using SacredVibes.Infrastructure.Data;
using SacredVibes.Infrastructure.Data.Seeds;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

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
builder.Services.AddControllers();
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

    opts.RejectionStatusCode = 429;
});

// Health checks — DB reported as Degraded (not Unhealthy) so a slow/missing DB
// doesn't prevent the service from starting and passing Railway's health gate.
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>(failureStatus: Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Degraded);

builder.Services.AddAuthorization();

// ── App pipeline ──────────────────────────────────────────────────────────────

var app = builder.Build();

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
app.UseStaticFiles(); // serves /wwwroot/uploads
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
