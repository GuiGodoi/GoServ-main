namespace Backend.Models
{
    /// <summary>Uma mesa física do estabelecimento (a que o QR code aponta).</summary>
    public class DiningTable
    {
        public int Id { get; set; }
        /// <summary>Nome exibido para identificar a mesa (ex: "Mesa 5").</summary>
        public string Label { get; set; } = string.Empty;
        /// <summary>Se falso, a mesa está desativada e não pode abrir novas sessões.</summary>
        public bool Active { get; set; } = true;
        /// <summary>Histórico de sessões (uma sessão = um período em que a mesa ficou aberta para um cliente).</summary>
        public ICollection<TableSession>? Sessions { get; set; }
    }
}
