(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseEntity = root.BaseEntity || window.BaseEntity;

  class Ingreso extends BaseEntity {
    #id;
    #fecha;
    #proveedor;
    #items;
    #costo;
    #recibe;
    #factura;
    #detalle;

    constructor(data) {
      super(data);
      data = data || {};
      this.#id = data.id || "";
      this.#fecha = data.fecha || "";
      this.#proveedor = data.proveedor || "";
      this.#items = Number(data.items || 0);
      this.#costo = Number(data.costo || 0);
      this.#recibe = data.recibe || "";
      this.#factura = data.factura || "";
      this.#detalle = Array.isArray(data.detalle) ? data.detalle : [];
    }

    get id() { return this.#id; }
    set id(v) { this.#id = v; }

    get fecha() { return this.#fecha; }
    set fecha(v) { this.#fecha = v; }

    get proveedor() { return this.#proveedor; }
    set proveedor(v) { this.#proveedor = v; }

    get items() { return this.#items; }
    set items(v) { this.#items = Math.max(0, Number(v || 0)); }

    get costo() { return this.#costo; }
    set costo(v) { this.#costo = Math.max(0, Number(v || 0)); }

    get recibe() { return this.#recibe; }
    set recibe(v) { this.#recibe = v; }

    get factura() { return this.#factura; }
    set factura(v) { this.#factura = v; }

    get detalle() { return [...this.#detalle]; }
    set detalle(v) { this.#detalle = Array.isArray(v) ? v : []; }
  }

  root.Ingreso = Ingreso;
  window.Ingreso = Ingreso;
})();
