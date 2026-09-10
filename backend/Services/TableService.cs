using System.Security.Cryptography;
using Backend.Dtos;
using Backend.Models;
using Backend.Options;
using Backend.Repositories;
using Microsoft.Extensions.Options;

namespace Backend.Services
{
    public interface ITableService
    {
        Task<List<DiningTableDto>> GetTablesAsync();
        Task<DiningTableDto> CreateTableAsync(CreateDiningTableDto dto);
        Task<TableSessionDto> OpenSessionAsync(int tableId, OpenTableSessionDto dto);
        Task<TableSessionDto> JoinTableAsync(int tableId, JoinTableDto dto);
        Task<PublicTableDto?> GetPublicTableAsync(int tableId);
        Task<bool> CloseSessionAsync(int tableId);
        Task<TableSessionDto?> ValidateTokenAsync(string accessToken);
        Task<TableSessionDto?> RaiseSessionCapAsync(int tableId, decimal spendingCap);
        Task<QrCatalogDto> GetQrCatalogAsync();
    }

    public class TableService : ITableService
    {
        private readonly IDiningTableRepository _repository;
        private readonly IOrderRepository _orders;
        private readonly IDayPasscodeService _dayPasscodes;
        private readonly SecurityOptions _security;
        private readonly RestaurantOptions _restaurant;

        public TableService(
            IDiningTableRepository repository,
            IOrderRepository orders,
            IDayPasscodeService dayPasscodes,
            IOptions<SecurityOptions> security,
            IOptions<RestaurantOptions> restaurant)
        {
            _repository = repository;
            _orders = orders;
            _dayPasscodes = dayPasscodes;
            _security = security.Value;
            _restaurant = restaurant.Value;
        }

        public async Task<List<DiningTableDto>> GetTablesAsync()
        {
            var tables = await _repository.GetAllAsync();
            var result = new List<DiningTableDto>();

            foreach (var table in tables)
            {
                var session = await _repository.GetOpenSessionByTableIdAsync(table.Id);
                result.Add(await ToTableDtoAsync(table, session));
            }

            return result;
        }

        public async Task<DiningTableDto> CreateTableAsync(CreateDiningTableDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Label))
                throw new ArgumentException("O identificador da mesa é obrigatório.");

            var table = new DiningTable
            {
                Label = dto.Label.Trim(),
                Active = true
            };

