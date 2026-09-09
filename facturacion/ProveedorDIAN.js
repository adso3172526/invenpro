// ════════════════════════════════════════════════════════════════════════
//  ESTRATEGIA · ProveedorDIAN   (capa de emisión)
//  Módulo Facturación · Taller POO + SOLID · ADSO Ficha 3172526
// ────────────────────────────────────────────────────────────────────────
//  Facturación electrónica ante la DIAN (SIMULADA). Placeholder de una
//  integración real futura. Demuestra OCP: agregar este proveedor NO obligó
//  a modificar ProveedorInterno ni el servicio; solo se creó esta clase.
//  Principios: Polimorfismo · OCP · Herencia/LSP.
//  Depende de IProveedorFactura (cargar después de su contrato).
// ════════════════════════════════════════════════════════════════════════
(function () {
  "use strict";

  const { IProveedorFactura } = window;

  class ProveedorDIAN extends IProveedorFactura {
    async emitir(factura) {
      // Aquí iría la llamada real al operador tecnológico / API de la DIAN.
      const cufeSimulado = "CUFE-SIM-" + factura.id;
      return { estado: "EMITIDA_DIAN", folio: factura.id, cufe: cufeSimulado };
    }
  }

  window.ProveedorDIAN = ProveedorDIAN;
})();
