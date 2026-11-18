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
import { ErrorBoundary } from './components/ErrorBoundary'
import RequireAdmin from './components/RequireAdmin'
import AdminLayout from './components/AdminLayout'
import AdminResumen from './pages/admin/Resumen'
import AdminVentas from './pages/admin/Ventas'
import AdminGananciaReal from './pages/admin/GananciaReal'
import AdminUsuarios from './pages/admin/Usuarios'
import AdminUso from './pages/admin/Uso'
import AdminNegocio from './pages/admin/Negocio'
import AdminIA from './pages/admin/IA'
import AdminErrores from './pages/admin/Errores'

function App() {
  return (
    <ErrorBoundary>
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
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminResumen />} />
              <Route path="ventas" element={<AdminVentas />} />
              <Route path="ganancia" element={<AdminGananciaReal />} />
              <Route path="usuarios" element={<AdminUsuarios />} />
              <Route path="uso" element={<AdminUso />} />
              <Route path="negocio" element={<AdminNegocio />} />
              <Route path="ia" element={<AdminIA />} />
              <Route path="errores" element={<AdminErrores />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
