(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseEntity = root.BaseEntity || window.BaseEntity;

  class Factura extends BaseEntity {
    #id;
    #fecha;
    #hora;
    #cajero;
    #metodo;
    #total;
    #items;

    constructor(data = {}) {
      super(data);
      this.#id = data.id || "";
      this.#fecha = data.fecha || "";
      this.#hora = data.hora || "";
      this.#cajero = data.cajero || "";
      this.#metodo = data.metodo || "efectivo";
      this.#total = Number(data.total || 0);
      this.#items = Array.isArray(data.items) ? data.items : [];
    }

    get id() { return this.#id; }
    set id(v) { this.#id = v; }

    get fecha() { return this.#fecha; }
    set fecha(v) { this.#fecha = v; }

    get hora() { return this.#hora; }
    set hora(v) { this.#hora = v; }

    get cajero() { return this.#cajero; }
    set cajero(v) { this.#cajero = v; }

    get metodo() { return this.#metodo; }
    set metodo(v) { this.#metodo = v; }

    get total() { return this.#total; }
    set total(v) { this.#total = Number(v || 0); }

    get items() { return [...this.#items]; }
    set items(v) { this.#items = Array.isArray(v) ? v : []; }

    get cantidadItems() {
      return this.#items.reduce((sum, item) => sum + Number(item.q || item.qty || 0), 0);
    }
  }

  root.Factura = Factura;
  window.Factura = Factura;
})();
