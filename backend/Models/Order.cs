namespace Backend.Models
{
    /// <summary>Um pedido feito por um cliente em uma mesa.</summary>
    public class Order
    {
        public int Id { get; set; }
        /// <summary>Identificador público (UUID) para o cliente acompanhar o pedido.</summary>
        public Guid PublicId { get; set; }
        public int? TableSessionId { get; set; }
        public TableSession? TableSession { get; set; }
        /// <summary>Nome da mesa no momento do pedido (guardado aqui para não sumir se a mesa mudar depois).</summary>
        public string? TableLabel { get; set; }
        /// <summary>Um dos valores de <see cref="OrderStatuses"/> (ex: Received, Preparing, Ready...).</summary>
        public string Status { get; set; } = OrderStatuses.Received;
        public string? CustomerNotes { get; set; }
        public decimal Total { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    }
}
