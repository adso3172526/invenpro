// ════════════════════════════════════════════════════════════════════════
//  CONTRATO · IProveedorFactura   (capa de Abstracción)
//  Módulo Facturación · Taller POO + SOLID · ADSO Ficha 3172526
// ────────────────────────────────────────────────────────────────────────
//  "Interface" simulada del patrón Estrategia: define CÓMO se emite una
//  factura. Cada proveedor concreto la implementa a su manera.
//  Principios: Abstracción · ISP (contrato pequeño: solo emitir()).
//  Se carga antes que ProveedorInterno / ProveedorDIAN (heredan de este).
// ════════════════════════════════════════════════════════════════════════
(function () {
  "use strict";

  class IProveedorFactura {
    async emitir(factura) {
      throw new Error("IProveedorFactura.emitir() debe ser implementado por una subclase");
    }
  }

  window.IProveedorFactura = IProveedorFactura;
})();
