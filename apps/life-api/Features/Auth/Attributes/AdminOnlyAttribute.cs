using Microsoft.AspNetCore.Authorization;

namespace LifeApi.Features.Auth.Attributes;

/// <summary>
/// Authorization attribute that requires the user to have the Admin role.
/// Apply this to controllers or actions that should only be accessible to administrators.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public class AdminOnlyAttribute : AuthorizeAttribute
{
    public AdminOnlyAttribute()
    {
        Roles = "Admin";
    }
}
