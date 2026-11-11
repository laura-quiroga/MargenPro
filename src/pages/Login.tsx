import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneFrame from '../components/PhoneFrame'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  function continuar() {
    navigate('/app')
  }

  return (
    <PhoneFrame>
      <div className="login">
        <div className="pantalla-contenido entrada" style={{ justifyContent: 'center', gap: 18 }}>
          <div className="chip-icono grande" style={{ margin: '0 auto' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
          </div>
          <h2 style={{ fontSize: 21, textAlign: 'center', margin: '14px 0 4px' }}>Para guardar tu progreso</h2>
          <p className="sub" style={{ textAlign: 'center', fontSize: '13.5px', marginBottom: 18 }}>Sin contraseñas que se te olviden — te mandamos un enlace a tu correo.</p>
          <div className="campo">
            <label htmlFor="loginEmail">Tu correo</label>
            <input id="loginEmail" type="email" placeholder="tucorreo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="btn-cta" onClick={continuar}>Enviarme el enlace para entrar</button>
          <div className="login-divider">o</div>
          <button className="btn-google" onClick={continuar}>
            {/* Colores oficiales de la marca de Google — nunca se tematizan, se mantienen tal cual para que el botón sea reconocible */}
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="rgb(66,133,244)" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" /><path fill="rgb(52,168,83)" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.3v3.1C3.3 21.3 7.3 24 12 24z" /><path fill="rgb(251,188,5)" d="M5.4 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4z" /><path fill="rgb(234,67,53)" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l4.1 3.1C6.3 6.9 8.9 4.8 12 4.8z" /></svg>
            Continuar con Google
          </button>
          <p className="login-nota">Al continuar aceptas los Términos y la Privacidad de MargenPro.</p>
        </div>
      </div>
    </PhoneFrame>
  )
}
