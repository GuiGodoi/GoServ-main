using Backend.Dtos;
using Backend.Models;
using Backend.Repositories;

namespace Backend.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepository _repository;

        public CategoryService(ICategoryRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<CategoryDto>> GetAllAsync()
        {
            var categories = await _repository.GetAllAsync();
            return categories.Select(ToDto).ToList();
        }

        public async Task<CategoryDto?> GetByIdAsync(int id)
        {
            var category = await _repository.GetByIdAsync(id);
            return category is null ? null : ToDto(category);
        }

        public async Task<CategoryDto> CreateAsync(CreateCategoryDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                throw new ArgumentException("O nome da categoria é obrigatório.");

            var category = new Category
            {
                Name = dto.Name.Trim(),
                SortOrder = dto.SortOrder
            };

            await _repository.AddAsync(category);
            return ToDto(category);
        }

        public async Task<CategoryDto?> UpdateAsync(int id, UpdateCategoryDto dto)
        {
            var category = await _repository.GetByIdAsync(id);
            if (category is null) return null;

            if (string.IsNullOrWhiteSpace(dto.Name))
                throw new ArgumentException("O nome da categoria é obrigatório.");

            category.Name = dto.Name.Trim();
            category.SortOrder = dto.SortOrder;
            await _repository.UpdateAsync(category);
            return ToDto(category);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var category = await _repository.GetByIdAsync(id);
            if (category is null) return false;

            await _repository.DeleteAsync(category);
            return true;
        }

        private static CategoryDto ToDto(Category category) => new()
        {
            Id = category.Id,
            Name = category.Name,
            SortOrder = category.SortOrder
        };
    }
}
