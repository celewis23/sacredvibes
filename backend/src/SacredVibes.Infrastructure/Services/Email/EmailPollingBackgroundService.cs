using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SacredVibes.Application.Features.Email;
using SacredVibes.Application.Features.Push;

namespace SacredVibes.Infrastructure.Services.Email;

// Periodically checks the studio inbox for new mail and pushes a notification to admins.
// Runs as a singleton hosted service, so each tick opens its own DI scope to use the
// scoped AppDbContext-backed services safely.
public class EmailPollingBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<EmailPollingBackgroundService> _logger;

    public EmailPollingBackgroundService(
        IServiceScopeFactory scopeFactory,
        IConfiguration config,
        ILogger<EmailPollingBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _config = config;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var configuredSeconds = Environment.GetEnvironmentVariable("EMAIL_POLLING_INTERVAL_SECONDS")
            ?? _config["Email:PollingIntervalSeconds"];
        var interval = TimeSpan.FromSeconds(
            int.TryParse(configuredSeconds, out var seconds) ? Math.Max(30, seconds) : 120);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PollOnceAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                // A single bad tick (mailbox unreachable, transient IMAP error, etc.)
                // must never stop the polling loop.
                _logger.LogWarning(ex, "Email polling tick failed");
            }

            try
            {
                await Task.Delay(interval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task PollOnceAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var mailbox = scope.ServiceProvider.GetRequiredService<IEmailMailboxService>();
        var push = scope.ServiceProvider.GetRequiredService<IPushNotificationService>();

        int newCount;
        try
        {
            newCount = await mailbox.PollForNewMessagesAsync(ct);
        }
        catch (InvalidOperationException ex)
        {
            // Not configured/enabled yet, or the mailbox is temporarily unreachable —
            // logged at Debug since this is expected before setup and shouldn't be noisy.
            _logger.LogDebug(ex, "Email poll skipped: {Message}", ex.Message);
            return;
        }

        if (newCount == 0) return;

        await push.SendToAdminsAsync(
            "New email",
            newCount == 1 ? "You have 1 new email" : $"You have {newCount} new emails",
            "/admin/email",
            ct);
    }
}
