using Microsoft.AspNetCore.Mvc;
using Backend.Models;

namespace Backend.Controllers
{
    /// <summary>GET /api/health — só confirma que a API está de pé (usado pelo db-reset.ps1 e monitoramento).</summary>
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get() => Ok(new HealthStatus { Status = "ok" });
    }
}
