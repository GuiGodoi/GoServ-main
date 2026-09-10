using Backend.Dtos;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
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

        [HttpGet]
        [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Kitchen}")]
        public async Task<ActionResult<QrCatalogDto>> Catalog() =>
            Ok(await _tables.GetQrCatalogAsync());

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
