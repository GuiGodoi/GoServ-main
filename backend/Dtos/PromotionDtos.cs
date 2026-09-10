namespace Backend.Dtos
{
    public class PromotionDto
    {
        public int Id { get; set; }
        public int MenuItemId { get; set; }
        public string MenuItemName { get; set; } = string.Empty;
        public decimal ListPrice { get; set; }
        public decimal PromoPrice { get; set; }
        public int DiscountPercent { get; set; }
        public DateTime StartsAt { get; set; }
        public DateTime EndsAt { get; set; }
        public bool Active { get; set; }
        public bool IsLive { get; set; }
    }

    public class CreatePromotionDto
    {
        public int MenuItemId { get; set; }
        public decimal PromoPrice { get; set; }
        public DateTime StartsAt { get; set; }
        public DateTime EndsAt { get; set; }
        public bool Active { get; set; } = true;
    }

    public class UpdatePromotionDto
    {
        public decimal PromoPrice { get; set; }
        public DateTime StartsAt { get; set; }
        public DateTime EndsAt { get; set; }
        public bool Active { get; set; }
    }
}
