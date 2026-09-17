using Backend.Dtos;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

// Hubs de SignalR: canais de tempo real (WebSocket) para avisar o front-end
// assim que algo muda no pedido, sem precisar ficar consultando a API o tempo todo.
namespace Backend.Hubs
{
    /// <summary>
    /// Canal usado pelo painel da cozinha (KDS): manda um evento para TODOS os
    /// conectados sempre que um pedido é criado/atualizado. Só admin/cozinha
    /// conseguem se conectar aqui (exige login).
    /// </summary>
    [Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Kitchen}")]
    public class KitchenHub : Hub
    {
        public const string Path = "/hubs/kitchen";
        public const string OrderCreated = "OrderCreated";
        public const string OrderUpdated = "OrderUpdated";
    }

    /// <summary>
    /// Canal usado pelo cliente para acompanhar SEU pedido em tempo real
    /// (tela de "pedido a caminho"). Não exige login, mas cada cliente só
    /// entra no "grupo" do próprio pedido, então não vê os pedidos de ninguém
    /// mais — só recebe eventos do PublicId que ele mesmo informou.
    /// </summary>
    [AllowAnonymous]
    public class OrderTrackingHub : Hub
    {
        public const string Path = "/hubs/orders";
        public const string OrderUpdated = "OrderUpdated";

        /// <summary>Nome do "grupo" do SignalR usado para isolar os eventos de cada pedido.</summary>
        public static string GroupName(Guid publicId) => $"order-{publicId:D}";

        /// <summary>Chamado pelo front-end assim que conecta, para começar a receber
        /// atualizações só do pedido informado.</summary>
        public async Task WatchOrder(string publicId)
        {
            if (!Guid.TryParse(publicId, out var id) || id == Guid.Empty)
                throw new HubException("Pedido inválido.");

            await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(id));
        }
    }

    /// <summary>
    /// Abstrai o envio de notificações em tempo real, para o OrderService não
    /// precisar depender diretamente de tipos do SignalR.
    /// </summary>
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

        // Avisa a cozinha (todo mundo conectado no KitchenHub) e, ao mesmo tempo,
        // avisa só o cliente dono desse pedido específico (grupo no OrderTrackingHub).
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
