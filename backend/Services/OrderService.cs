using System.Security.Claims;
using Backend.Dtos;
using Backend.Hubs;
using Backend.Models;
using Backend.Options;
using Backend.Repositories;
using Microsoft.Extensions.Options;

namespace Backend.Services
{
    public interface IOrderService
    {
        Task<List<AddonDto>> GetAddonsForMenuItemAsync(int menuItemId);
        Task<OrderDto> CreateAsync(CreateOrderDto dto);
        Task<OrderDto?> GetByIdAsync(int id);
        Task<OrderDto?> GetByPublicIdAsync(Guid publicId);
        Task<List<OrderDto>> GetAllAsync(string? status = null);
        Task<OrderDto?> UpdateStatusAsync(int id, string status, ClaimsPrincipal? actor = null, string? ipAddress = null);
        /// <summary>Simula webhook Pix: libera o pedido para a cozinha.</summary>
        Task<OrderDto?> ConfirmPaymentAsync(Guid publicId, string? ipAddress = null);
    }

    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _orders;
        private readonly IMenuItemRepository _menuItems;
        private readonly IAddonRepository _addons;
        private readonly IDiningTableRepository _tables;
        private readonly IAuditLogRepository _audit;
        private readonly IOrderRealtimeNotifier _realtime;
        private readonly SecurityOptions _security;
        private readonly RestaurantOptions _restaurant;
        private readonly IPromotionService _promotions;

        public OrderService(
            IOrderRepository orders,
            IMenuItemRepository menuItems,
            IAddonRepository addons,
            IDiningTableRepository tables,
            IAuditLogRepository audit,
            IOrderRealtimeNotifier realtime,
            IOptions<SecurityOptions> security,
            IOptions<RestaurantOptions> restaurant,
            IPromotionService promotions)
        {
            _orders = orders;
            _menuItems = menuItems;
            _addons = addons;
            _tables = tables;
            _audit = audit;
            _realtime = realtime;
            _security = security.Value;
            _restaurant = restaurant.Value;
            _promotions = promotions;
        }

        public async Task<List<AddonDto>> GetAddonsForMenuItemAsync(int menuItemId)
        {
            var list = await _addons.GetByMenuItemIdAsync(menuItemId);
            return list.Select(a => new AddonDto
            {
                Id = a.Id,
                MenuItemId = a.MenuItemId,
                Name = a.Name,
                Price = a.Price,
                Available = a.Available
            }).ToList();
        }

