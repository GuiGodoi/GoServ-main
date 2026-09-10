namespace Backend.Dtos
{
    public class AddonDto
    {
        public int Id { get; set; }
        public int MenuItemId { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public bool Available { get; set; }
    }

    public class CreateOrderItemAddonDto
    {
        public int AddonId { get; set; }
    }

    public class CreateOrderItemDto
    {
        public int MenuItemId { get; set; }
        public int Quantity { get; set; } = 1;
        public string? Notes { get; set; }
        public List<CreateOrderItemAddonDto> Addons { get; set; } = [];
        /// <summary>Ignorado pelo servidor (RNF06).</summary>
        public decimal? ClientUnitPrice { get; set; }
    }

    public class CreateOrderDto
    {
        public string? AccessToken { get; set; }
        public string? CustomerNotes { get; set; }
        public List<CreateOrderItemDto> Items { get; set; } = [];
    }

    public class OrderItemAddonDto
    {
        public int AddonId { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
    }

    public class OrderItemDto
    {
        public int Id { get; set; }
        public int MenuItemId { get; set; }
        public string MenuItemName { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public string? Notes { get; set; }
        public decimal LineTotal { get; set; }
        public List<OrderItemAddonDto> Addons { get; set; } = [];
    }

    public class OrderDto
    {
        public int Id { get; set; }
        public Guid PublicId { get; set; }
        public string? TableLabel { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? CustomerNotes { get; set; }
        public decimal Total { get; set; }
        public DateTime CreatedAt { get; set; }
        /// <summary>Código Pix copia-e-cola (simulado até Mercado Pago).</summary>
        public string? PixCopyPaste { get; set; }
        public DateTime? PaymentExpiresAt { get; set; }
        public List<OrderItemDto> Items { get; set; } = [];
    }

    public class UpdateOrderStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }

    public class AuditLogDto
    {
        public int Id { get; set; }
        public string EntityType { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string? FromValue { get; set; }
        public string? ToValue { get; set; }
        public string? ActorName { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
