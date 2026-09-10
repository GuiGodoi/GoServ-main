using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories
{
    public class DiningTableRepository : IDiningTableRepository
    {
        private readonly ApplicationDbContext _db;

        public DiningTableRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public Task<List<DiningTable>> GetAllAsync() =>
            _db.DiningTables.OrderBy(t => t.Label).ToListAsync();

        public Task<DiningTable?> GetByIdAsync(int id) =>
            _db.DiningTables.FirstOrDefaultAsync(t => t.Id == id);

        public async Task<DiningTable> AddAsync(DiningTable table)
        {
            _db.DiningTables.Add(table);
            await _db.SaveChangesAsync();
            return table;
        }

        public Task<TableSession?> GetOpenSessionByTableIdAsync(int tableId)
        {
            var now = DateTime.UtcNow;
            return _db.TableSessions
                .Include(s => s.DiningTable)
                .Where(s => s.DiningTableId == tableId && s.ClosedAt == null && s.ExpiresAt > now)
                .OrderByDescending(s => s.OpenedAt)
                .FirstOrDefaultAsync();
        }

        public Task<TableSession?> GetSessionByTokenAsync(string token)
        {
            var now = DateTime.UtcNow;
            return _db.TableSessions
                .Include(s => s.DiningTable)
                .FirstOrDefaultAsync(s =>
                    s.AccessToken == token &&
                    s.ClosedAt == null &&
                    s.ExpiresAt > now);
        }

        public async Task<TableSession> AddSessionAsync(TableSession session)
        {
            _db.TableSessions.Add(session);
            await _db.SaveChangesAsync();
            return session;
        }

        public async Task UpdateSessionAsync(TableSession session)
        {
            _db.TableSessions.Update(session);
            await _db.SaveChangesAsync();
        }

        public async Task CloseOpenSessionsAsync(int tableId)
        {
            var now = DateTime.UtcNow;
            var open = await _db.TableSessions
                .Where(s => s.DiningTableId == tableId && s.ClosedAt == null)
                .ToListAsync();

            foreach (var session in open)
                session.ClosedAt = now;

            if (open.Count > 0)
                await _db.SaveChangesAsync();
        }
    }
}
