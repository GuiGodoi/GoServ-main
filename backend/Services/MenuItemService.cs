using Backend.Data;
using Backend.Dtos;
using Backend.Models;
using Backend.Repositories;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp;

namespace Backend.Services
{
    public class MenuItemService : IMenuItemService
    {
        private readonly IMenuItemRepository _repository;
        private readonly ApplicationDbContext _db;
        private readonly IPromotionService _promotions;

        public MenuItemService(
            IMenuItemRepository repository,
            ApplicationDbContext db,
            IPromotionService promotions)
        {
            _repository = repository;
            _db = db;
            _promotions = promotions;
        }

        public async Task<List<MenuItemDto>> GetAllAsync(bool onlyAvailable = false)
        {
            var items = await _repository.GetAllAsync(onlyAvailable);
            var promos = await _promotions.GetLiveByMenuItemIdsAsync(items.Select(i => i.Id));
            return items.Select(i => ToDto(i, promos.GetValueOrDefault(i.Id))).ToList();
        }

        public async Task<MenuItemDto?> GetByIdAsync(int id)
        {
            var item = await _repository.GetByIdAsync(id);
            if (item is null) return null;
            var promos = await _promotions.GetLiveByMenuItemIdsAsync([id]);
            return ToDto(item, promos.GetValueOrDefault(id));
        }

        public async Task<MenuItemDto> CreateAsync(CreateMenuItemDto dto)
        {
            Validate(dto.Name, dto.Price);

            if (dto.CategoryId.HasValue && !await _repository.CategoryExistsAsync(dto.CategoryId.Value))
                throw new ArgumentException("Categoria informada não existe.");

            var item = new MenuItem
            {
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                Price = dto.Price,
                CategoryId = dto.CategoryId,
                Available = dto.Available
            };

            await _repository.AddAsync(item);
            return (await GetByIdAsync(item.Id))!;
        }

        public async Task<MenuItemDto?> UpdateAsync(int id, UpdateMenuItemDto dto)
        {
            var tracked = await _db.MenuItems.FirstOrDefaultAsync(m => m.Id == id);
            if (tracked is null) return null;

            Validate(dto.Name, dto.Price);

            if (dto.CategoryId.HasValue && !await _repository.CategoryExistsAsync(dto.CategoryId.Value))
                throw new ArgumentException("Categoria informada não existe.");

            tracked.Name = dto.Name.Trim();
            tracked.Description = dto.Description?.Trim();
            tracked.Price = dto.Price;
            tracked.CategoryId = dto.CategoryId;
            tracked.Available = dto.Available;

            await _db.SaveChangesAsync();
            return await GetByIdAsync(id);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var item = await _repository.GetByIdAsync(id);
            if (item is null) return false;

            await _repository.DeleteAsync(item);
            return true;
        }

        public async Task<(byte[] Data, string ContentType)?> GetPhotoAsync(int id)
        {
            var item = await _repository.GetPhotoAsync(id);
            if (item?.PhotoData is null || item.PhotoData.Length == 0)
                return null;

            return (item.PhotoData, item.PhotoContentType ?? "image/jpeg");
        }

        public async Task<MenuItemDto?> SetPhotoAsync(
            int id,
            Stream photoStream,
            long contentLength,
            string? contentType,
            string? fileName)
        {
            ImageConverter.ValidateUpload(contentLength, contentType, fileName);

            var tracked = await _db.MenuItems.FirstOrDefaultAsync(m => m.Id == id);
            if (tracked is null) return null;

            try
            {
                var (data, storedType) = ImageConverter.ToStoredJpeg(photoStream);
                tracked.PhotoData = data;
                tracked.PhotoContentType = storedType;
            }
            catch (UnknownImageFormatException)
            {
                throw new ArgumentException("Formato de imagem não suportado.");
            }
            catch (Exception)
            {
                throw new ArgumentException("Não foi possível processar a imagem.");
            }

            await _db.SaveChangesAsync();
            return await GetByIdAsync(id);
        }

        public async Task<bool> ClearPhotoAsync(int id)
        {
            var tracked = await _db.MenuItems.FirstOrDefaultAsync(m => m.Id == id);
            if (tracked is null) return false;

            tracked.PhotoData = null;
            tracked.PhotoContentType = null;
            await _db.SaveChangesAsync();
            return true;
        }

        private static void Validate(string name, decimal price)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("O nome do produto é obrigatório.");
            if (price < 0)
                throw new ArgumentException("O preço não pode ser negativo.");
        }

        private static MenuItemDto ToDto(MenuItem item, Promotion? promo)
        {
            var hasPhoto = !string.IsNullOrEmpty(item.PhotoContentType);
            var onPromo = promo is not null;
            var effective = onPromo ? promo!.PromoPrice : item.Price;

            return new MenuItemDto
            {
                Id = item.Id,
                Name = item.Name,
                Description = item.Description,
                Price = effective,
                OriginalPrice = onPromo ? item.Price : null,
                PromoPrice = onPromo ? promo!.PromoPrice : null,
                DiscountPercent = onPromo
                    ? PromotionService.CalcDiscountPercent(item.Price, promo!.PromoPrice)
                    : null,
                IsOnPromo = onPromo,
                HasPhoto = hasPhoto,
                PhotoUrl = hasPhoto ? $"/api/menuitems/{item.Id}/photo" : null,
                CategoryId = item.CategoryId,
                CategoryName = item.Category?.Name,
                Available = item.Available
            };
        }
    }
}
