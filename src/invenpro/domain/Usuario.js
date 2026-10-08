(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseEntity = root.BaseEntity || window.BaseEntity;

  class Usuario extends BaseEntity {
    #usuario;
    #nombre;
    #rol;
    #permisos;
    #pass;

    constructor(data = {}) {
      super(data);
      this.#usuario = data.usuario || "";
      this.#nombre = data.nombre || "";
      this.#rol = data.rol || "Usuario";
      this.#permisos = Array.isArray(data.permisos) ? data.permisos : [];
      this.#pass = data.pass || "";
    }

    get usuario() { return this.#usuario; }
    set usuario(v) { this.#usuario = v; }

    get nombre() { return this.#nombre; }
    set nombre(v) { this.#nombre = v; }

    get rol() { return this.#rol; }
    set rol(v) { this.#rol = v; }

    get permisos() { return [...this.#permisos]; }
    set permisos(v) { this.#permisos = Array.isArray(v) ? v : []; }

    get pass() { return this.#pass; }
    set pass(v) { this.#pass = v; }

    get id() { return this.#usuario || ""; }

    get esAdmin() {
      return this.#rol === "Administrador" || this.#rol === "Supervisor";
    }
  }

  root.Usuario = Usuario;
  window.Usuario = Usuario;
})();
