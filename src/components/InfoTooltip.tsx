import { useLayoutEffect, useRef, useState } from 'react'
import './InfoTooltip.css'

type Alineacion = 'centro' | 'izquierda' | 'derecha'
const MARGEN_PANTALLA = 12

/** Ícono de información — en escritorio se muestra al pasar el mouse o hacer foco (teclado). En
 * celular (donde no hay "hover" de verdad) el TOQUE lo "fija" abierto hasta el siguiente toque,
 * y tocar el globo de texto también lo cierra. `fijado` y `hover` se combinan (no se pisan uno al
 * otro) para que un clic con el mouse ya encima (hover ya activo) no lo cierre de inmediato.
 *
 * La alineación del globo (centro/izquierda/derecha respecto al ÍCONO, nunca con px absolutos de
 * pantalla) se decide en JS, pero se aplica con CSS puro relativo al propio ícono — así el
 * tamaño de letra grande/muy grande (que usa `zoom`) no lo desplaza mal: un `top`/`left` en px
 * copiado de la pantalla y vuelto a poner dentro de un elemento con zoom se duplica y el globo
 * terminaba apareciendo lejos de donde debía. */
export default function InfoTooltip({ texto }: { texto: string }) {
  const [hover, setHover] = useState(false)
  const [fijado, setFijado] = useState(false)
  const visible = hover || fijado
  const iconoRef = useRef<HTMLButtonElement>(null)
  const [alineacion, setAlineacion] = useState<Alineacion>('centro')

  useLayoutEffect(() => {
    if (!visible || !iconoRef.current) return
    const rect = iconoRef.current.getBoundingClientRect()
    const anchoEstimado = Math.min(230, window.innerWidth - MARGEN_PANTALLA * 2)
    const centro = rect.left + rect.width / 2
    if (centro - anchoEstimado / 2 < MARGEN_PANTALLA) setAlineacion('izquierda')
    else if (centro + anchoEstimado / 2 > window.innerWidth - MARGEN_PANTALLA) setAlineacion('derecha')
    else setAlineacion('centro')
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
      {visible && (
        <span
          className={`info-tooltip-globo alinear-${alineacion}`}
          role="tooltip"
          onClick={(e) => { e.stopPropagation(); cerrar() }}
        >
          {texto}
        </span>
      )}
    </span>
  )
}
