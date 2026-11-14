import { supabase } from '../supabaseClient'

export interface ItemFactura {
  texto_original: string
  producto: string
  cantidad: number
  medida: 'kg' | 'g' | 'L' | 'ml' | 'libra' | 'unidad' | 'docena' | 'paquete'
  precio: number
  confianza: number
}

interface ResultadoEscaneo {
  items: ItemFactura[] | null
  error: string | null
}

/** Llama a la Edge Function que ya procesó/guardó la factura (sube la foto primero con
 * subirFotoFactura + crearFacturaEscaneada) y devuelve los ítems detectados. */
export async function escanearFactura(facturaId: string): Promise<ResultadoEscaneo> {
  const { data, error } = await supabase.functions.invoke('escanear-factura', { body: { facturaId } })
  if (error) {
    const mensaje = (data as { error?: string } | null)?.error || 'No pudimos procesar la factura. Intenta de nuevo.'
    return { items: null, error: mensaje }
  }
  return { items: (data as { items: ItemFactura[] }).items, error: null }
}

/** Sube la foto al bucket privado, en la carpeta del usuario, y devuelve su ruta. */
export async function subirFotoFactura(archivo: File, userId: string): Promise<string | null> {
  const extension = archivo.name.split('.').pop()?.toLowerCase() || 'jpg'
  const ruta = `${userId}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from('facturas-temporales').upload(ruta, archivo)
  if (error) return null
  return ruta
}

/** Crea la fila de la factura (estado 'procesando') antes de invocar la Edge Function. */
export async function crearFacturaEscaneada(imagenPath: string): Promise<string | null> {
  const { data: userData } = await supabase.auth.getUser()
  const usuario = userData.user
  if (!usuario) return null
  const { data, error } = await supabase.from('facturas_escaneadas').insert({
    user_id: usuario.id, imagen_path: imagenPath, estado: 'procesando',
  }).select().single()
  if (error || !data) return null
  return data.id as string
}
