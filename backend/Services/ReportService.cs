using Backend.Dtos;
using Backend.Repositories;

namespace Backend.Services
{
    public interface IReportService
    {
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
