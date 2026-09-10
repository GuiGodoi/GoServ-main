using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly ApplicationDbContext _db;

        public OrderRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<Order> AddAsync(Order order)
        {
            _db.Orders.Add(order);
            await _db.SaveChangesAsync();
            return order;
        }

        public Task<Order?> GetByIdAsync(int id) =>
            _db.Orders
                .Include(o => o.Items)
                    .ThenInclude(i => i.Addons)
                .FirstOrDefaultAsync(o => o.Id == id);

        public Task<Order?> GetByPublicIdAsync(Guid publicId) =>
            _db.Orders
                .Include(o => o.Items)
                    .ThenInclude(i => i.Addons)
                .FirstOrDefaultAsync(o => o.PublicId == publicId);

        public Task<List<Order>> GetAllAsync(string? status = null)
        {
            var query = _db.Orders
                .Include(o => o.Items)
                    .ThenInclude(i => i.Addons)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(o => o.Status == status);

            return query.OrderByDescending(o => o.CreatedAt).ToListAsync();
        }

        public async Task UpdateAsync(Order order)
        {
            _db.Orders.Update(order);
            await _db.SaveChangesAsync();
        }

        public async Task<decimal> GetSessionSpentAsync(int tableSessionId)
        {
            var sum = await _db.Orders
                .Where(o =>
                    o.TableSessionId == tableSessionId &&
                    o.Status != OrderStatuses.Cancelled)
                .SumAsync(o => (decimal?)o.Total);

            return sum ?? 0m;
        }

        public Task<int> CountSessionOrdersAsync(int tableSessionId) =>
            _db.Orders.CountAsync(o =>
                o.TableSessionId == tableSessionId &&
                o.Status != OrderStatuses.Cancelled);
    }
}
