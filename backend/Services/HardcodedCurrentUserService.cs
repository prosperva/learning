namespace CommonFields.API.Services;

/// <summary>
/// Placeholder — replace with real auth (JWT claims / cookie identity) when auth is wired up.
/// </summary>
public class HardcodedCurrentUserService : ICurrentUserService
{
    public string GetCurrentUser() => "demo@app.com";
}
