namespace Backend.Models
{
    public class MenuItem
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        /// <summary>JPEG convertido (max ~800px) armazenado no banco.</summary>
        public byte[]? PhotoData { get; set; }
        public string? PhotoContentType { get; set; }
        public int? CategoryId { get; set; }
        public Category? Category { get; set; }
        public bool Available { get; set; } = true;
    }
}
