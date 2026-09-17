using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    /// <summary>Rota raiz ("/"): só uma mensagem simples pra confirmar que a API está no ar.</summary>
    [ApiController]
    public class HomeController : ControllerBase
    {
        [HttpGet("/")]
        public IActionResult Index() => Content("API funcionando");
    }
}
