import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

function montar() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// La pantalla de carga de index.html (logo + "MargenPro") se queda visible un mínimo de MINIMO_MS
// desde que arrancó la navegación. `performance.now()` ya mide desde el inicio de la navegación
// (no desde que corre este script), así que cuenta el tiempo que ya tardó en cargar el bundle.
// ⚠️ PRUEBA TEMPORAL a pedido de la usuaria: 5000ms (5s) en vez de los 600ms originales, para ver
// cómo se siente — si no le gusta, bajarlo de nuevo (600ms ya probado y es lo recomendado).
const MINIMO_MS = 5000
const faltante = MINIMO_MS - performance.now()
if (faltante > 0) setTimeout(montar, faltante)
else montar()
