// ════════════════════════════════════════════════════════════════════════
//  MÓDULO FACTURACIÓN · CAPA DE REPOSITORIO (acceso a datos · Supabase)
// ────────────────────────────────────────────────────────────────────────
//  El ÚNICO lugar del módulo que conoce Supabase (window.db). Aísla toda la
//  "plomería" de acceso a datos: si se migra de base de datos, solo cambia
//  esta clase; el servicio queda intacto.
//
//  Principios: Herencia (extends IFacturaRepositorio) · LSP (reemplaza a su
//  contrato sin romper al servicio) · SRP (su única misión es la BD).
//
//  Se carga después de contratos.js (necesita IFacturaRepositorio).
// ════════════════════════════════════════════════════════════════════════
(function () {
  "use strict";

  // El contrato se comparte por window (cargado en contratos.js).
  const { IFacturaRepositorio } = window;

  class SupabaseFacturaRepositorio extends IFacturaRepositorio {
    /** Persiste el encabezado en `facturas` y las líneas en `factura_items`. */
    async guardar(factura, items) {
      const { error: fErr } = await window.db.from("facturas").insert({
        id: factura.id, fecha: factura.fecha, hora: factura.hora,
        cajero: factura.cajero, metodo: factura.metodo, total: factura.total,
      });
      if (fErr) console.error("createFactura header:", fErr);

      const rows = items.map((it) => ({
        factura_id: factura.id, sku: it.sku, nombre: it.nombre, q: it.q, precio: it.precio,
      }));
      const { error: iErr } = await window.db.from("factura_items").insert(rows);
      if (iErr) console.error("createFactura items:", iErr);
    }

    /** Descuenta el stock vendido con el RPC `decrement_stock` por ítem. */
    async descontarStock(items) {
      for (const it of items) {
        await window.db.rpc("decrement_stock", { p_sku: it.sku, p_qty: it.q });
      }
    }
  }

  window.SupabaseFacturaRepositorio = SupabaseFacturaRepositorio;
})();
