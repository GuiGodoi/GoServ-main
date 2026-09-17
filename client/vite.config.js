// Configuração do Vite: é o que roda quando você executa "npm run dev" ou "npm run build".
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Habilita suporte a React (JSX, fast refresh, etc).
  plugins: [react()],
  server: {
    // "host: true" permite acessar o site por outros dispositivos na mesma rede
    // (ex: abrir no celular usando o IP do computador).
    host: true,
    port: 5173,
    // Redireciona chamadas de API/SignalR feitas pelo navegador para o backend
    // (que roda em outra porta), assim o front-end pode chamar "/api/..." direto,
    // sem precisar saber o endereço completo do backend.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/hubs': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true, // necessário para o SignalR (WebSocket) funcionar pelo proxy
      },
    },
  },
})
