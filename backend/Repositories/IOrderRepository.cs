using Backend.Models;

namespace Backend.Repositories
{
    /// <summary>Acesso a dados dos pedidos.</summary>
    public interface IOrderRepository
    {
        Task<Order> AddAsync(Order order);
        Task<Order?> GetByIdAsync(int id);
        /// <summary>Busca pelo Id público (UUID) usado pelo cliente para acompanhar o pedido.</summary>
        Task<Order?> GetByPublicIdAsync(Guid publicId);
        Task<List<Order>> GetAllAsync(string? status = null);
        Task UpdateAsync(Order order);
        /// <summary>Soma o total já gasto pela sessão de mesa (usado para checar o teto de gastos).</summary>
        Task<decimal> GetSessionSpentAsync(int tableSessionId);
        /// <summary>Conta quantos pedidos a sessão de mesa já fez (usado para checar o limite de pedidos).</summary>
        Task<int> CountSessionOrdersAsync(int tableSessionId);
    }
}
