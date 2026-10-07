// ════════════════════════════════════════════════════════════════════════
//  ESTRATEGIA · PorCajeroStrategy   (capa de agrupación)
//  Módulo Resumen Diario · Taller POO + SOLID · ADSO Ficha 3172526
// ────────────────────────────────────────────────────────────────────────
//  Agrupa las facturas del día por cajero y suma su total. Solo recibe las
//  facturas de HOY (el recorte lo hace el servicio), así que NO es acumulado.
//  Demuestra OCP + Polimorfismo: agregar PorHoraStrategy o PorMetodoStrategy
//  NO obliga a modificar esta clase ni el servicio; solo se crea otra.
//  Principios: Polimorfismo · OCP · Herencia/LSP.
//  Depende de IResumenStrategy (cargar después de su contrato).
// ════════════════════════════════════════════════════════════════════════
(function () {
  "use strict";

  const { IResumenStrategy } = window;

  class PorCajeroStrategy extends IResumenStrategy {
    agrupar(facturas) {
      const porCajero = {};
      for (const f of facturas) {
        const nombre = f.cajero || "—";
        if (!porCajero[nombre]) porCajero[nombre] = { nombre, total: 0, transacciones: 0 };
        porCajero[nombre].total += f.total || 0;
        porCajero[nombre].transacciones += 1;
      }
      // De mayor a menor venta del día
      return Object.values(porCajero).sort((a, b) => b.total - a.total);
    }
  }

  window.PorCajeroStrategy = PorCajeroStrategy;
})();
