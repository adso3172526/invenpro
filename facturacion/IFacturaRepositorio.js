// ════════════════════════════════════════════════════════════════════════
//  CONTRATO · IFacturaRepositorio   (capa de Abstracción)
//  Módulo Facturación · Taller POO + SOLID · ADSO Ficha 3172526
// ────────────────────────────────────────────────────────────────────────
//  "Interface" simulada: clase abstracta cuyos métodos lanzan Error para
//  obligar a las subclases a implementarlos (JS no tiene `interface` nativo).
//  Principios: Abstracción · ISP (contrato pequeño y específico: persistencia).
//  Se carga antes que SupabaseFacturaRepositorio (que hereda de este).
// ════════════════════════════════════════════════════════════════════════
(function () {
  "use strict";

  class IFacturaRepositorio {
    async guardar(factura, items) {
      throw new Error("IFacturaRepositorio.guardar() debe ser implementado por una subclase");
    }
    async descontarStock(items) {
      throw new Error("IFacturaRepositorio.descontarStock() debe ser implementado por una subclase");
    }
  }

  window.IFacturaRepositorio = IFacturaRepositorio;
})();
