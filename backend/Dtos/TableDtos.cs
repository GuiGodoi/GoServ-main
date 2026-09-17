// DTOs de mesas, sessões de mesa e QR codes.
namespace Backend.Dtos
{
    public class DiningTableDto
    {
        public int Id { get; set; }
        public string Label { get; set; } = string.Empty;
        public bool Active { get; set; }
        /// <summary>Sessão em aberto nesta mesa agora, se houver.</summary>
        public TableSessionDto? ActiveSession { get; set; }
    }

    public class CreateDiningTableDto
    {
        public string Label { get; set; } = string.Empty;
    }

    /// <summary>Estado de uma sessão de mesa, incluindo quanto já foi gasto/pedido.</summary>
    public class TableSessionDto
    {
        public int Id { get; set; }
        public int DiningTableId { get; set; }
        public string TableLabel { get; set; } = string.Empty;
        public string AccessToken { get; set; } = string.Empty;
        public string? GuestName { get; set; }
        public DateTime OpenedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public bool IsOpen { get; set; }
        /// <summary>Caminho relativo para a página do cardápio já com o token da sessão.</summary>
        public string ClientPath { get; set; } = string.Empty;
        /// <summary>Caminho relativo para a página de "entrada" (digitar a senha do dia) desta mesa.</summary>
        public string GatePath { get; set; } = string.Empty;
        public decimal SpendingCap { get; set; }
        /// <summary>Total já gasto pela sessão até agora.</summary>
        public decimal Spent { get; set; }
        public int OrderCount { get; set; }
    }

    /// <summary>Usado pelo admin para abrir manualmente uma sessão numa mesa.</summary>
    public class OpenTableSessionDto
    {
        public int DurationMinutes { get; set; } = 120;
    }

    /// <summary>Usado pelo cliente para "entrar" na mesa digitando a senha do dia.</summary>
    public class JoinTableDto
    {
        public string GuestName { get; set; } = string.Empty;
        public string DayPasscode { get; set; } = string.Empty;
        public int DurationMinutes { get; set; } = 120;
    }

    /// <summary>Usado pelo admin para aumentar o teto de gastos de uma sessão já aberta.</summary>
    public class RaiseSessionCapDto
    {
        public decimal SpendingCap { get; set; }
    }

    /// <summary>Dados para gerar a página/PDF com os QR codes de todas as mesas.</summary>
    public class QrCatalogDto
    {
        public string RestaurantName { get; set; } = string.Empty;
        public string ClientBaseUrl { get; set; } = string.Empty;
        public string MenuPath { get; set; } = "/cardapio";
        public string MenuUrl { get; set; } = string.Empty;
        public string DayPasscode { get; set; } = string.Empty;
        public string DayLabel { get; set; } = string.Empty;
        public List<QrTableLinkDto> Tables { get; set; } = [];
    }

    public class QrTableLinkDto
    {
        public int Id { get; set; }
        public string Label { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public bool Active { get; set; }
    }

    /// <summary>Dados públicos de uma mesa (sem informação sensível), exibidos antes do login na mesa.</summary>
    public class PublicTableDto
    {
        public int Id { get; set; }
        public string Label { get; set; } = string.Empty;
        public string RestaurantName { get; set; } = string.Empty;
    }
}
