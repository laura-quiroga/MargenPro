/** Genera la imagen de la cotización (tarjeta con logo, negocio, cliente, producto y
 * total) para compartir fuera de la app — colores y tipografías leídos de los mismos
 * tokens CSS de globals.css, así respeta claro/oscuro sin valores quemados. */

export interface DatosCotizacionImagen {
  logo: string | null
  nombreNegocio: string
  cliente: string
  producto: string
  precioPorUnidadTexto: string | null
  totalTexto: string
  mensajeVenta: string
  fechaTexto: string
}

function leerToken(nombre: string, porDefecto: string): string {
  const valor = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim()
  return valor || porDefecto
}

function trazarRectRedondeado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function envolverTexto(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number, anchoMax: number, alturaLinea: number) {
  const palabras = texto.split(' ')
  let linea = ''
  let yActual = y
  for (const palabra of palabras) {
    const pruebaLinea = linea ? `${linea} ${palabra}` : palabra
    if (ctx.measureText(pruebaLinea).width > anchoMax && linea) {
      ctx.fillText(linea, x, yActual)
      linea = palabra
      yActual += alturaLinea
    } else {
      linea = pruebaLinea
    }
  }
  if (linea) ctx.fillText(linea, x, yActual)
  return yActual
}

export async function generarImagenCotizacion(datos: DatosCotizacionImagen): Promise<Blob | null> {
  const ancho = 640
  const alto = datos.precioPorUnidadTexto ? 900 : 830
  const canvas = document.createElement('canvas')
  canvas.width = ancho
  canvas.height = alto
  const contexto = canvas.getContext('2d')
  if (!contexto) return null
  const ctx: CanvasRenderingContext2D = contexto

  const bg = leerToken('--bg', '#FAFAF6')
  const surface = leerToken('--surface', '#FFFFFF')
  const textoFuerte = leerToken('--text-1', '#2B2A26')
  const textoSuave = leerToken('--text-2', '#716C5F')
  const acento = leerToken('--accent', '#185062')
  const sunken = leerToken('--sunken', '#F0EFE9')
  const fuenteDisplay = leerToken('--font-display', "'Fraunces', Georgia, serif")
  const fuenteBody = leerToken('--font-body', "'Manrope', sans-serif")

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, ancho, alto)

  const margen = 40
  trazarRectRedondeado(ctx, margen, margen, ancho - margen * 2, alto - margen * 2, 28)
  ctx.fillStyle = surface
  ctx.shadowColor = 'rgba(0,0,0,0.12)'
  ctx.shadowBlur = 30
  ctx.shadowOffsetY = 12
  ctx.fill()
  ctx.shadowColor = 'transparent'

  let y = margen + 76

  try {
    const img = await cargarImagen(datos.logo || '/isotipo.svg')
    const tam = datos.logo ? 96 : 68
    if (datos.logo) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(ancho / 2, y, tam / 2, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(img, ancho / 2 - tam / 2, y - tam / 2, tam, tam)
      ctx.restore()
    } else {
      ctx.drawImage(img, ancho / 2 - tam / 2, y - tam / 2, tam, tam)
    }
  } catch {
    // si el logo no carga (poco probable, es local), seguimos sin él
  }
  y += 66

  ctx.fillStyle = textoFuerte
  ctx.font = `700 30px ${fuenteDisplay}`
  ctx.textAlign = 'center'
  ctx.fillText(datos.nombreNegocio, ancho / 2, y)
  y += 56

  const filaIzq = margen + 44
  const filaDer = ancho - margen - 44

  function fila(label: string, valor: string, resaltado = false) {
    ctx.beginPath()
    ctx.moveTo(filaIzq, y - 30)
    ctx.lineTo(filaDer, y - 30)
    ctx.strokeStyle = sunken
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.textAlign = 'left'
    ctx.fillStyle = textoSuave
    ctx.font = `600 19px ${fuenteBody}`
    ctx.fillText(label, filaIzq, y)

    ctx.textAlign = 'right'
    if (resaltado) {
      ctx.fillStyle = acento
      ctx.font = `700 28px ${fuenteDisplay}`
    } else {
      ctx.fillStyle = textoFuerte
      ctx.font = `700 19px ${fuenteBody}`
    }
    ctx.fillText(valor, filaDer, y)
    y += 48
  }

  fila('Cliente', datos.cliente)
  fila('Producto', datos.producto)
  if (datos.precioPorUnidadTexto) fila('Precio por porción', datos.precioPorUnidadTexto)
  fila('Total', datos.totalTexto, true)

  y += 26
  ctx.fillStyle = acento
  ctx.font = `600 18px ${fuenteBody}`
  ctx.textAlign = 'center'
  y = envolverTexto(ctx, datos.mensajeVenta, ancho / 2, y, ancho - margen * 2 - 90, 26)
  y += 36

  ctx.fillStyle = textoSuave
  ctx.font = `500 15px ${fuenteBody}`
  ctx.fillText(datos.fechaTexto, ancho / 2, y)

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}
