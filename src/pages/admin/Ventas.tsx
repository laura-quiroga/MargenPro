export default function AdminVentas() {
  return (
    <div>
      <h1 className="admin-titulo">Ventas</h1>
      <p className="admin-subtitulo">Ingresos, compras, cancelaciones, churn y MRR.</p>
      <div className="admin-seccion">
        <div className="admin-sin-datos-bloque">
          <strong>Sin datos — aún no conectaste Hotmart</strong>
          Esta pantalla se llena sola en cuanto conectes el webhook de pago de Hotmart (ver
          docs/sistema/18-VENTA-HOTMART.md): ahí aparecerán tus ingresos reales, compras,
          cancelaciones y la separación entre churn voluntario e involuntario.
        </div>
      </div>
    </div>
  )
}
