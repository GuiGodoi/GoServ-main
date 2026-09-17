using Backend.Models;

namespace Backend.Repositories
{
    /// <summary>Acesso a dados dos usuários do sistema (login).</summary>
    public interface IUserRepository
    {
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByIdAsync(int id);
        /// <summary>True se já existe pelo menos um usuário cadastrado (usado para saber se precisa criar o admin inicial).</summary>
        Task<bool> AnyAsync();
        Task AddAsync(User user);
    }
}
