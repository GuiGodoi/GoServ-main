namespace Backend.Models
{
    /// <summary>
    /// Um item dentro de um pedido (um produto + quantidade). Nome e preço são
    /// copiados do MenuItem no momento da compra, para o pedido não mudar
    /// retroativamente se o cardápio for atualizado depois.
    /// </summary>
    public class OrderItem
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public Order? Order { get; set; }
        public int MenuItemId { get; set; }
        public string MenuItemName { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public string? Notes { get; set; }
        /// <summary>Preço unitário x quantidade + adicionais (calculado ao criar o pedido).</summary>
        public decimal LineTotal { get; set; }
        public ICollection<OrderItemAddon> Addons { get; set; } = new List<OrderItemAddon>();
    }
}
