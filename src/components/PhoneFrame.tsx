import { useEffect, useState } from 'react'
import { NOMBRE_TAMANO, useTamanoTexto } from '../lib/useTamanoTexto'
import './PhoneFrame.css'

interface PhoneFrameProps {
  children: React.ReactNode
  onBack?: () => void
  progreso?: { actual: number; total: number } | null
}

export function useTemaOscuro() {
  const [oscuro, setOscuro] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    document.documentElement.classList.toggle('dark', oscuro)
  }, [oscuro])
  return { oscuro, alternar: () => setOscuro((o) => !o) }
}

export default function PhoneFrame({ children, onBack, progreso }: PhoneFrameProps) {
  const { oscuro, alternar } = useTemaOscuro()
  const { tamano, siguienteTamano } = useTamanoTexto()
  const [avisoTamano, setAvisoTamano] = useState(false)

  function cambiarTamano() {
    siguienteTamano()
    setAvisoTamano(true)
    setTimeout(() => setAvisoTamano(false), 1400)
  }

  return (
    <div className="phone-frame">
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {onBack && (
            <button className="tema-toggle" aria-label="Volver" onClick={onBack}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          )}
          <div className="logo"><img className="mark" src="/isotipo.svg" alt="MargenPro" /> <span>Margen<span className="acento">Pro</span></span></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
          {avisoTamano && <span className="aviso-tamano-texto">Letra: {NOMBRE_TAMANO[tamano]}</span>}
          <button className="tema-toggle" aria-label="Cambiar el tamaño de la letra" onClick={cambiarTamano}>
            <svg width="21" height="17" viewBox="0 0 30 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19L9.5 5h1L16 19M5.5 15h9" /><path d="M24 3v6M21 6h6" /><path d="M21 17h6" /></svg>
          </button>
          <button className="tema-toggle" aria-label="Cambiar tema" onClick={alternar}>
            {oscuro ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M21.75 15A9.72 9.72 0 0118 15.75c-5.39 0-9.75-4.36-9.75-9.75 0-1.33.27-2.6.75-3.75A9.75 9.75 0 003 11.25C3 16.64 7.36 21 12.75 21a9.75 9.75 0 009-6z" /></svg>
            )}
          </button>
        </div>
      </div>

      {progreso && (
        <div className="paso-indicador-wrap">
          <div className="paso-indicador">Paso {progreso.actual} de {progreso.total}</div>
          <div className="progreso-barra"><div style={{ width: `${Math.round((progreso.actual / progreso.total) * 100)}%` }} /></div>
        </div>
      )}

      {children}
    </div>
  )
}
