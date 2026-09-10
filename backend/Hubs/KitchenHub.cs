using Backend.Dtos;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Backend.Hubs
{
    [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Kitchen}")]
    public class KitchenHub : Hub
    {
        public const string Path = "/hubs/kitchen";
        public const string OrderCreated = "OrderCreated";
        public const string OrderUpdated = "OrderUpdated";
    }

    [AllowAnonymous]
    public class OrderTrackingHub : Hub
    {
        public const string Path = "/hubs/orders";
        public const string OrderUpdated = "OrderUpdated";

        public static string GroupName(Guid publicId) => $"order-{publicId:D}";

        public async Task WatchOrder(string publicId)
        {
            if (!Guid.TryParse(publicId, out var id) || id == Guid.Empty)
                throw new HubException("Pedido inválido.");

            await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(id));
        }
    }

    public interface IOrderRealtimeNotifier
    {
        Task NotifyOrderCreatedAsync(OrderDto order);
        Task NotifyOrderUpdatedAsync(OrderDto order);
    }

    public class OrderRealtimeNotifier : IOrderRealtimeNotifier
    {
        private readonly IHubContext<KitchenHub> _kitchen;
        private readonly IHubContext<OrderTrackingHub> _tracking;

        public OrderRealtimeNotifier(
            IHubContext<KitchenHub> kitchen,
            IHubContext<OrderTrackingHub> tracking)
        {
            _kitchen = kitchen;
            _tracking = tracking;
        }

        public async Task NotifyOrderCreatedAsync(OrderDto order)
        {
            await _kitchen.Clients.All.SendAsync(KitchenHub.OrderCreated, order);
            await _tracking.Clients
                .Group(OrderTrackingHub.GroupName(order.PublicId))
                .SendAsync(OrderTrackingHub.OrderUpdated, order);
        }

        public async Task NotifyOrderUpdatedAsync(OrderDto order)
        {
            await _kitchen.Clients.All.SendAsync(KitchenHub.OrderUpdated, order);
            await _tracking.Clients
                .Group(OrderTrackingHub.GroupName(order.PublicId))
                .SendAsync(OrderTrackingHub.OrderUpdated, order);
        }
    }
}
