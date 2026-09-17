namespace Backend.Models
{
    /// <summary>
    /// Uma "sessão" de uso da mesa: começa quando o cliente digita a senha do dia
    /// e libera a mesa, e termina quando expira ou é fechada manualmente.
    /// Os pedidos feitos nesse período ficam ligados a essa sessão.
    /// </summary>
    public class TableSession
    {
        public int Id { get; set; }
        public int DiningTableId { get; set; }
        public DiningTable? DiningTable { get; set; }
        /// <summary>Token único guardado no navegador do cliente para identificar a sessão nas próximas chamadas.</summary>
        public string AccessToken { get; set; } = string.Empty;
        public DateTime OpenedAt { get; set; }
        /// <summary>A partir desse instante a sessão é considerada encerrada automaticamente.</summary>
        public DateTime ExpiresAt { get; set; }
        /// <summary>Preenchido quando a sessão é encerrada manualmente antes de expirar.</summary>
        public DateTime? ClosedAt { get; set; }
        /// <summary>Nome informado pelo cliente ao liberar a mesa com a senha do dia.</summary>
        public string? GuestName { get; set; }
        /// <summary>Teto de gastos da sessão (null = usa o padrão da configuração).</summary>
        public decimal? SpendingCap { get; set; }
        public bool IsOpen => ClosedAt is null && DateTime.UtcNow < ExpiresAt;
    }
}
