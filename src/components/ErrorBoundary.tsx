import { Component, type ErrorInfo, type ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'

interface Props { children: ReactNode; pantalla?: string }
interface State { tieneError: boolean }

/** Error Boundary global — nunca deja pantalla blanca. Reporta a error_log (admite usuario
 * anónimo) para que el panel de administración lo muestre; no bloquea el intento de reportar
 * si falla (no hay nada más que hacer en ese caso). */
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

  render() {
    if (this.state.tieneError) {
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
