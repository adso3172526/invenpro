(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseEntity = root.BaseEntity || window.BaseEntity;

  class Turno extends BaseEntity {
    #id;
    #cajero;
    #fechaIni;
    #fechaFin;
    #baseIni;
    #ventas;
    #transacciones;
    #estado;

    constructor(data = {}) {
      super(data);
      this.#id = data.id || "";
      this.#cajero = data.cajero || "";
      this.#fechaIni = data.fechaIni || data.fecha_inicio || null;
      this.#fechaFin = data.fechaFin || data.fecha_fin || null;
      this.#baseIni = Number(data.baseIni || data.base_ini || 0);
      this.#ventas = Number(data.ventas || 0);
      this.#transacciones = Number(data.transacciones || 0);
      this.#estado = data.estado || "cerrado";
    }

    get id() { return this.#id; }
    set id(v) { this.#id = v; }

    get cajero() { return this.#cajero; }
    set cajero(v) { this.#cajero = v; }

    get fechaIni() { return this.#fechaIni; }
    set fechaIni(v) { this.#fechaIni = v; }

    get fechaFin() { return this.#fechaFin; }
    set fechaFin(v) { this.#fechaFin = v; }

    get baseIni() { return this.#baseIni; }
    set baseIni(v) { this.#baseIni = Number(v || 0); }

    get ventas() { return this.#ventas; }
    set ventas(v) { this.#ventas = Number(v || 0); }

    get transacciones() { return this.#transacciones; }
    set transacciones(v) { this.#transacciones = Number(v || 0); }

    get estado() { return this.#estado; }
    set estado(v) { this.#estado = v; }

    get abierto() {
      return this.#estado === "abierto";
    }
  }

  root.Turno = Turno;
  window.Turno = Turno;
})();
