using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using SacredVibes.Application.Common.Interfaces;
using SacredVibes.Application.Features.Auth;
using SacredVibes.Application.Features.Imports;
using SacredVibes.Application.Features.Payments;
using SacredVibes.Domain.Entities;
using SacredVibes.Domain.Interfaces;
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
        var connectionString = ResolveConnectionString(config);

        // Database
        services.AddDbContext<AppDbContext>(opts =>
            opts.UseNpgsql(
                connectionString,
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

    private static string ResolveConnectionString(IConfiguration config)
    {
        var environmentConnectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
        if (!string.IsNullOrWhiteSpace(environmentConnectionString))
        {
            return environmentConnectionString;
        }

        var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL") ?? config["DATABASE_URL"];
        if (!string.IsNullOrWhiteSpace(databaseUrl))
        {
            return NormalizeConnectionString(databaseUrl);
        }

        var pgHost = Environment.GetEnvironmentVariable("PGHOST") ?? config["PGHOST"];
        if (!string.IsNullOrWhiteSpace(pgHost))
        {
            var builder = new NpgsqlConnectionStringBuilder
            {
                Host = pgHost,
                Port = int.TryParse(Environment.GetEnvironmentVariable("PGPORT") ?? config["PGPORT"], out var port) ? port : 5432,
                Database = Environment.GetEnvironmentVariable("PGDATABASE") ?? config["PGDATABASE"] ?? "postgres",
                Username = Environment.GetEnvironmentVariable("PGUSER") ?? config["PGUSER"] ?? "postgres",
                Password = Environment.GetEnvironmentVariable("PGPASSWORD") ?? config["PGPASSWORD"] ?? string.Empty
            };

            return builder.ConnectionString;
        }

        var configuredConnectionString = config.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrWhiteSpace(configuredConnectionString))
        {
            return configuredConnectionString;
        }

        throw new InvalidOperationException(
            "No PostgreSQL connection string configured. Set ConnectionStrings__DefaultConnection or DATABASE_URL."
        );
    }

    private static string NormalizeConnectionString(string value)
    {
        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) ||
            (uri.Scheme != "postgres" && uri.Scheme != "postgresql"))
        {
            return value;
        }

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort ? 5432 : uri.Port,
            Database = uri.AbsolutePath.Trim('/'),
        };

        if (!string.IsNullOrWhiteSpace(uri.UserInfo))
        {
            var parts = uri.UserInfo.Split(':', 2);
            builder.Username = Uri.UnescapeDataString(parts[0]);
            if (parts.Length > 1)
            {
                builder.Password = Uri.UnescapeDataString(parts[1]);
            }
        }

        foreach (var pair in uri.Query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var pieces = pair.Split('=', 2);
            if (pieces.Length != 2) continue;

            var key = Uri.UnescapeDataString(pieces[0]);
            var valuePart = Uri.UnescapeDataString(pieces[1]);

            if (key.Equals("sslmode", StringComparison.OrdinalIgnoreCase))
            {
                if (Enum.TryParse<SslMode>(valuePart, true, out var sslMode))
                {
                    builder.SslMode = sslMode;
                }

                continue;
            }

            if (key.Equals("trust server certificate", StringComparison.OrdinalIgnoreCase) &&
                bool.TryParse(valuePart, out var trustServerCertificate))
            {
                builder.TrustServerCertificate = trustServerCertificate;
            }
        }

        return builder.ConnectionString;
    }
}
