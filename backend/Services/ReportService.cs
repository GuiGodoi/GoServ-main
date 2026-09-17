using Backend.Dtos;
using Backend.Repositories;

namespace Backend.Services
{
    /// <summary>Monta o relatório do dia (vendas, ticket médio, mais vendidos).</summary>
    public interface IReportService
    {
        /// <summary>Se a data não for informada, usa o dia atual.</summary>
        Task<DailyReportDto> GetDailyReportAsync(DateOnly? date);
    }

    public class ReportService : IReportService
    {
        private readonly IReportRepository _reports;

        public ReportService(IReportRepository reports)
        {
            _reports = reports;
        }

        public Task<DailyReportDto> GetDailyReportAsync(DateOnly? date)
        {
            // Usa UTC; em produção pode mapear fuso do estabelecimento
            var target = date ?? DateOnly.FromDateTime(DateTime.UtcNow);
            return _reports.GetDailyReportAsync(target);
        }
    }
}
