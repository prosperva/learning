using Microsoft.AspNetCore.Mvc;

namespace CommonFields.API.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private static readonly object[] _categories =
    [
        new { label = "Electronics",    value = "electronics"  },
        new { label = "Clothing",       value = "clothing"     },
        new { label = "Books",          value = "books"        },
        new { label = "Home & Garden",  value = "home-garden"  },
        new { label = "Sports & Outdoors", value = "sports"   },
        new { label = "Toys & Games",   value = "toys"         },
        new { label = "Food & Beverages", value = "food"       },
        new { label = "Health & Beauty", value = "health"      },
    ];

    [HttpGet]
    public IActionResult Get() => Ok(_categories);
}
