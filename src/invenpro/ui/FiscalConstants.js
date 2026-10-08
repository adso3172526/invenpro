(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var MOCK_QR_DIAN = {
    proveedor: "Distribuidora El Sol", nit: "900.124.567-8", factura: "FE-2026-001284",
    cufe: "8b3f9c2e1a7d4f6e9c2a8b3f...", fecha: "2026-05-22 10:42",
    vendedor: "Carlos Perez", celular: "300 123 4567",
    items: [
      { sku: "7702001", nombre: "Leche entera 1L",  qty: 48, costo: 3200, vence: "2026-06-18", encontrado: true },
      { sku: "7720001", nombre: "Arroz blanco 1kg", qty: 30, costo: 3700, vence: "2027-04-15", encontrado: true },
    ],
  };
  var MOCK_OCR_IA = {
    proveedor: "Lacteos del Valle", nit: "830.998.221-2", factura: "LV-8821",
    fecha: "2026-05-22 11:15", vendedor: "Maria Gonzalez", celular: "320 555 7788",
    items: [
      { sku: "7702002", nombre: "Yogurt natural 1L",    qty: 20, costo: 5500, vence: "2026-06-15", encontrado: true,  confianza: 0.96 },
      { sku: null,      nombre: "Queso Campesino 500g", qty: 12, costo: 9800, vence: "2026-06-08", encontrado: false, confianza: 0.91, nuevo: true },
    ],
  };
  root.FiscalConstants = { MOCK_QR_DIAN: MOCK_QR_DIAN, MOCK_OCR_IA: MOCK_OCR_IA };
  window.MOCK_QR_DIAN = MOCK_QR_DIAN; window.MOCK_OCR_IA = MOCK_OCR_IA;
})();
