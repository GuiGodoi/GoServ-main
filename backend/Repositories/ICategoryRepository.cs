using Backend.Models;

namespace Backend.Repositories
{
    /// <summary>Acesso a dados (CRUD) das categorias do cardápio.</summary>
    public interface ICategoryRepository
    {
        Task<List<Category>> GetAllAsync();
        Task<Category?> GetByIdAsync(int id);
        Task<Category> AddAsync(Category category);
        Task UpdateAsync(Category category);
        Task DeleteAsync(Category category);
    }
}
