// Conexão em tempo real (WebSocket/SignalR) usada pela tela do cliente para
// acompanhar o próprio pedido sem precisar ficar dando F5 ou consultando a API.
import * as signalR from '@microsoft/signalr'

export function connectOrderHub({ publicId, onUpdated, onStatus }) {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl('/hubs/orders')
    .withAutomaticReconnect()
    .build()

  // O hub manda updates de todos os pedidos que estão sendo observados; aqui
  // filtramos para só reagir ao pedido que essa tela está acompanhando.
  connection.on('OrderUpdated', (order) => {
    if (order?.publicId === publicId) onUpdated?.(order)
  })

  connection.onreconnecting(() => onStatus?.('connecting'))
  connection.onreconnected(async () => {
    onStatus?.('online')
    // Depois de reconectar, o servidor "esqueceu" que essa conexão queria
    // ouvir esse pedido, então pedimos de novo (WatchOrder) para voltar a receber os eventos.
    try {
      await connection.invoke('WatchOrder', publicId)
    } catch {
      /* ok */
    }
  })
  connection.onclose(() => onStatus?.('offline'))

  return connection
}
