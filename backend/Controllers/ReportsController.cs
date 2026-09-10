using Backend.Dtos;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/reports")]
    [Authorize(Roles = UserRoles.Admin)]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reports;

        public ReportsController(IReportService reports)
        {
            _reports = reports;
        }

        /// <summary>Relatório diário: vendas, ticket médio e itens mais vendidos.</summary>
        [HttpGet("daily")]
        public async Task<ActionResult<DailyReportDto>> Daily([FromQuery] string? date = null)
        {
            DateOnly? parsed = null;
            if (!string.IsNullOrWhiteSpace(date))
            {
                if (!DateOnly.TryParse(date, out var d))
                    return BadRequest(new { message = "Data inválida. Use AAAA-MM-DD." });
                parsed = d;
            }

            return Ok(await _reports.GetDailyReportAsync(parsed));
        }
    }
}
