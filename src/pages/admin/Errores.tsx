import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

interface FilaError { id: string; mensaje: string; pantalla: string | null; created_at: string; user_id: string | null }

export default function AdminErrores() {
  const [filas, setFilas] = useState<FilaError[] | null>(null)

  useEffect(() => {
    let activo = true
    supabase.from('error_log').select('*').order('created_at', { ascending: false }).limit(100).then(({ data }) => {
      if (!activo) return
      setFilas((data as FilaError[] | null) ?? [])
    })
    return () => { activo = false }
  }, [])

  return (
    <div>
      <h1 className="admin-titulo">Errores</h1>
      <p className="admin-subtitulo">Lo que falló de verdad en la app, con fecha y pantalla.</p>

      {filas && filas.length === 0 ? (
        <div className="admin-seccion">
          <div className="admin-sin-datos-bloque">
            <strong>Sin errores registrados</strong>
            Cuando algo falle en la app (el Error Boundary global lo captura), aparecerá acá con
            su mensaje, la pantalla y la fecha.
          </div>
        </div>
      ) : (
        <div className="admin-seccion">
          <h3>Últimos errores</h3>
          <table className="admin-tabla">
            <thead><tr><th>Fecha</th><th>Pantalla</th><th>Mensaje</th></tr></thead>
            <tbody>
              {(filas ?? []).map((f) => (
                <tr key={f.id}>
                  <td>{new Date(f.created_at).toLocaleString('es-CO')}</td>
                  <td>{f.pantalla ?? '—'}</td>
                  <td>{f.mensaje}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
