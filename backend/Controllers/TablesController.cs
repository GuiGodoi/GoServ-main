using Backend.Dtos;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    /// <summary>
    /// Rotas de mesas e sessões: cadastro/gestão (equipe) e o fluxo do cliente
    /// abrindo/usando a mesa pelo QR code (público).
    /// </summary>
    [ApiController]
    [Route("api/tables")]
    public class TablesController : ControllerBase
    {
        private readonly ITableService _service;

        public TablesController(ITableService service)
        {
            _service = service;
        }

        /// <summary>Lista de mesas + sessão aberta em cada uma, para o painel da equipe.</summary>
        [HttpGet]
        [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Kitchen}")]
        public async Task<ActionResult<List<DiningTableDto>>> GetAll() =>
            Ok(await _service.GetTablesAsync());

        [HttpPost]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<ActionResult<DiningTableDto>> Create(CreateDiningTableDto dto)
        {
            try
            {
                var created = await _service.CreateTableAsync(dto);
                return CreatedAtAction(nameof(GetAll), new { id = created.Id }, created);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>Dados públicos da mesa (nome da mesa/restaurante), exibidos antes do cliente digitar a senha do dia.</summary>
        [HttpGet("{id:int}/public")]
        [AllowAnonymous]
        public async Task<ActionResult<PublicTableDto>> GetPublic(int id)
        {
            var table = await _service.GetPublicTableAsync(id);
            return table is null ? NotFound(new { message = "Mesa não encontrada." }) : Ok(table);
        }

        /// <summary>O cliente digita nome + senha do dia para liberar a mesa (fluxo do QR code).</summary>
        [HttpPost("{id:int}/join")]
        [AllowAnonymous]
        public async Task<ActionResult<TableSessionDto>> Join(int id, JoinTableDto dto)
        {
            try
            {
                var session = await _service.JoinTableAsync(id, dto);
                return Ok(session);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>Abertura manual de sessão pela equipe (sem exigir a senha do dia).</summary>
        [HttpPost("{id:int}/sessions")]
        [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Kitchen}")]
        public async Task<ActionResult<TableSessionDto>> OpenSession(int id, OpenTableSessionDto? dto)
        {
            try
            {
                var session = await _service.OpenSessionAsync(id, dto ?? new OpenTableSessionDto());
                return Ok(session);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id:int}/sessions/close")]
        [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Kitchen}")]
        public async Task<IActionResult> CloseSession(int id)
        {
            var closed = await _service.CloseSessionAsync(id);
            return closed ? NoContent() : NotFound();
        }

        /// <summary>Libera/aumenta o teto de gastos da sessão aberta (equipe).</summary>
        [HttpPost("{id:int}/sessions/raise-cap")]
        [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Kitchen}")]
        public async Task<ActionResult<TableSessionDto>> RaiseCap(int id, RaiseSessionCapDto dto)
        {
            try
            {
                var session = await _service.RaiseSessionCapAsync(id, dto.SpendingCap);
                return session is null ? NotFound() : Ok(session);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>Confere se o token de sessão guardado no navegador do cliente ainda vale.</summary>
        [HttpGet("sessions/{accessToken}")]
        [AllowAnonymous]
        public async Task<ActionResult<TableSessionDto>> ValidateSession(string accessToken)
        {
            var session = await _service.ValidateTokenAsync(accessToken);
            return session is null
                ? NotFound(new { message = "Sessão inválida ou expirada." })
                : Ok(session);
        }
    }
}
