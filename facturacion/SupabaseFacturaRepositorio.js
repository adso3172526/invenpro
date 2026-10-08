// ════════════════════════════════════════════════════════════════════════
//  REPOSITORIO · SupabaseFacturaRepositorio   (capa de acceso a datos)
//  Módulo Facturación · Taller POO + SOLID · ADSO Ficha 3172526
// ────────────────────────────────────────────────────────────────────────
//  Única clase del módulo que conoce Supabase (window.db). Aísla toda la
//  persistencia: guardar la factura + sus ítems y descontar el stock.
//  Principios: Herencia (extends IFacturaRepositorio) · LSP · SRP (solo datos).
//  Depende de IFacturaRepositorio (debe cargarse después de su contrato).
// ════════════════════════════════════════════════════════════════════════
(function () {
  "use strict";

  const { IFacturaRepositorio } = window; // contrato compartido vía window

  class SupabaseFacturaRepositorio extends IFacturaRepositorio {
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

    async descontarStock(items) {
      for (const it of items) {
        await window.db.rpc("decrement_stock", { p_sku: it.sku, p_qty: it.q });
      }
    }
  }

  window.SupabaseFacturaRepositorio = SupabaseFacturaRepositorio;
})();
