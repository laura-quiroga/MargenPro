import { Component, type ErrorInfo, type ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'

interface Props { children: ReactNode; pantalla?: string; variante?: 'pantalla-completa' | 'seccion' }
interface State { tieneError: boolean }

/** Error Boundary — nunca deja pantalla blanca. Reporta a error_log (admite usuario anónimo)
 * para que el panel de administración lo muestre; no bloquea el intento de reportar si falla
 * (no hay nada más que hacer en ese caso).
 * `variante="seccion"` se usa DENTRO de /app y /admin (una por pantalla: Panorama, Insumos,
 * Recetas... y cada pantalla de admin) — si se rompe UNA sección, solo esa muestra el aviso y
 * el resto de la app (la barra de navegación, las demás pestañas) sigue funcionando. La variante
 * por defecto ("pantalla-completa") se usa una sola vez, en la raíz de App.tsx, como último
 * paracaídas si algo revienta fuera de cualquier sección. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { tieneError: false }

  static getDerivedStateFromError(): State {
    return { tieneError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    void this.reportar(error, info)
  }

  async reportar(error: Error, info: ErrorInfo) {
    const { data } = await supabase.auth.getUser()
    await supabase.from('error_log').insert({
      user_id: data.user?.id ?? null,
      mensaje: error.message,
      stack: `${error.stack ?? ''}\n${info.componentStack ?? ''}`.slice(0, 4000),
      pantalla: this.props.pantalla ?? window.location.pathname,
    })
  }

  reintentar = () => this.setState({ tieneError: false })

  render() {
    if (this.state.tieneError) {
      if (this.props.variante === 'seccion') {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', textAlign: 'center', gap: 10 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17 }}>Esta sección tuvo un problema</h3>
            <p style={{ color: 'var(--text-2)', fontSize: 13.5 }}>Ya quedó registrado. El resto de la app sigue funcionando — intenta de nuevo o entra a otra pestaña.</p>
            <button className="btn-secundario" style={{ maxWidth: 200, margin: 0 }} onClick={this.reintentar}>Reintentar</button>
          </div>
        )
      }
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: 24, textAlign: 'center', gap: 12 }}>
          <h2 style={{ fontFamily: 'var(--font-display)' }}>Algo salió mal</h2>
          <p style={{ color: 'var(--text-2)' }}>Ya quedó registrado. Intenta recargar la página.</p>
          <button className="btn-cta" style={{ maxWidth: 240 }} onClick={() => window.location.reload()}>Recargar</button>
        </div>
      )
    }
    return this.props.children
  }
}
