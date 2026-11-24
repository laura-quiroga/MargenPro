import { useLayoutEffect, useRef, useState } from 'react'
import './InfoTooltip.css'

const ANCHO_GLOBO = 230
const MARGEN_PANTALLA = 12

/** Ícono de información — en escritorio se muestra al pasar el mouse o hacer foco (teclado). En
 * celular (donde no hay "hover" de verdad) el TOQUE lo "fija" abierto hasta el siguiente toque,
 * y tocar el globo de texto también lo cierra. `fijado` y `hover` se combinan (no se pisan uno al
 * otro) para que un clic con el mouse ya encima (hover ya activo) no lo cierre de inmediato.
 *
 * La posición del globo se calcula en JS (no con `left:50%` fijo en CSS) y se recorta para que
 * nunca se salga de la pantalla — antes, un ícono cerca del borde derecho hacía que el globo se
 * cortara fuera de la vista. */
export default function InfoTooltip({ texto }: { texto: string }) {
  const [hover, setHover] = useState(false)
  const [fijado, setFijado] = useState(false)
  const visible = hover || fijado
  const iconoRef = useRef<HTMLButtonElement>(null)
  const [posicion, setPosicion] = useState<{ left: number; top: number } | null>(null)

  useLayoutEffect(() => {
    if (!visible || !iconoRef.current) return
    const rect = iconoRef.current.getBoundingClientRect()
    const centroDeseado = rect.left + rect.width / 2 - ANCHO_GLOBO / 2
    const maximoIzquierda = window.innerWidth - ANCHO_GLOBO - MARGEN_PANTALLA
    const left = Math.min(Math.max(centroDeseado, MARGEN_PANTALLA), Math.max(maximoIzquierda, MARGEN_PANTALLA))
    setPosicion({ left, top: rect.top - 8 })
  }, [visible])

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
      <button ref={iconoRef} type="button" className="info-tooltip-icono" aria-label="Qué significa esto" onClick={(e) => { e.stopPropagation(); setFijado((f) => !f) }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 16v-5M12 8h.01" />
        </svg>
      </button>
      {visible && posicion && (
        <span
          className="info-tooltip-globo"
          role="tooltip"
          style={{ position: 'fixed', left: posicion.left, top: posicion.top, transform: 'translateY(-100%)' }}
          onClick={(e) => { e.stopPropagation(); cerrar() }}
        >
          {texto}
        </span>
      )}
    </span>
  )
}
