using Backend.Models;

namespace Backend.Repositories
{
    /// <summary>Acesso a dados das mesas e das sessões abertas nelas.</summary>
    public interface IDiningTableRepository
    {
        Task<List<DiningTable>> GetAllAsync();
        Task<DiningTable?> GetByIdAsync(int id);
        Task<DiningTable> AddAsync(DiningTable table);
        /// <summary>Sessão em aberto (ainda não fechada/expirada) da mesa, se houver.</summary>
        Task<TableSession?> GetOpenSessionByTableIdAsync(int tableId);
        /// <summary>Busca a sessão pelo token guardado no navegador do cliente.</summary>
        Task<TableSession?> GetSessionByTokenAsync(string token);
        Task<TableSession> AddSessionAsync(TableSession session);
        Task UpdateSessionAsync(TableSession session);
        /// <summary>Fecha qualquer sessão ainda aberta nessa mesa (usado antes de abrir uma nova).</summary>
        Task CloseOpenSessionsAsync(int tableId);
    }
}
