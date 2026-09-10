using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories
{
    public class MenuItemRepository : IMenuItemRepository
    {
        private readonly ApplicationDbContext _db;

        public MenuItemRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public Task<List<MenuItem>> GetAllAsync(bool onlyAvailable = false)
        {
            // Não carrega PhotoData (BLOB) na listagem
            var query = _db.MenuItems.AsNoTracking().AsQueryable();
            if (onlyAvailable)
                query = query.Where(m => m.Available);

            return query
                .OrderBy(m => m.Category != null ? m.Category!.SortOrder : int.MaxValue)
                .ThenBy(m => m.Name)
                .Select(m => new MenuItem
                {
                    Id = m.Id,
                    Name = m.Name,
                    Description = m.Description,
                    Price = m.Price,
                    CategoryId = m.CategoryId,
                    Available = m.Available,
                    PhotoContentType = m.PhotoData != null ? m.PhotoContentType : null,
                    Category = m.Category == null
                        ? null
                        : new Category
                        {
                            Id = m.Category.Id,
                            Name = m.Category.Name,
                            SortOrder = m.Category.SortOrder
                        }
                })
                .ToListAsync();
        }

        public Task<MenuItem?> GetByIdAsync(int id) =>
            _db.MenuItems.AsNoTracking()
                .Where(m => m.Id == id)
                .Select(m => new MenuItem
                {
                    Id = m.Id,
                    Name = m.Name,
                    Description = m.Description,
                    Price = m.Price,
                    CategoryId = m.CategoryId,
                    Available = m.Available,
                    PhotoContentType = m.PhotoData != null ? m.PhotoContentType : null,
                    Category = m.Category == null
                        ? null
                        : new Category
                        {
                            Id = m.Category.Id,
                            Name = m.Category.Name,
                            SortOrder = m.Category.SortOrder
                        }
                })
                .FirstOrDefaultAsync();

        public Task<MenuItem?> GetPhotoAsync(int id) =>
            _db.MenuItems.AsNoTracking()
                .Where(m => m.Id == id)
                .Select(m => new MenuItem
                {
                    Id = m.Id,
                    PhotoData = m.PhotoData,
                    PhotoContentType = m.PhotoContentType
                })
                .FirstOrDefaultAsync();

        public async Task<MenuItem> AddAsync(MenuItem item)
        {
            _db.MenuItems.Add(item);
            await _db.SaveChangesAsync();
            return item;
        }

        public async Task UpdateAsync(MenuItem item)
        {
            _db.MenuItems.Update(item);
            await _db.SaveChangesAsync();
        }

        public async Task DeleteAsync(MenuItem item)
        {
            var tracked = await _db.MenuItems.FirstOrDefaultAsync(m => m.Id == item.Id);
            if (tracked is null) return;
            _db.MenuItems.Remove(tracked);
            await _db.SaveChangesAsync();
        }

        public Task<bool> CategoryExistsAsync(int categoryId) =>
            _db.Categories.AnyAsync(c => c.Id == categoryId);
    }
}
