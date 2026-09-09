// ════════════════════════════════════════════════════════════════════════
//  RAÍZ DE COMPOSICIÓN (Composition Root)   — no es una clase
//  Módulo Facturación · Taller POO + SOLID · ADSO Ficha 3172526
// ────────────────────────────────────────────────────────────────────────
//  El ÚNICO lugar del módulo donde se hace `new`: arma las implementaciones
//  concretas y las INYECTA en el servicio. Cambiar de proveedor o de
//  repositorio = cambiar UNA línea aquí (DIP + OCP en acción).
//  Sobrescribe window.DB.facturas (creado en data.js) con la versión POO/SOLID.
//  Se carga ÚLTIMO: necesita todas las clases anteriores y a data.js.
// ════════════════════════════════════════════════════════════════════════
(function () {
  "use strict";

  const { FacturacionService, SupabaseFacturaRepositorio, ProveedorInterno } = window;

  if (window.DB) {
    window.DB.facturas = new FacturacionService(
      new SupabaseFacturaRepositorio(),   // cómo se guarda
      new ProveedorInterno()              // cómo se emite
    );
  } else {
    console.error("[facturacion] window.DB no existe; ¿se cargó data.js antes?");
  }
})();