        public async Task<OrderDto> CreateAsync(CreateOrderDto dto)
        {
            if (dto.Items is null || dto.Items.Count == 0)
                throw new ArgumentException("O pedido precisa ter pelo menos um item.");

            TableSession? session = null;
            if (string.IsNullOrWhiteSpace(dto.AccessToken))
                throw new ArgumentException(
                    "Pedidos só são aceitos após liberar a mesa (QR + senha do dia).");

            session = await _tables.GetSessionByTokenAsync(dto.AccessToken.Trim());
            if (session is null)
                throw new ArgumentException("Sessão da mesa inválida ou expirada.");

            var menuItemIds = dto.Items.Select(i => i.MenuItemId).Distinct().ToList();
            var catalog = new Dictionary<int, MenuItem>();
            foreach (var id in menuItemIds)
            {
                var item = await _menuItems.GetByIdAsync(id);
                if (item is null || !item.Available)
                    throw new ArgumentException($"Produto {id} indisponível ou inexistente.");
                catalog[id] = item;
            }

            var addonCatalog = (await _addons.GetByMenuItemIdsAsync(menuItemIds))
                .ToDictionary(a => a.Id);

            var livePromos = await _promotions.GetLiveByMenuItemIdsAsync(menuItemIds);

            var now = DateTime.UtcNow;
            var order = new Order
            {
                PublicId = Guid.NewGuid(),
                TableSessionId = session?.Id,
                TableLabel = session?.DiningTable?.Label,
                Status = OrderStatuses.AwaitingPayment,
                CustomerNotes = SecurityRules.SanitizeNotes(dto.CustomerNotes, _security.NotesMaxLength),
                CreatedAt = now,
                UpdatedAt = now
            };

            foreach (var line in dto.Items)
            {
                if (line.Quantity <= 0)
                    throw new ArgumentException("Quantidade inválida.");

                var menuItem = catalog[line.MenuItemId];
                var unitPrice = livePromos.TryGetValue(menuItem.Id, out var promo)
                    ? promo.PromoPrice
                    : menuItem.Price;
                var selectedAddons = new List<OrderItemAddon>();

                foreach (var addonRef in line.Addons.Select(a => a.AddonId).Distinct())
                {
                    if (!addonCatalog.TryGetValue(addonRef, out var addon) ||
                        addon.MenuItemId != menuItem.Id ||
                        !addon.Available)
                    {
                        throw new ArgumentException(
                            $"Adicional {addonRef} inválido para {menuItem.Name}.");
                    }

                    selectedAddons.Add(new OrderItemAddon
                    {
                        AddonId = addon.Id,
                        Name = addon.Name,
                        Price = addon.Price
                    });
                }

                var lineTotal = OrderRules.CalculateLineTotal(
                    unitPrice,
                    line.Quantity,
                    selectedAddons.Select(a => a.Price));

                order.Items.Add(new OrderItem
                {
                    MenuItemId = menuItem.Id,
                    MenuItemName = menuItem.Name,
                    UnitPrice = unitPrice,
                    Quantity = line.Quantity,
                    Notes = SecurityRules.SanitizeNotes(line.Notes, _security.NotesMaxLength),
                    LineTotal = lineTotal,
                    Addons = selectedAddons
                });
            }

            order.Total = OrderRules.CalculateOrderTotal(order.Items.Select(i => i.LineTotal));

            if (session is not null)
            {
                var spent = await _orders.GetSessionSpentAsync(session.Id);
                var count = await _orders.CountSessionOrdersAsync(session.Id);
                var cap = session.SpendingCap ?? _security.MaxSpendPerSession;

                SecurityRules.EnsureWithinOrderCount(count, _security.MaxOrdersPerSession);
                SecurityRules.EnsureWithinSessionCap(spent, order.Total, cap);
            }

            await _orders.AddAsync(order);

            var created = await _orders.GetByIdAsync(order.Id);
            // Ainda não notifica a cozinha — só após ConfirmPaymentAsync.
            return ToDto(created!);
        }

        public async Task<OrderDto?> ConfirmPaymentAsync(Guid publicId, string? ipAddress = null)
        {
            var order = await _orders.GetByPublicIdAsync(publicId);
            if (order is null) return null;

            if (order.Status == OrderStatuses.Received ||
                order.Status == OrderStatuses.Preparing ||
                order.Status == OrderStatuses.Ready ||
                order.Status == OrderStatuses.Delivered)
            {
                return ToDto(order);
            }

            if (order.Status != OrderStatuses.AwaitingPayment)
                throw new InvalidOperationException("Este pedido não está aguardando pagamento.");

            var expiresAt = order.CreatedAt.AddMinutes(_restaurant.PixExpiresMinutes);
            if (DateTime.UtcNow > expiresAt)
                throw new InvalidOperationException("O Pix expirou. Faça um novo pedido.");

            var from = order.Status;
            OrderRules.EnsureCanTransition(from, OrderStatuses.Received);
            order.Status = OrderStatuses.Received;
            order.UpdatedAt = DateTime.UtcNow;
            await _orders.UpdateAsync(order);

            await _audit.AddAsync(new AuditLog
            {
                EntityType = nameof(Order),
                EntityId = order.Id.ToString(),
                Action = "PaymentConfirmed",
                FromValue = from,
                ToValue = OrderStatuses.Received,
                ActorName = "PixWebhook(simulado)",
                IpAddress = ipAddress,
                CreatedAt = DateTime.UtcNow
            });

            var dto = ToDto(order);
            await _realtime.NotifyOrderCreatedAsync(dto);
            await _realtime.NotifyOrderUpdatedAsync(dto);
            return dto;
        }

