using Backend.Dtos;

namespace Backend.Services
{
    public interface IMenuItemService
    {
        Task<List<MenuItemDto>> GetAllAsync(bool onlyAvailable = false);
        Task<MenuItemDto?> GetByIdAsync(int id);
        Task<MenuItemDto> CreateAsync(CreateMenuItemDto dto);
        Task<MenuItemDto?> UpdateAsync(int id, UpdateMenuItemDto dto);
        Task<bool> DeleteAsync(int id);
        Task<(byte[] Data, string ContentType)?> GetPhotoAsync(int id);
        Task<MenuItemDto?> SetPhotoAsync(int id, Stream photoStream, long contentLength, string? contentType, string? fileName);
        Task<bool> ClearPhotoAsync(int id);
    }
}
