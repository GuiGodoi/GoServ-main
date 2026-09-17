// Ponto de entrada do painel admin: monta o componente <App /> dentro da
// div#root do index.html (é o que o "npm run dev" do admin serve).
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
