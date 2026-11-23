/** Enlaces de pago reales de Hotmart para cada plan de MargenPro — públicos, no son secretos
 * (cualquiera los puede ver con solo entrar a la página de ventas y elegir "Ir al carrito").
 * Si algún día cambian (nuevo producto, nueva oferta), solo hay que actualizarlos aquí. */
export const ENLACE_PAGO_MENSUAL = 'https://pay.hotmart.com/W108606053T?off=xya1906q'
export const ENLACE_PAGO_ANUAL = 'https://pay.hotmart.com/W108606053T?off=qmle1zp9'

const CLAVE_INTENTO_COMPRA = 'mp_intento_compra'

/** El usuario eligió un plan en el Paywall y va camino a crear su cuenta (Login) — se guarda la
 * intención para, justo después de que inicie sesión, mandarlo a pagar ese plan en Hotmart con
 * el MISMO correo (así el webhook de Hotmart lo puede encontrar cuando pague). */
export function guardarIntentoDeCompra(plan: 'mensual' | 'anual'): void {
  localStorage.setItem(CLAVE_INTENTO_COMPRA, plan)
}

export function leerIntentoDeCompra(): 'mensual' | 'anual' | null {
  const valor = localStorage.getItem(CLAVE_INTENTO_COMPRA)
  return valor === 'mensual' || valor === 'anual' ? valor : null
}

export function borrarIntentoDeCompra(): void {
  localStorage.removeItem(CLAVE_INTENTO_COMPRA)
}

export function enlacePagoPara(plan: 'mensual' | 'anual'): string {
  return plan === 'anual' ? ENLACE_PAGO_ANUAL : ENLACE_PAGO_MENSUAL
}
