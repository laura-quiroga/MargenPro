import { supabase } from './supabaseClient'

export type NombreEvento = 'sesion_iniciada' | 'receta_creada' | 'cotizacion_creada' | 'insumo_agregado' | 'factura_escaneada'

const CLAVE_SESION_HOY = 'margenpro_sesion_iniciada_fecha'

/** Deja constancia en event_log de una acción núcleo real — alimenta la sección "Uso" del panel
 * de administración. Nunca bloquea la acción del usuario si falla (fire-and-forget). */
export async function logEvent(evento: NombreEvento, metadata?: Record<string, unknown>): Promise<void> {
  const { data } = await supabase.auth.getUser()
  const usuario = data.user
  if (!usuario) return
  await supabase.from('event_log').insert({ user_id: usuario.id, evento, metadata: metadata ?? null })
}

/** Registra "sesion_iniciada" una sola vez por día por usuario (dedupe local, igual al patrón
 * de docs/sistema/36-ANALITICA-Y-EVENTOS.md), para no inflar el conteo con cada recarga. */
export function logSesionIniciadaSiCorresponde(): void {
  const hoy = new Date().toISOString().slice(0, 10)
  if (localStorage.getItem(CLAVE_SESION_HOY) === hoy) return
  localStorage.setItem(CLAVE_SESION_HOY, hoy)
  void logEvent('sesion_iniciada')
}
