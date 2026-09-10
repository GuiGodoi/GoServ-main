import * as signalR from '@microsoft/signalr'
import { getToken } from './api'

export function connectKitchenHub({ onCreated, onUpdated, onStatus }) {
  const connection = new signalR.HubConnectionBuilder()
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
