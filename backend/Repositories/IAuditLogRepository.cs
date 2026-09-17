using Backend.Models;

namespace Backend.Repositories
{
    /// <summary>Acesso a dados do log de auditoria (histórico de alterações do sistema).</summary>
    public interface IAuditLogRepository
    {
        Task AddAsync(AuditLog entry);
        Task<List<AuditLog>> GetRecentAsync(int take = 100);
    }
}
