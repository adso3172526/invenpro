// ════════════════════════════════════════════════════════════════════════
//  MÓDULO FACTURACIÓN · CAPA DE ESTRATEGIAS (proveedores de emisión)
// ────────────────────────────────────────────────────────────────────────
//  Cada proveedor implementa `emitir()` a su manera. El servicio recibe UNA
//  estrategia y la usa sin saber cuál es (polimorfismo).
//
//  Principios: Polimorfismo (mismo método, distinto comportamiento) · OCP
//  (agregar un proveedor nuevo = crear una clase aquí, sin tocar las otras) ·
//  Herencia/LSP (ambas extends IProveedorFactura).
//
//  Se carga después de contratos.js (necesita IProveedorFactura).
// ════════════════════════════════════════════════════════════════════════
(function () {
  "use strict";

  const { IProveedorFactura } = window;

  /** Facturación INTERNA: la venta solo se registra (comportamiento actual). */
  class ProveedorInterno extends IProveedorFactura {
    async emitir(factura) {
      return { estado: "EMITIDA_INTERNA", folio: factura.id, cufe: null };
    }
  }

  /**
   * Facturación electrónica ante la DIAN (SIMULADA). Placeholder para una
   * integración real futura. Demuestra que agregar un proveedor nuevo no
   * obliga a tocar los existentes ni el servicio (OCP).
   */
  class ProveedorDIAN extends IProveedorFactura {
    async emitir(factura) {
      const cufeSimulado = "CUFE-SIM-" + factura.id;
      return { estado: "EMITIDA_DIAN", folio: factura.id, cufe: cufeSimulado };
    }
  }

  Object.assign(window, { ProveedorInterno, ProveedorDIAN });
})();
