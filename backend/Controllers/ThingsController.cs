using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Web.Resource;

namespace EntraExternalIdDemo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ThingsController : ControllerBase
{
    /// <summary>
    /// GET /api/things - requires Things.Read scope.
    /// Shows identity shared from frontend token (same user/sub).
    /// </summary>
    [HttpGet]
    [RequiredScope("Things.Read")]
    public IActionResult List()
    {
        var identity = GetIdentitySummary();
        return Ok(new
        {
            message = "List of things (requires Things.Read scope). Identity from your token:",
            identity,
            items = new[] { "Thing 1", "Thing 2", "Thing 3" }
        });
    }

    /// <summary>
    /// POST /api/things - requires Things.Write scope.
    /// Demonstrates a write operation gated by scope.
    /// </summary>
    [HttpPost]
    [RequiredScope("Things.Write")]
    public IActionResult Create([FromBody] CreateThingRequest request)
    {
        var identity = GetIdentitySummary();
        return Ok(new
        {
            message = "Thing created (requires Things.Write scope). Identity from your token:",
            identity,
            created = new { id = Guid.NewGuid(), name = request.Name }
        });
    }

    /// <summary>
    /// GET /api/things/me - requires Things.Read.
    /// Returns the same identity the frontend used (shared identity).
    /// </summary>
    [HttpGet("me")]
    [RequiredScope("Things.Read")]
    public IActionResult Me()
    {
        return Ok(GetIdentitySummary());
    }

    private object GetIdentitySummary()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        var oid = User.FindFirst("oid")?.Value;
        var name = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst("name")?.Value;
        var preferredUsername = User.FindFirst("preferred_username")?.Value;
        var scopes = User.FindFirst("scp")?.Value ?? User.FindFirst("http://schemas.microsoft.com/identity/claims/scope")?.Value;

        return new
        {
            sub,
            oid,
            name,
            preferred_username = preferredUsername,
            scopes = scopes?.Split(' ', StringSplitOptions.RemoveEmptyEntries) ?? Array.Empty<string>()
        };
    }
}

public record CreateThingRequest(string Name);
