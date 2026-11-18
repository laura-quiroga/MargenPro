import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './AdminLayout.css'

const SECCIONES = [
  { to: '/admin', fin: true, label: 'Resumen' },
  { to: '/admin/ventas', fin: false, label: 'Ventas' },
  { to: '/admin/ganancia', fin: false, label: 'Ganancia real' },
  { to: '/admin/usuarios', fin: false, label: 'Usuarios' },
  { to: '/admin/uso', fin: false, label: 'Uso' },
  { to: '/admin/negocio', fin: false, label: 'Negocio' },
  { to: '/admin/ia', fin: false, label: 'IA' },
  { to: '/admin/errores', fin: false, label: 'Errores' },
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
