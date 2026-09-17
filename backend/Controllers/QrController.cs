using Backend.Dtos;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    /// <summary>
    /// Gera o catálogo de QR codes das mesas (links + senha do dia) e permite
    /// trocar a senha do dia manualmente. Só a equipe (Admin/Cozinha) acessa.
    /// </summary>
    [ApiController]
    [Route("api/qr")]
    public class QrController : ControllerBase
    {
        private readonly ITableService _tables;
        private readonly IDayPasscodeService _dayPasscodes;

        public QrController(ITableService tables, IDayPasscodeService dayPasscodes)
        {
            _tables = tables;
            _dayPasscodes = dayPasscodes;
        }

        /// <summary>Lista de links (um por mesa) + senha do dia, para montar/imprimir os QR codes.</summary>
        [HttpGet]
        [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Kitchen}")]
        public async Task<ActionResult<QrCatalogDto>> Catalog() =>
            Ok(await _tables.GetQrCatalogAsync());

        /// <summary>Gera uma nova senha do dia na hora (ex: se a equipe suspeitar que vazou).</summary>
        [HttpPost("day-passcode/rotate")]
        [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Kitchen}")]
        public async Task<ActionResult<object>> RotateDayPasscode()
        {
            var day = await _dayPasscodes.RotateTodayAsync();
            return Ok(new
            {
                day = day.Day.ToString("yyyy-MM-dd"),
                dayLabel = day.Day.ToString("dd/MM/yyyy"),
                code = day.Code,
                rotatedAt = day.RotatedAt
            });
        }
    }
}
