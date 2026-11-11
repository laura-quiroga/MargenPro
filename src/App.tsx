import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import Paywall from './pages/Paywall'

function Proximamente({ titulo }: { titulo: string }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', textAlign: 'center', padding: '24px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px' }}>{titulo}</h1>
      <p style={{ color: 'var(--text-2)' }}>Esta pantalla se convierte a código real en la próxima sesión.</p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/paywall" element={<Paywall />} />
        <Route path="/login" element={<Proximamente titulo="Entrar" />} />
        <Route path="/app" element={<Proximamente titulo="Tu negocio" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
