import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import '../pages/Legal.css'

const PAGINAS_LEGALES = [
  { to: '/privacidad', label: 'Privacidad' },
  { to: '/terminos', label: 'Términos y Condiciones' },
  { to: '/reembolsos', label: 'Reembolsos' },
  { to: '/aviso-ia', label: 'Aviso de uso de IA' },
  { to: '/como-cancelar', label: 'Cómo cancelar' },
]

/** Envoltorio compartido por todas las páginas legales — mismo encabezado, misma tipografía,
 * y un pie con enlaces cruzados a las demás (para que nunca quede una aislada sin cómo llegar
 * a las otras). No usa PhoneFrame: estas son documentos de ancho completo, no mockups de app. */
export default function PaginaLegal({ titulo, actualizado, hijoActual, children }: { titulo: string; actualizado: string; hijoActual: string; children: ReactNode }) {
  return (
    <div className="legal-page">
      <div className="legal-top">
        <Link to="/">← Volver a MargenPro</Link>
      </div>
      <div className="legal-wrap">
        <h1>{titulo}</h1>
        <p className="legal-meta">Última actualización: {actualizado}</p>
        {children}
        <div className="legal-nav-otras">
          {PAGINAS_LEGALES.filter((p) => p.label !== hijoActual).map((p) => (
            <Link key={p.to} to={p.to}>{p.label}</Link>
          ))}
        </div>
      </div>
    </div>
  )
}
