// DTOs das categorias do cardápio (só transportam dados, sem regra de negócio).
namespace Backend.Dtos
{
    /// <summary>Categoria devolvida pela API para o front-end.</summary>
    public class CategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int SortOrder { get; set; }
    }

    /// <summary>Dados enviados para criar uma categoria nova.</summary>
    public class CreateCategoryDto
    {
        public string Name { get; set; } = string.Empty;
        public int SortOrder { get; set; }
    }

    /// <summary>Dados enviados para editar uma categoria existente.</summary>
    public class UpdateCategoryDto
    {
        public string Name { get; set; } = string.Empty;
        public int SortOrder { get; set; }
    }
}
