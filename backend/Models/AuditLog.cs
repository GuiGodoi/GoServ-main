namespace Backend.Models
{
    /// <summary>
    /// Registro de auditoria: guarda "quem mudou o quê" no sistema (ex: um admin
    /// alterou o preço de um produto, ou o status de um pedido mudou).
    /// </summary>
    public class AuditLog
    {
        public int Id { get; set; }
        /// <summary>Tipo da entidade alterada (ex: "MenuItem", "Order").</summary>
        public string EntityType { get; set; } = string.Empty;
        /// <summary>Id da entidade alterada, como texto.</summary>
        public string EntityId { get; set; } = string.Empty;
        /// <summary>Ação realizada (ex: "Create", "Update", "Delete").</summary>
        public string Action { get; set; } = string.Empty;
        /// <summary>Valor anterior (antes da mudança), quando aplicável.</summary>
        public string? FromValue { get; set; }
        /// <summary>Valor novo (depois da mudança), quando aplicável.</summary>
        public string? ToValue { get; set; }
        /// <summary>Id do usuário que fez a ação (null se foi o sistema/anônimo).</summary>
        public string? ActorUserId { get; set; }
        public string? ActorName { get; set; }
        public string? IpAddress { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
