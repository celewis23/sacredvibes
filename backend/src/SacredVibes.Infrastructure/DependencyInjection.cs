using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using SacredVibes.Application.Common.Interfaces;
using SacredVibes.Application.Features.Auth;
using SacredVibes.Application.Features.Imports;
using SacredVibes.Application.Features.Payments;
using SacredVibes.Domain.Entities;
using SacredVibes.Infrastructure.Data;
using SacredVibes.Infrastructure.Services;
using SacredVibes.Infrastructure.Services.Csv;
using SacredVibes.Infrastructure.Services.ImageProcessing;
using SacredVibes.Infrastructure.Services.Square;
using SacredVibes.Infrastructure.Services.Storage;
using SacredVibes.Infrastructure.Services.Stripe;
using System.Text;

namespace SacredVibes.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        // Database
        services.AddDbContext<AppDbContext>(opts =>
            opts.UseNpgsql(
                config.GetConnectionString("DefaultConnection"),
                npgsql => npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)
            )
        );

        // Identity
        services.AddIdentity<ApplicationUser, IdentityRole>(opts =>
        {
            opts.Password.RequiredLength = 8;
            opts.Password.RequireUppercase = true;
            opts.Password.RequireDigit = true;
            opts.Password.RequireNonAlphanumeric = false;
            opts.Lockout.MaxFailedAccessAttempts = 5;
            opts.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            opts.User.RequireUniqueEmail = true;
        })
        .AddEntityFrameworkStores<AppDbContext>()
        .AddDefaultTokenProviders();

        // JWT Authentication
        var jwtSecret = config["Jwt:Secret"] ?? throw new InvalidOperationException("Jwt:Secret not configured");
        services.AddAuthentication(opts =>
        {
            opts.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            opts.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(opts =>
        {
            opts.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                ValidateIssuer = true,
                ValidIssuer = config["Jwt:Issuer"] ?? "SacredVibesApi",
                ValidateAudience = true,
                ValidAudience = config["Jwt:Audience"] ?? "SacredVibesAdmin",
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(30)
            };
        });

        // HTTP clients
        services.AddHttpClient("Square");
        services.AddHttpClient("Stripe");

        // Core services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IStorageService, LocalStorageService>();
        services.AddScoped<IImageProcessingService, ImageProcessingService>();
        services.AddScoped<ISquareService, SquareService>();
        services.AddScoped<IStripeImportService, StripeImportService>();
        services.AddScoped<ICsvImportService, CsvImportService>();

        return services;
    }
}
