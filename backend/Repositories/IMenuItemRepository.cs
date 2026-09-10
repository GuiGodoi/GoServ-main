using Backend.Models;

namespace Backend.Repositories
{
    public interface IMenuItemRepository
    {
        Task<List<MenuItem>> GetAllAsync(bool onlyAvailable = false);
        Task<MenuItem?> GetByIdAsync(int id);
        Task<MenuItem?> GetPhotoAsync(int id);
        Task<MenuItem> AddAsync(MenuItem item);
        Task UpdateAsync(MenuItem item);
        Task DeleteAsync(MenuItem item);
        Task<bool> CategoryExistsAsync(int categoryId);
    }
}
