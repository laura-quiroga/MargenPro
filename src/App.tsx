import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import Paywall from './pages/Paywall'
import Login from './pages/Login'
import Privacidad from './pages/Privacidad'
import Terminos from './pages/Terminos'
import Reembolsos from './pages/Reembolsos'
import AvisoIA from './pages/AvisoIA'
import ComoCancelar from './pages/ComoCancelar'
import AppLayout from './components/AppLayout'
import { AppStoreProvider } from './lib/appStore'
import Panorama from './pages/app/Panorama'
import Insumos from './pages/app/Insumos'
import Recetas from './pages/app/Recetas'
import Cotizaciones from './pages/app/Cotizaciones'
import Ajustes from './pages/app/Ajustes'
import { ErrorBoundary } from './components/ErrorBoundary'
import OfflineBanner from './components/OfflineBanner'
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
      <OfflineBanner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/paywall" element={<Paywall />} />
          <Route path="/login" element={<Login />} />
          <Route path="/privacidad" element={<Privacidad />} />
          <Route path="/terminos" element={<Terminos />} />
          <Route path="/reembolsos" element={<Reembolsos />} />
          <Route path="/aviso-ia" element={<AvisoIA />} />
          <Route path="/como-cancelar" element={<ComoCancelar />} />
          <Route path="/app" element={<AppStoreProvider><AppLayout /></AppStoreProvider>}>
            <Route index element={<ErrorBoundary variante="seccion" pantalla="/app"><Panorama /></ErrorBoundary>} />
            <Route path="insumos" element={<ErrorBoundary variante="seccion" pantalla="/app/insumos"><Insumos /></ErrorBoundary>} />
            <Route path="recetas" element={<ErrorBoundary variante="seccion" pantalla="/app/recetas"><Recetas /></ErrorBoundary>} />
            <Route path="cotiza" element={<ErrorBoundary variante="seccion" pantalla="/app/cotiza"><Cotizaciones /></ErrorBoundary>} />
            <Route path="ajustes" element={<ErrorBoundary variante="seccion" pantalla="/app/ajustes"><Ajustes /></ErrorBoundary>} />
          </Route>
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<ErrorBoundary variante="seccion" pantalla="/admin"><AdminResumen /></ErrorBoundary>} />
              <Route path="ventas" element={<ErrorBoundary variante="seccion" pantalla="/admin/ventas"><AdminVentas /></ErrorBoundary>} />
              <Route path="ganancia" element={<ErrorBoundary variante="seccion" pantalla="/admin/ganancia"><AdminGananciaReal /></ErrorBoundary>} />
              <Route path="usuarios" element={<ErrorBoundary variante="seccion" pantalla="/admin/usuarios"><AdminUsuarios /></ErrorBoundary>} />
              <Route path="uso" element={<ErrorBoundary variante="seccion" pantalla="/admin/uso"><AdminUso /></ErrorBoundary>} />
              <Route path="negocio" element={<ErrorBoundary variante="seccion" pantalla="/admin/negocio"><AdminNegocio /></ErrorBoundary>} />
              <Route path="ia" element={<ErrorBoundary variante="seccion" pantalla="/admin/ia"><AdminIA /></ErrorBoundary>} />
              <Route path="errores" element={<ErrorBoundary variante="seccion" pantalla="/admin/errores"><AdminErrores /></ErrorBoundary>} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
