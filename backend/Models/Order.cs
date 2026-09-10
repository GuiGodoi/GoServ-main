namespace Backend.Models
{
    public class Order
    {
        public int Id { get; set; }
        /// <summary>Identificador público (UUID) para o cliente acompanhar o pedido.</summary>
        public Guid PublicId { get; set; }
        public int? TableSessionId { get; set; }
        public TableSession? TableSession { get; set; }
        public string? TableLabel { get; set; }
        public string Status { get; set; } = OrderStatuses.Received;
        public string? CustomerNotes { get; set; }
        public decimal Total { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    }
}
