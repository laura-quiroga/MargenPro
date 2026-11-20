import { useState } from 'react'
import './InfoTooltip.css'

/** Ícono de información junto a una métrica técnica — al pasar el mouse o hacer foco (teclado)
 * muestra una explicación corta en lenguaje simple de qué significa el número y de dónde sale. */
export default function InfoTooltip({ texto }: { texto: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <span
      className="info-tooltip"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <button type="button" className="info-tooltip-icono" aria-label="Qué significa esto">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 16v-5M12 8h.01" />
        </svg>
      </button>
      {visible && <span className="info-tooltip-globo" role="tooltip">{texto}</span>}
    </span>
  )
}
