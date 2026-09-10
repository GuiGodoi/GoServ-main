using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories
{
    public class AuditLogRepository : IAuditLogRepository
    {
        private readonly ApplicationDbContext _db;

        public AuditLogRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task AddAsync(AuditLog entry)
        {
            _db.AuditLogs.Add(entry);
            await _db.SaveChangesAsync();
        }

        public Task<List<AuditLog>> GetRecentAsync(int take = 100) =>
            _db.AuditLogs
                .OrderByDescending(a => a.CreatedAt)
                .Take(take)
                .ToListAsync();
    }
}
