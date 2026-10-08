(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseEntity = root.BaseEntity || window.BaseEntity;

  class Proveedor extends BaseEntity {
    #id;
    #nombre;
    #nit;
    #contacto;
    #tel;
    #email;
    #ciudad;
    #categoria;
    #terminos;
    #estado;
    #ingresos;
    #ultimoIngreso;

    constructor(data = {}) {
      super(data);
      this.#id = data.id || "";
      this.#nombre = data.nombre || "";
      this.#nit = data.nit || "";
      this.#contacto = data.contacto || "";
      this.#tel = data.tel || "";
      this.#email = data.email || "";
      this.#ciudad = data.ciudad || "";
      this.#categoria = data.categoria || "General";
      this.#terminos = data.terminos || "";
      this.#estado = data.estado || "activo";
      this.#ingresos = Number(data.ingresos || 0);
      this.#ultimoIngreso = data.ultimoIngreso || null;
    }

    get id() { return this.#id; }
    set id(v) { this.#id = v; }

    get nombre() { return this.#nombre; }
    set nombre(v) { this.#nombre = v; }

    get nit() { return this.#nit; }
    set nit(v) { this.#nit = v; }

    get contacto() { return this.#contacto; }
    set contacto(v) { this.#contacto = v; }

    get tel() { return this.#tel; }
    set tel(v) { this.#tel = v; }

    get email() { return this.#email; }
    set email(v) { this.#email = v; }

    get ciudad() { return this.#ciudad; }
    set ciudad(v) { this.#ciudad = v; }

    get categoria() { return this.#categoria; }
    set categoria(v) { this.#categoria = v; }

    get terminos() { return this.#terminos; }
    set terminos(v) { this.#terminos = v; }

    get estado() { return this.#estado; }
    set estado(v) { this.#estado = v; }

    get ingresos() { return this.#ingresos; }
    set ingresos(v) { this.#ingresos = Number(v || 0); }

    get ultimoIngreso() { return this.#ultimoIngreso; }
    set ultimoIngreso(v) { this.#ultimoIngreso = v; }

    get activo() {
      return this.#estado === "activo";
    }
  }

  root.Proveedor = Proveedor;
  window.Proveedor = Proveedor;
})();
