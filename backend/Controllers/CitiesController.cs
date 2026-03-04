using Microsoft.AspNetCore.Mvc;

namespace CommonFields.API.Controllers;

[ApiController]
[Route("api/cities")]
public class CitiesController : ControllerBase
{
    private static readonly object[] _cities =
    [
        new { id = "nyc", name = "New York City", country = "US" },
        new { id = "lon", name = "London",         country = "UK" },
        new { id = "tok", name = "Tokyo",           country = "JP" },
        new { id = "par", name = "Paris",           country = "FR" },
        new { id = "ber", name = "Berlin",          country = "DE" },
        new { id = "syd", name = "Sydney",          country = "AU" },
        new { id = "tor", name = "Toronto",         country = "CA" },
        new { id = "mum", name = "Mumbai",          country = "IN" },
    ];

    [HttpGet]
    public IActionResult Get() => Ok(_cities);
}
