namespace Backend.Models
{
    /// <summary>Um adicional escolhido dentro de um item do pedido (nome/preço copiados do Addon original).</summary>
    public class OrderItemAddon
    {
        public int Id { get; set; }
        public int OrderItemId { get; set; }
        public OrderItem? OrderItem { get; set; }
        public int AddonId { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
    }
}
