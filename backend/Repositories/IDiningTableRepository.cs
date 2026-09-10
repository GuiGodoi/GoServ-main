using Backend.Models;

namespace Backend.Repositories
{
    public interface IDiningTableRepository
    {
        Task<List<DiningTable>> GetAllAsync();
        Task<DiningTable?> GetByIdAsync(int id);
        Task<DiningTable> AddAsync(DiningTable table);
        Task<TableSession?> GetOpenSessionByTableIdAsync(int tableId);
        Task<TableSession?> GetSessionByTokenAsync(string token);
        Task<TableSession> AddSessionAsync(TableSession session);
        Task UpdateSessionAsync(TableSession session);
        Task CloseOpenSessionsAsync(int tableId);
    }
}
