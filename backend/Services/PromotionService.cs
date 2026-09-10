using Backend.Data;
using Backend.Dtos;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public interface IPromotionService
    {
        Task<List<PromotionDto>> GetAllAsync(bool liveOnly = false);
        Task<PromotionDto?> GetByIdAsync(int id);
        Task<PromotionDto> CreateAsync(CreatePromotionDto dto);
        Task<PromotionDto?> UpdateAsync(int id, UpdatePromotionDto dto);
        Task<bool> DeleteAsync(int id);
        Task<Dictionary<int, Promotion>> GetLiveByMenuItemIdsAsync(IEnumerable<int> menuItemIds);
    }

    public class PromotionService : IPromotionService
    {
        private readonly ApplicationDbContext _db;

        public PromotionService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<List<PromotionDto>> GetAllAsync(bool liveOnly = false)
        {
            var now = DateTime.UtcNow;
            var query = _db.Promotions
                .AsNoTracking()
                .Include(p => p.MenuItem)
                .AsQueryable();

            if (liveOnly)
            {
                query = query.Where(p =>
                    p.Active && p.StartsAt <= now && p.EndsAt > now);
            }

            var list = await query.OrderByDescending(p => p.StartsAt).ToListAsync();
            return list.Select(p => ToDto(p, now)).ToList();
        }

        public async Task<PromotionDto?> GetByIdAsync(int id)
        {
            var p = await _db.Promotions
                .AsNoTracking()
                .Include(x => x.MenuItem)
                .FirstOrDefaultAsync(x => x.Id == id);
            return p is null ? null : ToDto(p, DateTime.UtcNow);
        }

        public async Task<PromotionDto> CreateAsync(CreatePromotionDto dto)
        {
            Validate(dto.PromoPrice, dto.StartsAt, dto.EndsAt);

            var item = await _db.MenuItems.FirstOrDefaultAsync(m => m.Id == dto.MenuItemId);
            if (item is null)
                throw new ArgumentException("Produto não encontrado.");
            if (dto.PromoPrice >= item.Price)
                throw new ArgumentException("O preço promocional deve ser menor que o preço normal.");

            var promo = new Promotion
            {
                MenuItemId = dto.MenuItemId,
                PromoPrice = Math.Round(dto.PromoPrice, 2, MidpointRounding.AwayFromZero),
                StartsAt = EnsureUtc(dto.StartsAt),
                EndsAt = EnsureUtc(dto.EndsAt),
                Active = dto.Active
            };

            _db.Promotions.Add(promo);
            await _db.SaveChangesAsync();

            promo.MenuItem = item;
            return ToDto(promo, DateTime.UtcNow);
        }

        public async Task<PromotionDto?> UpdateAsync(int id, UpdatePromotionDto dto)
        {
            Validate(dto.PromoPrice, dto.StartsAt, dto.EndsAt);

            var promo = await _db.Promotions
                .Include(p => p.MenuItem)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (promo is null) return null;

            if (promo.MenuItem is null)
                throw new ArgumentException("Produto da promoção não encontrado.");
            if (dto.PromoPrice >= promo.MenuItem.Price)
                throw new ArgumentException("O preço promocional deve ser menor que o preço normal.");

            promo.PromoPrice = Math.Round(dto.PromoPrice, 2, MidpointRounding.AwayFromZero);
            promo.StartsAt = EnsureUtc(dto.StartsAt);
            promo.EndsAt = EnsureUtc(dto.EndsAt);
            promo.Active = dto.Active;

            await _db.SaveChangesAsync();
            return ToDto(promo, DateTime.UtcNow);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var promo = await _db.Promotions.FirstOrDefaultAsync(p => p.Id == id);
            if (promo is null) return false;
            _db.Promotions.Remove(promo);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<Dictionary<int, Promotion>> GetLiveByMenuItemIdsAsync(IEnumerable<int> menuItemIds)
        {
            var ids = menuItemIds.Distinct().ToList();
            if (ids.Count == 0) return new Dictionary<int, Promotion>();

            var now = DateTime.UtcNow;
            var list = await _db.Promotions
                .AsNoTracking()
                .Where(p =>
                    ids.Contains(p.MenuItemId) &&
                    p.Active &&
                    p.StartsAt <= now &&
                    p.EndsAt > now)
                .OrderBy(p => p.PromoPrice)
                .ToListAsync();

            // Uma promo viva por produto (a mais barata)
            return list
                .GroupBy(p => p.MenuItemId)
                .ToDictionary(g => g.Key, g => g.First());
        }

        private static void Validate(decimal promoPrice, DateTime startsAt, DateTime endsAt)
        {
            if (promoPrice < 0)
                throw new ArgumentException("O preço promocional não pode ser negativo.");
            if (endsAt <= startsAt)
                throw new ArgumentException("A data final deve ser depois da data inicial.");
        }

        private static DateTime EnsureUtc(DateTime value) =>
            value.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
                : value.ToUniversalTime();

        public static int CalcDiscountPercent(decimal listPrice, decimal promoPrice)
        {
            if (listPrice <= 0) return 0;
            var pct = (1m - promoPrice / listPrice) * 100m;
            return (int)Math.Round(pct, MidpointRounding.AwayFromZero);
        }

        private static PromotionDto ToDto(Promotion p, DateTime now)
        {
            var list = p.MenuItem?.Price ?? 0m;
            return new PromotionDto
            {
                Id = p.Id,
                MenuItemId = p.MenuItemId,
                MenuItemName = p.MenuItem?.Name ?? string.Empty,
                ListPrice = list,
                PromoPrice = p.PromoPrice,
                DiscountPercent = CalcDiscountPercent(list, p.PromoPrice),
                StartsAt = p.StartsAt,
                EndsAt = p.EndsAt,
                Active = p.Active,
                IsLive = p.IsLive(now)
            };
        }
    }
}
