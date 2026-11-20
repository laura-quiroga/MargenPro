import { useEffect, useState } from 'react'
import './OfflineBanner.css'

/** Aviso global de "sin conexión" — antes, si el celular perdía señal a mitad de algo, la app
 * solo mostraba el error genérico de "no pudimos guardar, intenta de nuevo" sin decir POR QUÉ.
 * Esta franja aparece arriba de TODA la app (landing, onboarding, app, admin) apenas se pierde la
 * conexión, y se oculta sola al recuperarla — sin bloquear nada, solo informa. */
export default function OfflineBanner() {
  const [sinConexion, setSinConexion] = useState(!navigator.onLine)
  const [mostrarRecuperada, setMostrarRecuperada] = useState(false)

  useEffect(() => {
    function alPerder() { setSinConexion(true); setMostrarRecuperada(false) }
    function alRecuperar() {
      setSinConexion(false)
      setMostrarRecuperada(true)
      setTimeout(() => setMostrarRecuperada(false), 3000)
    }
    window.addEventListener('offline', alPerder)
    window.addEventListener('online', alRecuperar)
    return () => {
      window.removeEventListener('offline', alPerder)
      window.removeEventListener('online', alRecuperar)
    }
  }, [])

  if (!sinConexion && !mostrarRecuperada) return null

  return (
    <div className={`offline-banner ${sinConexion ? 'sin-conexion' : 'recuperada'}`} role="status">
      {sinConexion ? (
        <>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 9v4M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg>
          Estás sin conexión — lo que hagas ahora no se va a guardar hasta que vuelva internet.
        </>
      ) : (
        <>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
          Ya volvió tu conexión.
        </>
      )}
    </div>
  )
}
