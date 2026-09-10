namespace Backend.Dtos
{
    public class DailyReportDto
    {
        public DateOnly Date { get; set; }
        public int OrdersCount { get; set; }
        public decimal TotalSales { get; set; }
        public decimal AverageTicket { get; set; }
        public List<TopItemDto> TopItems { get; set; } = [];
        public List<OrdersByStatusDto> ByStatus { get; set; } = [];
    }

    public class TopItemDto
    {
        public int MenuItemId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int QuantitySold { get; set; }
        public decimal Revenue { get; set; }
    }

    public class OrdersByStatusDto
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
