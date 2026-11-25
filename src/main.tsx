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

// La pantalla de carga (logo + "MargenPro") se queda visible 4s FIJOS desde que arranca este
// script — no 4s desde que arrancó la navegación completa. Antes se restaba lo que ya había
// tardado la red en traer el bundle (`MINIMO_MS - performance.now()`), pensado para no sumar un
// retraso de más sobre una carga ya lenta — pero eso significa que si la pantalla previa del
// celular (el ícono nativo de Android) o la red tardan más de lo normal, a esta pantalla le queda
// MENOS tiempo visible, justo lo contrario de lo que se quiere (la usuaria vio esto en vivo: la
// primera pantalla tardó más y la segunda solo se vio 1s). 4s fijos, siempre, pase lo que pase antes.
const MINIMO_MS = 4000
setTimeout(montarConTransicion, MINIMO_MS)
