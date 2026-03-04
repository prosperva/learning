using Microsoft.AspNetCore.Mvc;

namespace CommonFields.API.Controllers;

[ApiController]
[Route("api/countries")]
public class CountriesController : ControllerBase
{
    private static readonly object[] _countries =
    [
        new { label = "United States",  value = "us" },
        new { label = "Canada",         value = "ca" },
        new { label = "United Kingdom", value = "uk" },
        new { label = "Germany",        value = "de" },
        new { label = "France",         value = "fr" },
        new { label = "Japan",          value = "jp" },
        new { label = "Australia",      value = "au" },
        new { label = "Brazil",         value = "br" },
        new { label = "India",          value = "in" },
        new { label = "China",          value = "cn" },
    ];

    [HttpGet]
    public IActionResult Get() => Ok(_countries);
}
