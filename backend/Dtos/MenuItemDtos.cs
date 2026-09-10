namespace Backend.Dtos
{
    public class MenuItemDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        /// <summary>Preço de tabela (antes da promoção), se houver promo ativa.</summary>
        public decimal? OriginalPrice { get; set; }
        public decimal? PromoPrice { get; set; }
        public int? DiscountPercent { get; set; }
        public bool IsOnPromo { get; set; }
        /// <summary>URL relativa para baixar a foto convertida do banco.</summary>
        public string? PhotoUrl { get; set; }
        public bool HasPhoto { get; set; }
        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public bool Available { get; set; }
    }

    public class CreateMenuItemDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int? CategoryId { get; set; }
        public bool Available { get; set; } = true;
    }

    public class UpdateMenuItemDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int? CategoryId { get; set; }
        public bool Available { get; set; }
    }
}
