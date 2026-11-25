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

/** Entrada suave sin arriesgar que la app se quede colgada: `#carga-inicial` vive FUERA de
 * `#root` (ver index.html) como hermano, así que montar React adentro de `#root` no lo toca —
 * la app ya se está dibujando debajo mientras el overlay se desvanece encima, un cross-fade real
 * con solo CSS. Se probó primero con la View Transition API del navegador (`startViewTransition`)
 * y su promesa puede no resolverse NUNCA en ciertos entornos de renderizado (navegadores
 * automatizados, posiblemente algunas WebView de Android) — eso dejaba la app entera colgada en
 * la pantalla de carga para siempre, sin ningún error visible. Este fade no depende de ninguna
 * promesa del navegador, solo de un `setTimeout` fijo: no se puede quedar pegado. */
function montarConTransicion() {
  montar()
  const carga = document.getElementById('carga-inicial')
  if (!carga) return
  carga.classList.add('carga-saliendo')
  setTimeout(() => carga.remove(), 450)
}

// La pantalla de carga (logo + "MargenPro") se queda visible 4s FIJOS desde que arranca este
// script, pase lo que pase antes (splash nativo del celular, red lenta, etc.) — ver ESTADO.md
// para el historial de por qué es un valor fijo y no uno que se resta del tiempo ya transcurrido.
const MINIMO_MS = 4000
setTimeout(montarConTransicion, MINIMO_MS)
