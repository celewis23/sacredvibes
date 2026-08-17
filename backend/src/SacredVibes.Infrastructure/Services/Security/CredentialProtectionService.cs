using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using SacredVibes.Application.Features.Security;

namespace SacredVibes.Infrastructure.Services.Security;

public class CredentialProtectionService : ICredentialProtector
{
    private readonly IConfiguration _config;

    public CredentialProtectionService(IConfiguration config)
    {
        _config = config;
    }

    public string Protect(string value)
    {
        var key = GetCredentialKey();
        var nonce = RandomNumberGenerator.GetBytes(12);
        var plaintext = Encoding.UTF8.GetBytes(value);
        var ciphertext = new byte[plaintext.Length];
        var tag = new byte[16];

        using var aes = new AesGcm(key, 16);
        aes.Encrypt(nonce, plaintext, ciphertext, tag);

        var payload = new byte[nonce.Length + tag.Length + ciphertext.Length];
        Buffer.BlockCopy(nonce, 0, payload, 0, nonce.Length);
        Buffer.BlockCopy(tag, 0, payload, nonce.Length, tag.Length);
        Buffer.BlockCopy(ciphertext, 0, payload, nonce.Length + tag.Length, ciphertext.Length);
        return $"v1:{Convert.ToBase64String(payload)}";
    }

    public string Unprotect(string protectedValue)
    {
        if (!protectedValue.StartsWith("v1:", StringComparison.Ordinal))
            return string.Empty;

        var payload = Convert.FromBase64String(protectedValue[3..]);
        if (payload.Length < 29) return string.Empty;

        var nonce = payload[..12];
        var tag = payload[12..28];
        var ciphertext = payload[28..];
        var plaintext = new byte[ciphertext.Length];

        using var aes = new AesGcm(GetCredentialKey(), 16);
        aes.Decrypt(nonce, ciphertext, tag, plaintext);
        return Encoding.UTF8.GetString(plaintext);
    }

    private byte[] GetCredentialKey()
    {
        // Order preserved for backward compatibility with secrets already encrypted
        // under the previous per-service EMAIL_CREDENTIAL_KEY-based key resolution.
        var secret = Environment.GetEnvironmentVariable("CREDENTIAL_ENCRYPTION_KEY")
            ?? _config["Credentials:EncryptionKey"]
            ?? Environment.GetEnvironmentVariable("EMAIL_CREDENTIAL_KEY")
            ?? _config["Email:CredentialKey"]
            ?? Environment.GetEnvironmentVariable("Jwt__Secret")
            ?? _config["Jwt:Secret"];

        if (string.IsNullOrWhiteSpace(secret))
            throw new InvalidOperationException("Credential encryption key is not configured.");

        return SHA256.HashData(Encoding.UTF8.GetBytes(secret));
    }
}
