using System.Security.Claims;
using Backend.Dtos;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    /// <summary>Rotas de login e dados do usuário logado (/api/auth/...).</summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _auth;

        public AuthController(IAuthService auth)
        {
            _auth = auth;
        }

        /// <summary>POST /api/auth/login — recebe e-mail/senha e devolve um token JWT.</summary>
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<LoginResponseDto>> Login(LoginRequestDto dto)
        {
            try
            {
                var result = await _auth.LoginAsync(dto);
                if (result is null)
                    return Unauthorized(new { message = "E-mail ou senha inválidos." });

                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>GET /api/auth/me — dados do usuário dono do token enviado no cabeçalho Authorization.</summary>
        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<MeDto>> Me()
        {
            // O id do usuário vem de dentro do próprio token JWT (claim "sub"),
            // não precisa vir na URL nem no corpo da requisição.
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");

            if (!int.TryParse(sub, out var userId))
                return Unauthorized();

            var me = await _auth.GetMeAsync(userId);
            return me is null ? Unauthorized() : Ok(me);
        }
    }
}
