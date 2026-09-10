using Backend.Models;

namespace Backend.Repositories
{
    public interface IAuditLogRepository
    {
        Task AddAsync(AuditLog entry);
        Task<List<AuditLog>> GetRecentAsync(int take = 100);
    }
}
