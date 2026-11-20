import PaginaLegal from '../components/PaginaLegal'

export default function ComoCancelar() {
  return (
    <PaginaLegal titulo="Cómo cancelar tu suscripción" actualizado="20 de noviembre de 2026" hijoActual="Cómo cancelar">
      <p>
        Cancelar tu suscripción a MargenPro es tan fácil como contratarla. No necesitas escribirnos
        ni pedir permiso — lo haces tú mismo, cuando quieras, directamente desde tu cuenta de pago.
      </p>

      <h2>Pasos para cancelar</h2>
      <ul>
        <li>Entra a <strong>hotmart.com</strong> con el correo que usaste para comprar.</li>
        <li>Ve a la sección de <strong>tus compras / tu área de miembro</strong>.</li>
        <li>Busca <strong>MargenPro</strong> en tu lista de suscripciones activas.</li>
        <li>Elige <strong>cancelar suscripción</strong> y confirma.</li>
      </ul>
      <p>
        Al cancelar, dejas de pagar desde tu próxima fecha de renovación — sigues teniendo acceso a
        MargenPro hasta el final del período que ya pagaste. Si quieres además que borremos tu
        cuenta y tus datos, hazlo desde <strong>Ajustes → Eliminar mi cuenta</strong> dentro de la app.
      </p>

      <h2>¿Pediste un reembolso en vez de cancelar?</h2>
      <p>
        Revisa nuestra <a href="/reembolsos">Política de Reembolsos</a> — tienes 14 días desde tu
        primer cobro para pedir que te devolvamos el dinero si tu primer precio costeado todavía no
        te quedó claro.
      </p>

      <h2>¿Algo no te deja cancelar?</h2>
      <p>
        Escríbenos a <strong>soporte@margenpro.app</strong> contándonos qué pasó y te ayudamos
        directamente.
      </p>
    </PaginaLegal>
  )
}
