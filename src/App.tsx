import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import Paywall from './pages/Paywall'
import Login from './pages/Login'
import AppLayout from './components/AppLayout'
import { AppStoreProvider } from './lib/appStore'
import Panorama from './pages/app/Panorama'
import Insumos from './pages/app/Insumos'
import Recetas from './pages/app/Recetas'

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
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<AppStoreProvider><AppLayout /></AppStoreProvider>}>
          <Route index element={<Panorama />} />
          <Route path="insumos" element={<Insumos />} />
          <Route path="recetas" element={<Recetas />} />
          <Route path="cotiza" element={<Proximamente titulo="Cotizaciones" />} />
          <Route path="ajustes" element={<Proximamente titulo="Ajustes" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
