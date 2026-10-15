// Ponto de entrada do site do cliente: monta o componente <App /> dentro da
// div#root do index.html (é o que o "npm run dev" do client serve).
import React from 'react'
import { createRoot } from 'react-dom/client'
// O CSS global vem antes do App para que os estilos de cada tela/componente
// (importados dentro do App) possam sobrescrever os estilos base.
import './styles.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
