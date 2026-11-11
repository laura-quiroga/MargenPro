import { useState } from 'react'
import './Confetti.css'

const VARIABLES_COLOR = ['--accent', '--aviso', '--error', '--text-2']

interface Pieza { id: number; left: number; color: string; delay: number; rotacion: number }

/** Lanza un estallido de confeti CSS una vez por cada `trigger` distinto (incrementar un contador). */
export function useConfeti() {
  const [piezas, setPiezas] = useState<Pieza[]>([])

  const lanzar = (n = 14) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const estilos = getComputedStyle(document.documentElement)
    const colores = VARIABLES_COLOR.map((v) => estilos.getPropertyValue(v).trim() || 'currentColor')
    const nuevas: Pieza[] = Array.from({ length: n }, (_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 100,
      color: colores[i % colores.length],
      delay: Math.random() * 0.2,
      rotacion: Math.round(Math.random() * 360),
    }))
    setPiezas(nuevas)
    setTimeout(() => setPiezas([]), 1400)
  }

  return { piezas, lanzar }
}

export function Confetti({ piezas }: { piezas: Pieza[] }) {
  return (
    <div className="confetti-zona">
      {piezas.map((p) => (
        <div
          key={p.id}
          className="confetti-pieza"
          style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s`, transform: `rotate(${p.rotacion}deg)` }}
        />
      ))}
    </div>
  )
}
