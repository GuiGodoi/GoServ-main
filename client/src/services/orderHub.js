import * as signalR from '@microsoft/signalr'

export function connectOrderHub({ publicId, onUpdated, onStatus }) {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl('/hubs/orders')
    .withAutomaticReconnect()
    .build()

  connection.on('OrderUpdated', (order) => {
    if (order?.publicId === publicId) onUpdated?.(order)
  })

  connection.onreconnecting(() => onStatus?.('connecting'))
  connection.onreconnected(async () => {
    onStatus?.('online')
    try {
      await connection.invoke('WatchOrder', publicId)
    } catch {
      /* ok */
    }
  })
  connection.onclose(() => onStatus?.('offline'))

  return connection
}
