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
import Cotizaciones from './pages/app/Cotizaciones'
import Ajustes from './pages/app/Ajustes'

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
          <Route path="cotiza" element={<Cotizaciones />} />
          <Route path="ajustes" element={<Ajustes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
