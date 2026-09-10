using Backend.Models;

namespace Backend.Repositories
{
    public interface IUserRepository
    {
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByIdAsync(int id);
        Task<bool> AnyAsync();
        Task AddAsync(User user);
    }
}
