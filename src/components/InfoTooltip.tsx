import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import './InfoTooltip.css'

/** Ícono de información — en escritorio se muestra al pasar el mouse o hacer foco (teclado). En
 * celular (donde no hay "hover" de verdad) el TOQUE lo "fija" abierto hasta el siguiente toque,
 * y tocar el globo de texto (o el fondo oscuro) también lo cierra. `fijado` y `hover` se combinan
 * (no se pisan uno al otro) para que un clic con el mouse ya encima (hover ya activo) no lo
 * cierre de inmediato.
 *
 * El cuadro SIEMPRE aparece fijo y centrado en medio de la pantalla real — con un `createPortal`
 * a un nodo que se cuelga de `<html>`, FUERA de `<body>`. El tamaño de letra grande/muy grande de
 * esta app escala TODO `<body>` con `zoom` — y en Chromium, `position:fixed` adentro de un
 * ancestro con `zoom` NO se libra de esa escala (se vio con la medición real: con zoom 1.3 un
 * `position:fixed;inset:0` terminaba midiendo más de 1300px de alto en una pantalla de 812px).
 * La única forma de que el cuadro no se mueva ni se deforme es que viva por completo afuera del
 * elemento zoomeado. */
export default function InfoTooltip({ texto }: { texto: string }) {
  const [hover, setHover] = useState(false)
  const [fijado, setFijado] = useState(false)
  const visible = hover || fijado
  const [portal, setPortal] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const nodo = document.createElement('div')
    document.documentElement.appendChild(nodo)
    setPortal(nodo)
    return () => { document.documentElement.removeChild(nodo) }
  }, [])

  function cerrar() {
    setFijado(false)
    setHover(false)
  }

  return (
    <span
      className="info-tooltip"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <button type="button" className="info-tooltip-icono" aria-label="Qué significa esto" onClick={(e) => { e.stopPropagation(); setFijado((f) => !f) }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 16v-5M12 8h.01" />
        </svg>
      </button>
      {visible && portal && createPortal(
        <div className="info-tooltip-fondo" onClick={(e) => { e.stopPropagation(); cerrar() }}>
          <div className="info-tooltip-globo" role="tooltip" onClick={(e) => { e.stopPropagation(); cerrar() }}>
            {texto}
          </div>
        </div>,
        portal,
      )}
    </span>
  )
}
