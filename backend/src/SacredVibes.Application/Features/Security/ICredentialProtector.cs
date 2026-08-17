namespace SacredVibes.Application.Features.Security;

public interface ICredentialProtector
{
    string Protect(string value);
    string Unprotect(string protectedValue);
}
