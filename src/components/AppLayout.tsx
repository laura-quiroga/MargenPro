import { NavLink, Outlet } from 'react-router-dom'
import { useTemaOscuro } from './PhoneFrame'
import './AppLayout.css'

const TABS = [
  { to: '/app', fin: true, label: 'Panorama', icono: <><path d="M3 10.5L12 3l9 7.5" /><path d="M5 9.5V21h5v-6h4v6h5V9.5" /></> },
  { to: '/app/insumos', fin: false, label: 'Insumos', icono: <><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></> },
  { to: '/app/recetas', fin: false, label: 'Recetas', icono: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></> },
  { to: '/app/cotiza', fin: false, label: 'Cotiza', icono: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /> },
  { to: '/app/ajustes', fin: false, label: 'Ajustes', icono: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 008.6 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H2a2 2 0 010-4h.09A1.65 1.65 0 003.6 8.6a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H8a1.65 1.65 0 001-1.51V2a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V8a1.65 1.65 0 001.51 1H22a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></> },
]

export default function AppLayout() {
  const { oscuro, alternar } = useTemaOscuro()

  return (
    <div className="app-interna">
      <div className="app-frame">
        <div className="topbar">
          <div className="logo"><img className="mark" src="/isotipo.svg" alt="MargenPro" /> MargenPro</div>
          <button className="tema-toggle" aria-label="Cambiar tema" onClick={alternar}>
            {oscuro ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.5 14.5a8.5 8.5 0 11-9-13 7 7 0 009 13z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
            )}
          </button>
        </div>

        <section className="seccion activa">
          <div className="entrada">
            <Outlet />
          </div>
        </section>
      </div>

      <div className="tabbar">
        <div className="tabbar-inner">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.fin} className={({ isActive }) => `tab-btn${isActive ? ' activo' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{t.icono}</svg>
              <span>{t.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}
