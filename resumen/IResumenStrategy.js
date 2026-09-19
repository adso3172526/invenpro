// ════════════════════════════════════════════════════════════════════════
//  CONTRATO · IResumenStrategy   (capa de Abstracción)
//  Módulo Resumen Diario · Taller POO + SOLID · ADSO Ficha 3172526
// ────────────────────────────────────────────────────────────────────────
//  "Interface" simulada del patrón Estrategia: define CÓMO se agrupa un
//  conjunto de facturas (ya recortado al día). Cada estrategia concreta la
//  implementa a su manera (por cajero, por hora, por método…).
//  Principios: Abstracción · ISP (contrato pequeño: solo agrupar()).
//  Se carga antes que las estrategias concretas (heredan de este).
// ════════════════════════════════════════════════════════════════════════
(function () {
  "use strict";

  class IResumenStrategy {
    /**
     * @param {Array} facturas  facturas YA filtradas al día.
     * @returns {Array} grupos ordenados (p.ej. [{ nombre, total, transacciones }]).
     */
    agrupar(facturas) {
      throw new Error("IResumenStrategy.agrupar() debe ser implementado por una subclase");
    }
  }

  window.IResumenStrategy = IResumenStrategy;
})();
