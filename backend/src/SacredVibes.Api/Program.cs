using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using SacredVibes.Infrastructure;
using SacredVibes.Infrastructure.Data;
using SacredVibes.Infrastructure.Data.Seeds;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

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
        var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
            ?? ["http://localhost:3000", "https://sacredvibesyoga.com",
               "https://hands.sacredvibesyoga.com", "https://sound.sacredvibesyoga.com",
               "https://admin.sacredvibesyoga.com"];

        policy
            .WithOrigins(origins)
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

// Health checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>();

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

app.UseHttpsRedirection();
app.UseStaticFiles(); // serves /wwwroot/uploads
app.UseCors("FrontendPolicy");
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
    }
}

app.Run();
