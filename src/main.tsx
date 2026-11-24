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

// La pantalla de carga de index.html (logo + "MargenPro") se queda visible un mínimo de 600ms
// desde que arrancó la navegación — con internet rápida, el bundle carga tan rápido que esa
// pantalla parpadeaba y desaparecía antes de que se alcanzara a ver. `performance.now()` ya mide
// desde el inicio de la navegación (no desde que corre este script), así que cuenta el tiempo que
// ya tardó en cargar el bundle.
const MINIMO_MS = 600
const faltante = MINIMO_MS - performance.now()
if (faltante > 0) setTimeout(montar, faltante)
else montar()
