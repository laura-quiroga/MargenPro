import { useState } from 'react'
import './InfoTooltip.css'

/** Ícono de información — en escritorio se muestra al pasar el mouse o hacer foco (teclado). En
 * celular (donde no hay "hover" de verdad) el TOQUE lo "fija" abierto hasta el siguiente toque.
 * `fijado` y `hover` se combinan (no se pisan uno al otro) para que un clic con el mouse ya
 * encima (hover ya activo) no lo cierre de inmediato por accidente. */
export default function InfoTooltip({ texto }: { texto: string }) {
  const [hover, setHover] = useState(false)
  const [fijado, setFijado] = useState(false)
  const visible = hover || fijado
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
      {visible && <span className="info-tooltip-globo" role="tooltip">{texto}</span>}
    </span>
  )
}
