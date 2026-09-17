using Backend.Models;

namespace Backend.Repositories
{
    /// <summary>Acesso a dados (CRUD) dos produtos do cardápio.</summary>
    public interface IMenuItemRepository
    {
        Task<List<MenuItem>> GetAllAsync(bool onlyAvailable = false);
        Task<MenuItem?> GetByIdAsync(int id);
        /// <summary>Busca só os campos da foto (para servir a imagem sem carregar o item inteiro).</summary>
        Task<MenuItem?> GetPhotoAsync(int id);
        Task<MenuItem> AddAsync(MenuItem item);
        Task UpdateAsync(MenuItem item);
        Task DeleteAsync(MenuItem item);
        /// <summary>Confere se a categoria existe, usado para validar o CategoryId antes de salvar.</summary>
        Task<bool> CategoryExistsAsync(int categoryId);
    }
}
