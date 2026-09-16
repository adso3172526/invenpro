(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseEntity = root.BaseEntity || window.BaseEntity;

  class Cajero extends BaseEntity {
    #id;
    #nombre;
    #doc;
    #rol;
    #estado;
    #turnoActivo;
    #ingreso;
    #ventas30d;

    constructor(data = {}) {
      super(data);
      this.#id = data.id || "";
      this.#nombre = data.nombre || "";
      this.#doc = data.doc || "";
      this.#rol = data.rol || "Cajero";
      this.#estado = data.estado || "inactivo";
      this.#turnoActivo = Boolean(data.turnoActivo);
      this.#ingreso = Number(data.ingreso || 0);
      this.#ventas30d = Number(data.ventas30d || 0);
    }

    get id() { return this.#id; }
    set id(v) { this.#id = v; }

    get nombre() { return this.#nombre; }
    set nombre(v) { this.#nombre = v; }

    get doc() { return this.#doc; }
    set doc(v) { this.#doc = v; }

    get rol() { return this.#rol; }
    set rol(v) { this.#rol = v; }

    get estado() { return this.#estado; }
    set estado(v) { this.#estado = v; }

    get turnoActivo() { return this.#turnoActivo; }
    set turnoActivo(v) { this.#turnoActivo = Boolean(v); }

    get ingreso() { return this.#ingreso; }
    set ingreso(v) { this.#ingreso = Number(v || 0); }

    get ventas30d() { return this.#ventas30d; }
    set ventas30d(v) { this.#ventas30d = Number(v || 0); }

    get activo() {
      return this.#estado === "activo";
    }
  }

  root.Cajero = Cajero;
  window.Cajero = Cajero;
})();
