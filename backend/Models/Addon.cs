namespace Backend.Models
{
    /// <summary>Adicional vinculado a um produto do cardápio.</summary>
    public class Addon
    {
        public int Id { get; set; }
        public int MenuItemId { get; set; }
        public MenuItem? MenuItem { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public bool Available { get; set; } = true;
    }
}
