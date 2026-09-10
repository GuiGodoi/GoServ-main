namespace Backend.Models
{
    public class TableSession
    {
        public int Id { get; set; }
        public int DiningTableId { get; set; }
        public DiningTable? DiningTable { get; set; }
        public string AccessToken { get; set; } = string.Empty;
        public DateTime OpenedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public DateTime? ClosedAt { get; set; }
        /// <summary>Nome informado pelo cliente ao liberar a mesa com a senha do dia.</summary>
        public string? GuestName { get; set; }
        /// <summary>Teto de gastos da sessão (null = usa o padrão da configuração).</summary>
        public decimal? SpendingCap { get; set; }
        public bool IsOpen => ClosedAt is null && DateTime.UtcNow < ExpiresAt;
    }
}
