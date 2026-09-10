using Backend.Options;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RestaurantController : ControllerBase
    {
        private readonly RestaurantOptions _options;

        public RestaurantController(IOptions<RestaurantOptions> options)
        {
            _options = options.Value;
        }

        [HttpGet]
        [AllowAnonymous]
        public ActionResult<object> Get() =>
            Ok(new
            {
                name = _options.Name,
                pixExpiresMinutes = _options.PixExpiresMinutes,
                clientPublicUrl = _options.ClientPublicUrl
            });
    }
}
