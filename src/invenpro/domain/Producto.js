(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseEntity = root.BaseEntity || window.BaseEntity;

  class Producto extends BaseEntity {
    #sku;
    #nombre;
    #categoria;
    #precio;
    #costo;
    #stock;
    #min;
    #vence;
    #unidad;
    #codigoBarras;

    constructor(data) {
      super(data);
      data = data || {};
      this.#sku = data.sku || "";
      this.#nombre = data.nombre || "";
      this.#categoria = data.categoria || "General";
      this.#precio = Number(data.precio || 0);
      this.#costo = Number(data.costo || 0);
      this.#stock = Number(data.stock || 0);
      this.#min = Number(data.min || 0);
      this.#vence = data.vence || null;
      this.#unidad = data.unidad || "und";
      this.#codigoBarras = data.codigoBarras || data.codigo_barras || "";
    }

    get sku() { return this.#sku; }
    set sku(v) { this.#sku = v; }

    get nombre() { return this.#nombre; }
    set nombre(v) { this.#nombre = v; }

    get categoria() { return this.#categoria; }
    set categoria(v) { this.#categoria = v; }

    get precio() { return this.#precio; }
    set precio(v) { this.#precio = Math.max(0, Number(v || 0)); }

    get costo() { return this.#costo; }
    set costo(v) { this.#costo = Math.max(0, Number(v || 0)); }

    get stock() { return this.#stock; }
    set stock(v) { this.#stock = Math.max(0, Number(v || 0)); }

    get min() { return this.#min; }
    set min(v) { this.#min = Math.max(0, Number(v || 0)); }

    get vence() { return this.#vence; }
    set vence(v) { this.#vence = v; }

    get unidad() { return this.#unidad; }
    set unidad(v) { this.#unidad = v; }

    get codigoBarras() { return this.#codigoBarras; }
    set codigoBarras(v) { this.#codigoBarras = v; }

    get id() { return this.#sku || ""; }

    get stockBajo() { return this.#stock < this.#min; }

    get valorTotal() { return this.#stock * this.#costo; }
  }

  root.Producto = Producto;
  window.Producto = Producto;
})();
