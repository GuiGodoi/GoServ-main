using Backend.Dtos;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MenuItemsController : ControllerBase
    {
        private readonly IMenuItemService _service;

        public MenuItemsController(IMenuItemService service)
        {
            _service = service;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<List<MenuItemDto>>> GetAll([FromQuery] bool availableOnly = false) =>
            Ok(await _service.GetAllAsync(availableOnly));

        [HttpGet("{id:int}")]
        [AllowAnonymous]
        public async Task<ActionResult<MenuItemDto>> GetById(int id)
        {
            var item = await _service.GetByIdAsync(id);
            return item is null ? NotFound() : Ok(item);
        }

        [HttpGet("{id:int}/photo")]
        [AllowAnonymous]
        [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any)]
        public async Task<IActionResult> GetPhoto(int id)
        {
            var photo = await _service.GetPhotoAsync(id);
            if (photo is null) return NotFound();
            return File(photo.Value.Data, photo.Value.ContentType);
        }

        [HttpPost]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<ActionResult<MenuItemDto>> Create(CreateMenuItemDto dto)
        {
            try
            {
                var created = await _service.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<ActionResult<MenuItemDto>> Update(int id, UpdateMenuItemDto dto)
        {
            try
            {
                var updated = await _service.UpdateAsync(id, dto);
                return updated is null ? NotFound() : Ok(updated);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id:int}/photo")]
        [Authorize(Roles = UserRoles.Admin)]
        [RequestSizeLimit(ImageConverter.MaxUploadBytes)]
        public async Task<ActionResult<MenuItemDto>> UploadPhoto(int id, IFormFile file)
        {
            if (file is null || file.Length == 0)
                return BadRequest(new { message = "Envie um arquivo de imagem." });

            try
            {
                await using var stream = file.OpenReadStream();
                var updated = await _service.SetPhotoAsync(
                    id,
                    stream,
                    file.Length,
                    file.ContentType,
                    file.FileName);
                return updated is null ? NotFound() : Ok(updated);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id:int}/photo")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> DeletePhoto(int id)
        {
            var cleared = await _service.ClearPhotoAsync(id);
            return cleared ? NoContent() : NotFound();
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteAsync(id);
            return deleted ? NoContent() : NotFound();
        }
    }
}
