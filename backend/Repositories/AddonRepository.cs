using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories
{
    public class AddonRepository : IAddonRepository
    {
        private readonly ApplicationDbContext _db;

        public AddonRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public Task<List<Addon>> GetByMenuItemIdAsync(int menuItemId, bool onlyAvailable = true)
        {
            var query = _db.Addons.Where(a => a.MenuItemId == menuItemId);
            if (onlyAvailable)
                query = query.Where(a => a.Available);
            return query.OrderBy(a => a.Name).ToListAsync();
        }

        public Task<List<Addon>> GetByMenuItemIdsAsync(IEnumerable<int> menuItemIds, bool onlyAvailable = true)
        {
            var ids = menuItemIds.Distinct().ToList();
            var query = _db.Addons.Where(a => ids.Contains(a.MenuItemId));
            if (onlyAvailable)
                query = query.Where(a => a.Available);
            return query.ToListAsync();
        }
    }
}
