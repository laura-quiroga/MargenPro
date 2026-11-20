import PaginaLegal from '../components/PaginaLegal'

export default function AvisoIA() {
  return (
    <PaginaLegal titulo="Aviso de uso de Inteligencia Artificial" actualizado="20 de noviembre de 2026" hijoActual="Aviso de uso de IA">
      <div className="legal-aviso">
        ⚠️ <strong>Lo más importante:</strong> lo que la inteligencia artificial detecta en tus
        facturas es <strong>orientación automática, no un dato garantizado</strong>. Puede
        equivocarse. Tú decides, bajo tu propia responsabilidad, si confirmas o corriges lo que
        encontró.
      </div>

      <h2>1. Dónde usamos IA en MargenPro</h2>
      <p>
        MargenPro usa inteligencia artificial en un solo lugar: el <strong>escaneo de facturas</strong>.
        Cuando le tomas una foto a una factura, la enviamos a un modelo de inteligencia artificial
        (Claude, de Anthropic) para que lea el texto de la imagen y nos diga qué productos, cantidades
        y precios encontró.
      </p>

      <h2>2. Puede equivocarse</h2>
      <p>
        Como cualquier sistema de lectura automática, la IA puede leer mal un número borroso,
        confundir una unidad de medida, o no reconocer un producto escrito a mano con letra difícil.
        Por eso, <strong>MargenPro siempre te muestra lo que detectó antes de guardarlo</strong> —
        nunca actualiza tus precios o tu inventario sin que tú lo confirmes.
      </p>

      <h2>3. No es un consejo profesional</h2>
      <p>
        Nada de lo que la IA extrae o calcula dentro de MargenPro sustituye el consejo de un
        contador, abogado o asesor financiero. Los precios sugeridos son un cálculo basado en los
        datos que TÚ registraste — la decisión final de cuánto cobrar siempre es tuya.
      </p>

      <h2>4. Tus datos y la IA</h2>
      <p>
        El contenido de tus facturas se envía a un proveedor externo (Anthropic, con sede en
        EE. UU.) únicamente para ese procesamiento puntual. Puedes leer más sobre cómo tratamos
        esos datos en nuestra <a href="/privacidad">Política de Privacidad</a>, sección 4.
      </p>

      <h2>5. Contacto</h2>
      <p>¿Preguntas sobre cómo usamos la IA? Escríbenos a <strong>soporte@margenpro.app</strong>.</p>
    </PaginaLegal>
  )
}
