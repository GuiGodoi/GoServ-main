namespace Backend.Models
{
    /// <summary>Categoria do cardápio (ex: "Lanches", "Bebidas", "Sobremesas").</summary>
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        /// <summary>Define a ordem de exibição das categorias no cardápio (menor = primeiro).</summary>
        public int SortOrder { get; set; }
        public ICollection<MenuItem>? MenuItems { get; set; }
    }
}
