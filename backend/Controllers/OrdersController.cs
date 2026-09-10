using Backend.Dtos;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _service;

        public OrdersController(IOrderService service)
        {
            _service = service;
        }

        [HttpGet("addons/{menuItemId:int}")]
        [AllowAnonymous]
        public async Task<ActionResult<List<AddonDto>>> GetAddons(int menuItemId) =>
            Ok(await _service.GetAddonsForMenuItemAsync(menuItemId));

        [HttpPost]
        [AllowAnonymous]
        public async Task<ActionResult<OrderDto>> Create(CreateOrderDto dto)
        {
            try
            {
                var created = await _service.CreateAsync(dto);
                return CreatedAtAction(nameof(GetByPublicId), new { publicId = created.PublicId }, created);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id:int}")]
        [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Kitchen}")]
        public async Task<ActionResult<OrderDto>> GetById(int id)
        {
            var order = await _service.GetByIdAsync(id);
            return order is null ? NotFound() : Ok(order);
        }

        [HttpGet("public/{publicId:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<OrderDto>> GetByPublicId(Guid publicId)
        {
            var order = await _service.GetByPublicIdAsync(publicId);
            return order is null ? NotFound() : Ok(order);
        }

        /// <summary>
        /// Simula o webhook do provedor Pix (aula 7). Só então o pedido entra na cozinha.
        /// </summary>
        [HttpPost("public/{publicId:guid}/confirm-payment")]
        [AllowAnonymous]
        public async Task<ActionResult<OrderDto>> ConfirmPayment(Guid publicId)
        {
            try
            {
                var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
                var updated = await _service.ConfirmPaymentAsync(publicId, ip);
                return updated is null ? NotFound() : Ok(updated);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet]
        [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Kitchen}")]
        public async Task<ActionResult<List<OrderDto>>> GetAll([FromQuery] string? status = null) =>
            Ok(await _service.GetAllAsync(status));

        [HttpPatch("{id:int}/status")]
        [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Kitchen}")]
        public async Task<ActionResult<OrderDto>> UpdateStatus(int id, UpdateOrderStatusDto dto)
        {
            try
            {
                var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
                var updated = await _service.UpdateStatusAsync(id, dto.Status, User, ip);
                return updated is null ? NotFound() : Ok(updated);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
