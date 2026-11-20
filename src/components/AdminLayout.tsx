import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './AdminLayout.css'

const SECCIONES = [
  { to: '/admin', fin: true, label: 'Resumen', icono: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></> },
  { to: '/admin/ventas', fin: false, label: 'Ventas', icono: <><path d="M3 3h2l2.4 12.2a2 2 0 002 1.8h8.6a2 2 0 002-1.6L21 8H6" /><circle cx="9" cy="21" r="1" /><circle cx="18" cy="21" r="1" /></> },
  { to: '/admin/ganancia', fin: false, label: 'Ganancia real', icono: <path d="M3 17l5-5 4 4 8-9M20 7h-5M20 7v5" /> },
  { to: '/admin/usuarios', fin: false, label: 'Usuarios', icono: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 6.2a3.2 3.2 0 010 6M21 20c0-2.8-1.9-5.1-4.5-5.8" /></> },
  { to: '/admin/uso', fin: false, label: 'Uso', icono: <path d="M3 12h4l2 7 4-14 2 7h6" /> },
  { to: '/admin/negocio', fin: false, label: 'Negocio', icono: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /></> },
  { to: '/admin/ia', fin: false, label: 'IA', icono: <><path d="M12 2l1.8 4.3L18 8l-4.2 1.7L12 14l-1.8-4.3L6 8l4.2-1.7L12 2z" /><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" /></> },
  { to: '/admin/errores', fin: false, label: 'Errores', icono: <><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /><path d="M12 9v4M12 17h.01" /></> },
]

export default function AdminLayout() {
  const navigate = useNavigate()

  async function salir() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-marca">
          <img className="admin-mark" src="/isotipo.svg" alt="" />
          <div>
            <div className="admin-marca-nombre">MargenPro</div>
            <div className="admin-marca-sub">Panel de administración</div>
          </div>
        </div>
        <nav className="admin-nav">
          {SECCIONES.map((s) => (
            <NavLink key={s.to} to={s.to} end={s.fin} className={({ isActive }) => `admin-nav-item${isActive ? ' activo' : ''}`}>
              <svg className="admin-nav-icono" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{s.icono}</svg>
              {s.label}
            </NavLink>
          ))}
        </nav>
        <button className="admin-salir" onClick={salir}>Cerrar sesión</button>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
