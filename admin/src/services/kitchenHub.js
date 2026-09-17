// Conexão em tempo real (WebSocket/SignalR) usada pelo painel da cozinha/admin
// para ver pedidos novos/atualizados assim que acontecem, sem precisar recarregar a página.
import * as signalR from '@microsoft/signalr'
import { getToken } from './api'

export function connectKitchenHub({ onCreated, onUpdated, onStatus }) {
  const connection = new signalR.HubConnectionBuilder()
    // Esse hub exige login: manda o token JWT junto para o servidor autorizar a conexão.
    .withUrl('/hubs/kitchen', {
      accessTokenFactory: () => getToken() || '',
    })
    .withAutomaticReconnect()
    .build()

  connection.on('OrderCreated', (order) => onCreated?.(order))
  connection.on('OrderUpdated', (order) => onUpdated?.(order))

  connection.onreconnecting(() => onStatus?.('connecting'))
  connection.onreconnected(() => onStatus?.('online'))
  connection.onclose(() => onStatus?.('offline'))

  return connection
}
