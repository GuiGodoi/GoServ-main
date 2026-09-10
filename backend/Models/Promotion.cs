namespace Backend.Models
{
    /// <summary>Promoção temporária sobre um produto já cadastrado.</summary>
    public class Promotion
    {
        public int Id { get; set; }
        public int MenuItemId { get; set; }
        public MenuItem? MenuItem { get; set; }
        public decimal PromoPrice { get; set; }
        public DateTime StartsAt { get; set; }
        public DateTime EndsAt { get; set; }
        public bool Active { get; set; } = true;

        public bool IsLive(DateTime utcNow) =>
            Active && utcNow >= StartsAt && utcNow < EndsAt;
    }
}
