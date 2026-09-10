using Backend.Data;
using Backend.Dtos;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories
{
    public interface IReportRepository
    {
        Task<DailyReportDto> GetDailyReportAsync(DateOnly date);
    }

    public class ReportRepository : IReportRepository
    {
        private readonly ApplicationDbContext _db;

        public ReportRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<DailyReportDto> GetDailyReportAsync(DateOnly date)
        {
            var start = DateTime.SpecifyKind(date.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
            var end = start.AddDays(1);

            var dayOrders = await _db.Orders
                .AsNoTracking()
                .Include(o => o.Items)
                .Where(o => o.CreatedAt >= start && o.CreatedAt < end)
                .ToListAsync();

            var salesOrders = dayOrders
                .Where(o =>
                    o.Status != OrderStatuses.Cancelled &&
                    o.Status != OrderStatuses.AwaitingPayment)
                .ToList();

            var totalSales = salesOrders.Sum(o => o.Total);
            var count = salesOrders.Count;

            var topItems = salesOrders
                .SelectMany(o => o.Items)
                .GroupBy(i => new { i.MenuItemId, i.MenuItemName })
                .Select(g => new TopItemDto
                {
                    MenuItemId = g.Key.MenuItemId,
                    Name = g.Key.MenuItemName,
                    QuantitySold = g.Sum(x => x.Quantity),
                    Revenue = g.Sum(x => x.LineTotal)
                })
                .OrderByDescending(x => x.QuantitySold)
                .ThenByDescending(x => x.Revenue)
                .Take(10)
                .ToList();

            var byStatus = dayOrders
                .GroupBy(o => o.Status)
                .Select(g => new OrdersByStatusDto
                {
                    Status = g.Key,
                    Count = g.Count()
                })
                .OrderBy(x => x.Status)
                .ToList();

            return new DailyReportDto
            {
                Date = date,
                OrdersCount = count,
                TotalSales = Math.Round(totalSales, 2, MidpointRounding.AwayFromZero),
                AverageTicket = count == 0
                    ? 0
                    : Math.Round(totalSales / count, 2, MidpointRounding.AwayFromZero),
                TopItems = topItems,
                ByStatus = byStatus
            };
        }
    }
}
