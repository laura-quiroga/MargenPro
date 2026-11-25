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

// React reemplaza de un golpe el contenido de #root (la pantalla de carga) por la app real — sin
// nada más, eso se siente como un corte abrupto. La View Transition API del navegador hace un
// cross-fade automático entre el "antes" y el "después" de un cambio del DOM, así que basta con
// correr el montaje adentro de `startViewTransition` para que la pantalla de carga se desvanezca
// mientras la app aparece, en vez de cortar de golpe. Si el navegador no la soporta (Safari viejo),
// se monta igual, solo que sin el desvanecido.
function montarConTransicion() {
  if (document.startViewTransition) document.startViewTransition(() => montar())
  else montar()
}

// La pantalla de carga de index.html (logo + "MargenPro") se queda visible un mínimo de MINIMO_MS
// desde que arrancó la navegación. `performance.now()` ya mide desde el inicio de la navegación
// (no desde que corre este script), así que cuenta el tiempo que ya tardó en cargar el bundle.
// 4s elegidos a propósito por la usuaria (probó 5s primero) — le da identidad de marca.
const MINIMO_MS = 4000
const faltante = MINIMO_MS - performance.now()
if (faltante > 0) setTimeout(montarConTransicion, faltante)
else montarConTransicion()
