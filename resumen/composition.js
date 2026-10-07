// ════════════════════════════════════════════════════════════════════════
//  RAÍZ DE COMPOSICIÓN (Composition Root)   — no es una clase
//  Módulo Resumen Diario · Taller POO + SOLID · ADSO Ficha 3172526
// ────────────────────────────────────────────────────────────────────────
//  Único lugar con `new`: arma el servicio con su estrategia y lo expone.
//  Cambiar o añadir un criterio de agrupación = una línea aquí (DIP + OCP).
//  Uso: window.Resumenes.porCajero.resumen(MOCK.facturas)
//       → { fecha, total, transacciones, grupos:[{nombre,total,transacciones}] }
//  Se carga ÚLTIMO del módulo (necesita las clases anteriores).
// ════════════════════════════════════════════════════════════════════════
(function () {
  "use strict";

  const { ResumenDiarioService, PorCajeroStrategy, PorHoraStrategy } = window;

  window.Resumenes = {
    porCajero: new ResumenDiarioService(new PorCajeroStrategy()),
    porHora:   new ResumenDiarioService(new PorHoraStrategy()),
    // Extensión futura (OCP): agregar sin tocar lo anterior, p.ej.
    // porMetodo: new ResumenDiarioService(new PorMetodoStrategy()),
  };
})();
