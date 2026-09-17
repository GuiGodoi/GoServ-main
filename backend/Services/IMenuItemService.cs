using Backend.Dtos;

namespace Backend.Services
{
    /// <summary>Regras de negócio para o CRUD de produtos do cardápio, incluindo a foto.</summary>
    public interface IMenuItemService
    {
        Task<List<MenuItemDto>> GetAllAsync(bool onlyAvailable = false);
        Task<MenuItemDto?> GetByIdAsync(int id);
        Task<MenuItemDto> CreateAsync(CreateMenuItemDto dto);
        Task<MenuItemDto?> UpdateAsync(int id, UpdateMenuItemDto dto);
        Task<bool> DeleteAsync(int id);
        Task<(byte[] Data, string ContentType)?> GetPhotoAsync(int id);
        /// <summary>Recebe o arquivo enviado, converte a imagem e salva no produto.</summary>
        Task<MenuItemDto?> SetPhotoAsync(int id, Stream photoStream, long contentLength, string? contentType, string? fileName);
        /// <summary>Remove a foto do produto (volta a não ter imagem).</summary>
        Task<bool> ClearPhotoAsync(int id);
    }
}
