import { useEffect, useState } from 'react'

export type TamanoTexto = 'normal' | 'grande' | 'extra'

const CLAVE = 'mp_tamano_texto'
const ORDEN: TamanoTexto[] = ['normal', 'grande', 'extra']

/** Escala uniforme de TODA la interfaz (texto, íconos, espaciados) — no solo la letra. Al
 * escalar todo junto, el diseño nunca se rompe ni se ve "raro": se ve exactamente igual, más
 * grande, como el zoom nativo del navegador. */
const ZOOM_POR_TAMANO: Record<TamanoTexto, string> = { normal: '1', grande: '1.15', extra: '1.3' }

export const NOMBRE_TAMANO: Record<TamanoTexto, string> = { normal: 'Normal', grande: 'Grande', extra: 'Muy grande' }

function leerTamanoGuardado(): TamanoTexto {
  const guardado = typeof localStorage !== 'undefined' ? localStorage.getItem(CLAVE) : null
  return guardado === 'grande' || guardado === 'extra' ? guardado : 'normal'
}

/** Preferencia del DISPOSITIVO (como el modo oscuro), no del negocio — vive en localStorage,
 * no en Supabase, y se comparte entre todas las pantallas (landing, onboarding, login, la app). */
export function useTamanoTexto() {
  const [tamano, setTamano] = useState<TamanoTexto>(leerTamanoGuardado)

  useEffect(() => {
    document.body.style.zoom = ZOOM_POR_TAMANO[tamano]
    localStorage.setItem(CLAVE, tamano)
  }, [tamano])

  function siguienteTamano() {
    setTamano((actual) => ORDEN[(ORDEN.indexOf(actual) + 1) % ORDEN.length])
  }

  return { tamano, elegirTamano: setTamano, siguienteTamano }
}