            await _repository.AddAsync(table);
            return await ToTableDtoAsync(table, null);
        }

        public async Task<PublicTableDto?> GetPublicTableAsync(int tableId)
        {
            var table = await _repository.GetByIdAsync(tableId);
            if (table is null || !table.Active) return null;
            return new PublicTableDto
            {
                Id = table.Id,
                Label = table.Label,
                RestaurantName = _restaurant.Name
            };
        }

        public async Task<TableSessionDto> OpenSessionAsync(int tableId, OpenTableSessionDto dto)
        {
            var table = await _repository.GetByIdAsync(tableId);
            if (table is null || !table.Active)
                throw new ArgumentException("Mesa não encontrada ou inativa.");

            var minutes = dto.DurationMinutes <= 0 ? 120 : Math.Min(dto.DurationMinutes, 24 * 60);
            await _repository.CloseOpenSessionsAsync(tableId);

            var now = DateTime.UtcNow;
            var session = new TableSession
            {
                DiningTableId = tableId,
                DiningTable = table,
                AccessToken = GenerateToken(),
                OpenedAt = now,
                ExpiresAt = now.AddMinutes(minutes),
                SpendingCap = _security.MaxSpendPerSession
            };

            await _repository.AddSessionAsync(session);
            return await ToSessionDtoAsync(session);
        }

        public async Task<TableSessionDto> JoinTableAsync(int tableId, JoinTableDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.GuestName))
                throw new ArgumentException("Informe o seu nome.");
            if (dto.GuestName.Trim().Length > 80)
                throw new ArgumentException("Nome muito longo.");

            if (!await _dayPasscodes.ValidateAsync(dto.DayPasscode))
                throw new ArgumentException("Senha do dia inválida. Peça aos funcionários.");

            var table = await _repository.GetByIdAsync(tableId);
            if (table is null || !table.Active)
                throw new ArgumentException("Mesa não encontrada ou inativa.");

            var minutes = dto.DurationMinutes <= 0 ? 120 : Math.Min(dto.DurationMinutes, 24 * 60);
            var guest = dto.GuestName.Trim();

            var open = await _repository.GetOpenSessionByTableIdAsync(tableId);
            if (open is not null)
            {
                open.GuestName = guest;
                open.DiningTable ??= table;
                // Renova expiração a cada entrada válida
                open.ExpiresAt = DateTime.UtcNow.AddMinutes(minutes);
                await _repository.UpdateSessionAsync(open);
                return await ToSessionDtoAsync(open);
            }

            var now = DateTime.UtcNow;
            var session = new TableSession
            {
                DiningTableId = tableId,
                DiningTable = table,
                AccessToken = GenerateToken(),
                GuestName = guest,
                OpenedAt = now,
                ExpiresAt = now.AddMinutes(minutes),
                SpendingCap = _security.MaxSpendPerSession
            };

            await _repository.AddSessionAsync(session);
            return await ToSessionDtoAsync(session);
        }

        public async Task<bool> CloseSessionAsync(int tableId)
        {
            var table = await _repository.GetByIdAsync(tableId);
            if (table is null) return false;

            await _repository.CloseOpenSessionsAsync(tableId);
            return true;
        }

        public async Task<TableSessionDto?> ValidateTokenAsync(string accessToken)
        {
            if (string.IsNullOrWhiteSpace(accessToken))
                return null;

            var session = await _repository.GetSessionByTokenAsync(accessToken.Trim());
            return session is null ? null : await ToSessionDtoAsync(session);
        }

        public async Task<TableSessionDto?> RaiseSessionCapAsync(int tableId, decimal spendingCap)
        {
            if (spendingCap < 0)
                throw new ArgumentException("O teto de gastos não pode ser negativo.");

            var session = await _repository.GetOpenSessionByTableIdAsync(tableId);
            if (session is null)
                throw new ArgumentException("Não há sessão aberta nesta mesa.");

            session.SpendingCap = spendingCap;
            await _repository.UpdateSessionAsync(session);
            return await ToSessionDtoAsync(session);
        }

        public async Task<QrCatalogDto> GetQrCatalogAsync()
        {
            var day = await _dayPasscodes.GetOrCreateTodayAsync();
            var baseUrl = _restaurant.ClientPublicUrl.TrimEnd('/');
            var tables = await _repository.GetAllAsync();

            return new QrCatalogDto
            {
                RestaurantName = _restaurant.Name,
                ClientBaseUrl = baseUrl,
                MenuPath = "/cardapio",
                MenuUrl = $"{baseUrl}/cardapio",
                DayPasscode = day.Code,
                DayLabel = day.Day.ToString("dd/MM/yyyy"),
                Tables = tables
                    .Where(t => t.Active)
                    .OrderBy(t => t.Label)
                    .Select(t => new QrTableLinkDto
                    {
                        Id = t.Id,
                        Label = t.Label,
                        Path = $"/m/{t.Id}",
                        Url = $"{baseUrl}/m/{t.Id}",
                        Active = t.Active
                    })
                    .ToList()
            };
        }

        private static string GenerateToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(24);
            return Convert.ToBase64String(bytes)
                .TrimEnd('=')
                .Replace('+', '-')
                .Replace('/', '_');
        }

        private async Task<DiningTableDto> ToTableDtoAsync(DiningTable table, TableSession? session) => new()
        {
            Id = table.Id,
            Label = table.Label,
            Active = table.Active,
            ActiveSession = session is null ? null : await ToSessionDtoAsync(session)
        };

        private async Task<TableSessionDto> ToSessionDtoAsync(TableSession session)
        {
            var spent = await _orders.GetSessionSpentAsync(session.Id);
            var count = await _orders.CountSessionOrdersAsync(session.Id);
            var cap = session.SpendingCap ?? _security.MaxSpendPerSession;

            return new TableSessionDto
            {
                Id = session.Id,
                DiningTableId = session.DiningTableId,
                TableLabel = session.DiningTable?.Label ?? string.Empty,
                AccessToken = session.AccessToken,
                GuestName = session.GuestName,
                OpenedAt = session.OpenedAt,
                ExpiresAt = session.ExpiresAt,
                IsOpen = session.ClosedAt is null && DateTime.UtcNow < session.ExpiresAt,
                ClientPath = $"/mesa/{session.AccessToken}",
                GatePath = $"/m/{session.DiningTableId}",
                SpendingCap = cap,
                Spent = spent,
                OrderCount = count
            };
        }
    }
}