        public async Task<OrderDto?> GetByIdAsync(int id)
        {
            var order = await _orders.GetByIdAsync(id);
            return order is null ? null : ToDto(order);
        }

        public async Task<OrderDto?> GetByPublicIdAsync(Guid publicId)
        {
            var order = await _orders.GetByPublicIdAsync(publicId);
            return order is null ? null : ToDto(order);
        }

        public async Task<List<OrderDto>> GetAllAsync(string? status = null)
        {
            var orders = await _orders.GetAllAsync(status);
            return orders
                .Where(o =>
                    status != null ||
                    OrderStatuses.KitchenVisible.Contains(o.Status))
                .Select(ToDto)
                .ToList();
        }

        public async Task<OrderDto?> UpdateStatusAsync(
            int id,
            string status,
            ClaimsPrincipal? actor = null,
            string? ipAddress = null)
        {
            var order = await _orders.GetByIdAsync(id);
            if (order is null) return null;

            if (string.IsNullOrWhiteSpace(status) || !OrderStatuses.All.Contains(status))
                throw new ArgumentException("Status inválido.");

            var from = order.Status;
            OrderRules.EnsureCanTransition(from, status);
            order.Status = status;
            order.UpdatedAt = DateTime.UtcNow;
            await _orders.UpdateAsync(order);

            await _audit.AddAsync(new AuditLog
            {
                EntityType = nameof(Order),
                EntityId = order.Id.ToString(),
                Action = "StatusChanged",
                FromValue = from,
                ToValue = status,
                ActorUserId = actor?.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? actor?.FindFirstValue("sub"),
                ActorName = actor?.FindFirstValue(ClaimTypes.Name) ?? actor?.Identity?.Name,
                IpAddress = ipAddress,
                CreatedAt = DateTime.UtcNow
            });

            var dto = ToDto(order);
            await _realtime.NotifyOrderUpdatedAsync(dto);
            return dto;
        }

        private OrderDto ToDto(Order order)
        {
            var expiresAt = order.CreatedAt.AddMinutes(_restaurant.PixExpiresMinutes);
            var pix = BuildPixPayload(order);

            return new OrderDto
            {
                Id = order.Id,
                PublicId = order.PublicId,
                TableLabel = order.TableLabel,
                Status = order.Status,
                CustomerNotes = order.CustomerNotes,
                Total = order.Total,
                CreatedAt = order.CreatedAt,
                PixCopyPaste = order.Status == OrderStatuses.AwaitingPayment ? pix : null,
                PaymentExpiresAt = order.Status == OrderStatuses.AwaitingPayment ? expiresAt : null,
                Items = order.Items.Select(i => new OrderItemDto
                {
                    Id = i.Id,
                    MenuItemId = i.MenuItemId,
                    MenuItemName = i.MenuItemName,
                    UnitPrice = i.UnitPrice,
                    Quantity = i.Quantity,
                    Notes = i.Notes,
                    LineTotal = i.LineTotal,
                    Addons = i.Addons.Select(a => new OrderItemAddonDto
                    {
                        AddonId = a.AddonId,
                        Name = a.Name,
                        Price = a.Price
                    }).ToList()
                }).ToList()
            };
        }

        private string BuildPixPayload(Order order)
        {
            // Payload demonstrativo (não é EMV real). Serve para a tela T4 do wireframe.
            var cents = (long)Math.Round(order.Total * 100m, MidpointRounding.AwayFromZero);
            var name = new string(_restaurant.Name
                .ToUpperInvariant()
                .Where(c => c is >= 'A' and <= 'Z' or ' ')
                .Take(25)
                .ToArray())
                .PadRight(25)
                .Trim();
            if (string.IsNullOrWhiteSpace(name)) name = "GOSERV";
            return $"00020126580014BR.GOV.BCB.PIX0136{order.PublicId:N}52040000530398654{cents:D2}5802BR5925{name}6009SAO PAULO62070503***6304ABCD";
        }
    }
}
