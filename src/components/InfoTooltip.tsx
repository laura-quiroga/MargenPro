import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import './InfoTooltip.css'

/** Ícono de información — toca el ícono para abrir el aviso, y toca el aviso (o el fondo oscuro)
 * para cerrarlo. Antes dependía también de "hover"/foco (pensado para mouse de escritorio), pero
 * en un celular real eso puede dejarlo atascado abierto o cerrado según el orden exacto en que el
 * navegador simula esos eventos al soltar el dedo — un simple toggle por toque es más confiable.
 *
 * El cuadro SIEMPRE aparece fijo y centrado en medio de la pantalla real — con un `createPortal`
 * a un nodo que se cuelga de `<html>`, FUERA de `<body>`. El tamaño de letra grande/muy grande de
 * esta app escala TODO `<body>` con `zoom` — y en Chromium, `position:fixed` adentro de un
 * ancestro con `zoom` NO se libra de esa escala (se vio con la medición real: con zoom 1.3 un
 * `position:fixed;inset:0` terminaba midiendo más de 1300px de alto en una pantalla de 812px).
 * La única forma de que el cuadro no se mueva ni se deforme es que viva por completo afuera del
 * elemento zoomeado. */
export default function InfoTooltip({ texto }: { texto: string }) {
  const [abierto, setAbierto] = useState(false)
  const [portal, setPortal] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const nodo = document.createElement('div')
    document.documentElement.appendChild(nodo)
    setPortal(nodo)
    return () => { document.documentElement.removeChild(nodo) }
  }, [])

  return (
    <span className="info-tooltip">
      {/* El ícono visual es chico (13px) pero el área que se puede tocar es de 44x44 — el mínimo
          recomendado — con un ::before invisible más grande (ver InfoTooltip.css). */}
      <button type="button" className="info-tooltip-icono" aria-label="Qué significa esto" onClick={(e) => { e.stopPropagation(); setAbierto((a) => !a) }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 16v-5M12 8h.01" />
        </svg>
      </button>
      {abierto && portal && createPortal(
        <div className="info-tooltip-fondo" onClick={(e) => { e.stopPropagation(); setAbierto(false) }}>
          <div className="info-tooltip-globo" role="tooltip" onClick={(e) => { e.stopPropagation(); setAbierto(false) }}>
            {texto}
          </div>
        </div>,
        portal,
      )}
    </span>
  )
}
