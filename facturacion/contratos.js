// ════════════════════════════════════════════════════════════════════════
//  MÓDULO FACTURACIÓN · CAPA DE ABSTRACCIÓN (contratos / "interfaces")
//  Taller POO + SOLID · ADSO Ficha 3172526
// ────────────────────────────────────────────────────────────────────────
//  JavaScript no tiene `interface` como Java o C#. La forma idiomática de
//  simular un contrato es una CLASE ABSTRACTA cuyos métodos lanzan Error:
//  obligan a las clases hijas a implementarlos.
//
//  Principios: Abstracción (contratos puros) · ISP (contratos pequeños y
//  específicos, una sola misión cada uno).
//
//  Se carga PRIMERO del módulo (después de data.js): los demás archivos
//  heredan de estos contratos, así que deben existir antes.
// ════════════════════════════════════════════════════════════════════════
(function () {
  "use strict";

  /**
   * Contrato de PERSISTENCIA de facturas: guardar y descontar stock.
   */
  class IFacturaRepositorio {
    async guardar(factura, items) {
      throw new Error("IFacturaRepositorio.guardar() debe ser implementado por una subclase");
    }
    async descontarStock(items) {
      throw new Error("IFacturaRepositorio.descontarStock() debe ser implementado por una subclase");
    }
  }

  /**
   * Contrato de EMISIÓN de facturas (patrón Estrategia).
   */
  class IProveedorFactura {
    async emitir(factura) {
      throw new Error("IProveedorFactura.emitir() debe ser implementado por una subclase");
    }
  }

  // Se exponen en window porque, sin bundler ni módulos ES, es la forma de
  // compartir los contratos con los otros archivos del módulo.
  Object.assign(window, { IFacturaRepositorio, IProveedorFactura });
})();
