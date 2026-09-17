using Backend.Dtos;
using Backend.Models;
using Backend.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    /// <summary>Consulta o histórico de auditoria (só admin pode ver).</summary>
    [ApiController]
    [Route("api/audit")]
    [Authorize(Roles = UserRoles.Admin)]
    public class AuditController : ControllerBase
    {
        private readonly IAuditLogRepository _audit;

        public AuditController(IAuditLogRepository audit)
        {
            _audit = audit;
        }

        /// <summary>GET /api/audit?take=50 — últimos registros de auditoria (limitado a 200 por vez).</summary>
        [HttpGet]
        public async Task<ActionResult<List<AuditLogDto>>> GetRecent([FromQuery] int take = 50)
        {
            take = Math.Clamp(take, 1, 200);
            var entries = await _audit.GetRecentAsync(take);
            return Ok(entries.Select(e => new AuditLogDto
            {
                Id = e.Id,
                EntityType = e.EntityType,
                EntityId = e.EntityId,
                Action = e.Action,
                FromValue = e.FromValue,
                ToValue = e.ToValue,
                ActorName = e.ActorName,
                CreatedAt = e.CreatedAt
            }).ToList());
        }
    }
}
