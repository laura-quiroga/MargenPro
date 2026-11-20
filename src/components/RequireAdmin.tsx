import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './RequireAdmin.css'

type Estado = 'cargando' | 'no-admin' | 'necesita-enrolar' | 'necesita-codigo' | 'listo'

/** Guard de /admin/*. Dos capas:
 * 1) Seguridad REAL (servidor): profiles.role + RLS/RPC — un usuario normal no puede leer datos
 *    de admin aunque adivine la URL, aunque esta pantalla no exista.
 * 2) Segundo factor (TOTP, código de 6 dígitos de una app autenticadora): el login normal de
 *    MargenPro es con enlace mágico/Google (sin contraseña) — si alguien entra al correo o la
 *    cuenta de Google del dueño, con eso solo NO basta para ver el panel de admin. Hace falta
 *    además el código que solo genera su celular. Usa supabase.auth.mfa (TOTP nativo). */
export default function RequireAdmin() {
  const [estado, setEstado] = useState<Estado>('cargando')
  const [factorId, setFactorId] = useState<string | null>(null)
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [secreto, setSecreto] = useState<string | null>(null)
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [reintentos, setReintentos] = useState(0)

  useEffect(() => {
    let activo = true
    async function verificar() {
      setError('')
      const { data: userData } = await supabase.auth.getUser()
      const usuario = userData.user
      if (!usuario) { if (activo) setEstado('no-admin'); return }
      const { data: perfil } = await supabase.from('profiles').select('role').eq('id', usuario.id).maybeSingle()
      if (!activo) return
      if (perfil?.role !== 'admin') { setEstado('no-admin'); return }

      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (!activo) return
      if (aal?.currentLevel === 'aal2') { setEstado('listo'); return }

      const { data: factores } = await supabase.auth.mfa.listFactors()
      if (!activo) return
      const listaTotp = (factores?.totp ?? []) as { id: string; status: string }[]
      const factorVerificado = listaTotp.find((f) => f.status === 'verified')
      if (factorVerificado) {
        setFactorId(factorVerificado.id)
        const { data: desafio, error: errDesafio } = await supabase.auth.mfa.challenge({ factorId: factorVerificado.id })
        if (!activo) return
        if (errDesafio || !desafio) { setError('No pudimos iniciar la verificación. Intenta de nuevo.'); setEstado('necesita-codigo'); return }
        setChallengeId(desafio.id)
        setEstado('necesita-codigo')
      } else {
        // Un intento de inscripción anterior que nunca se terminó (la persona cerró la pestaña,
        // o algo falló a mitad de camino) deja un factor "unverified" a medio hacer — Supabase
        // no deja crear uno nuevo mientras ese exista, y eso es justo lo que producía el error
        // "No pudimos preparar la verificación en dos pasos". Se limpia primero, sin que la
        // persona tenga que hacer nada.
        const factorAMedias = listaTotp.find((f) => f.status === 'unverified')
        if (factorAMedias) await supabase.auth.mfa.unenroll({ factorId: factorAMedias.id })
        if (!activo) return
        const { data: inscripcion, error: errInscripcion } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
        if (!activo) return
        if (errInscripcion || !inscripcion) { setError('No pudimos preparar la verificación en dos pasos. Intenta de nuevo.'); setEstado('necesita-enrolar'); return }
        setFactorId(inscripcion.id)
        setQr(inscripcion.totp.qr_code)
        setSecreto(inscripcion.totp.secret)
        setEstado('necesita-enrolar')
      }
    }
    setEstado('cargando')
    verificar()
    return () => { activo = false }
  }, [reintentos])

  async function confirmarEnrolamiento() {
    if (!factorId || codigo.trim().length < 6) return
    setProcesando(true)
    setError('')
    const { data: desafio, error: errDesafio } = await supabase.auth.mfa.challenge({ factorId })
    if (errDesafio || !desafio) { setError('El código no es válido o ya venció. Intenta de nuevo.'); setProcesando(false); return }
    const { error: errVerificar } = await supabase.auth.mfa.verify({ factorId, challengeId: desafio.id, code: codigo.trim() })
    setProcesando(false)
    if (errVerificar) { setError('El código no es válido o ya venció. Revisa tu app autenticadora e intenta de nuevo.'); return }
    setEstado('listo')
  }

  async function confirmarCodigo() {
    if (!factorId || !challengeId || codigo.trim().length < 6) return
    setProcesando(true)
    setError('')
    const { error: errVerificar } = await supabase.auth.mfa.verify({ factorId, challengeId, code: codigo.trim() })
    setProcesando(false)
    if (errVerificar) { setError('Código incorrecto. Revisa tu app autenticadora e intenta de nuevo.'); return }
    setEstado('listo')
  }

  if (estado === 'cargando') return null
  if (estado === 'no-admin') return <Navigate to="/app" replace />

  if (estado === 'necesita-enrolar') {
    return (
      <div className="mfa-pantalla">
        <div className="mfa-tarjeta">
          <h1>Activa la verificación en dos pasos</h1>
          <p className="mfa-sub">Es la primera vez que entras al panel de administración. Para protegerlo, escanea este código con una app autenticadora en tu celular (Google Authenticator, Microsoft Authenticator o similar) y escribe el número de 6 dígitos que te muestre.</p>
          {qr && <img className="mfa-qr" src={qr} alt="Código QR para activar la verificación en dos pasos" />}
          {secreto && <p className="mfa-secreto">¿No puedes escanear? Escribe este código en tu app: <code>{secreto}</code></p>}
          {qr ? (
            <>
              <label className="mfa-label" htmlFor="codigoMfa">Código de 6 dígitos</label>
              <input id="codigoMfa" className="mfa-input" inputMode="numeric" maxLength={6} value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') confirmarEnrolamiento() }} placeholder="000000" autoFocus />
              {error && <p className="mfa-error">{error}</p>}
              <button className="mfa-btn" disabled={procesando || codigo.trim().length < 6} onClick={confirmarEnrolamiento}>
                {procesando ? 'Verificando…' : 'Activar y entrar'}
              </button>
            </>
          ) : (
            <>
              {error && <p className="mfa-error">{error}</p>}
              <button className="mfa-btn" onClick={() => setReintentos((n) => n + 1)}>Reintentar</button>
            </>
          )}
        </div>
      </div>
    )
  }

  if (estado === 'necesita-codigo') {
    return (
      <div className="mfa-pantalla">
        <div className="mfa-tarjeta">
          <h1>Verificación en dos pasos</h1>
          <p className="mfa-sub">Escribe el código de 6 dígitos que te muestra tu app autenticadora.</p>
          {challengeId ? (
            <>
              <label className="mfa-label" htmlFor="codigoMfa">Código de 6 dígitos</label>
              <input id="codigoMfa" className="mfa-input" inputMode="numeric" maxLength={6} value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') confirmarCodigo() }} placeholder="000000" autoFocus />
              {error && <p className="mfa-error">{error}</p>}
              <button className="mfa-btn" disabled={procesando || codigo.trim().length < 6} onClick={confirmarCodigo}>
                {procesando ? 'Verificando…' : 'Entrar'}
              </button>
            </>
          ) : (
            <>
              {error && <p className="mfa-error">{error}</p>}
              <button className="mfa-btn" onClick={() => setReintentos((n) => n + 1)}>Reintentar</button>
            </>
          )}
        </div>
      </div>
    )
  }

  return <Outlet />
}
