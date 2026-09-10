namespace Backend.Dtos
{
    public class DiningTableDto
    {
        public int Id { get; set; }
        public string Label { get; set; } = string.Empty;
        public bool Active { get; set; }
        public TableSessionDto? ActiveSession { get; set; }
    }

    public class CreateDiningTableDto
    {
        public string Label { get; set; } = string.Empty;
    }

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
        public string ClientPath { get; set; } = string.Empty;
        public string GatePath { get; set; } = string.Empty;
        public decimal SpendingCap { get; set; }
        public decimal Spent { get; set; }
        public int OrderCount { get; set; }
    }

    public class OpenTableSessionDto
    {
        public int DurationMinutes { get; set; } = 120;
    }

    public class JoinTableDto
    {
        public string GuestName { get; set; } = string.Empty;
        public string DayPasscode { get; set; } = string.Empty;
        public int DurationMinutes { get; set; } = 120;
    }

    public class RaiseSessionCapDto
    {
        public decimal SpendingCap { get; set; }
    }

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

    public class PublicTableDto
    {
        public int Id { get; set; }
        public string Label { get; set; } = string.Empty;
        public string RestaurantName { get; set; } = string.Empty;
    }
}
