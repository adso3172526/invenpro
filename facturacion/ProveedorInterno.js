// ════════════════════════════════════════════════════════════════════════
//  ESTRATEGIA · ProveedorInterno   (capa de emisión)
//  Módulo Facturación · Taller POO + SOLID · ADSO Ficha 3172526
// ────────────────────────────────────────────────────────────────────────
//  Facturación INTERNA: la venta solo se registra (comportamiento actual).
//  Principios: Polimorfismo (implementa emitir() a su manera) · Herencia/LSP.
//  Depende de IProveedorFactura (cargar después de su contrato).
// ════════════════════════════════════════════════════════════════════════
(function () {
  "use strict";

  const { IProveedorFactura } = window;

  class ProveedorInterno extends IProveedorFactura {
    async emitir(factura) {
      return { estado: "EMITIDA_INTERNA", folio: factura.id, cufe: null };
    }
  }

  window.ProveedorInterno = ProveedorInterno;
})();
