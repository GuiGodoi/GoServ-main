using Backend.Models;

namespace Backend.Repositories
{
    public interface IOrderRepository
    {
        Task<Order> AddAsync(Order order);
        Task<Order?> GetByIdAsync(int id);
        Task<Order?> GetByPublicIdAsync(Guid publicId);
        Task<List<Order>> GetAllAsync(string? status = null);
        Task UpdateAsync(Order order);
        Task<decimal> GetSessionSpentAsync(int tableSessionId);
        Task<int> CountSessionOrdersAsync(int tableSessionId);
    }
}
