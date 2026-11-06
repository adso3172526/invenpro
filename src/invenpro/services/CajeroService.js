(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseService = root.BaseService || window.BaseService;
  var Helpers = root.Helpers || {};

  class CajeroService extends BaseService {
    constructor(db, deps) {
      super(db);
      this.repo = (deps && deps.repo) || null;
      this._helpers = deps && deps.helpers || Helpers;
    }

    _snakify(obj) {
      return this._helpers.snakify(obj);
    }

    // Alta de cajero + usuario de login (atómica) vía la FUNCTION fn_crear_cajero.
    // Devuelve { id, error }: id = 'C-NN'; error.message trae el mensaje de validación.
    // getDb().rpc directo porque _rpc descarta el data (necesitamos el id creado).
    async create(datos) {
      // Normaliza el nombre (minúsculas, sin tildes) para evitar duplicados tipo "Jésica"/"Jesica".
      var norm = (this._helpers && this._helpers.normalizarNombre) || function (x) { return x; };
      var result = await this.getDb().rpc("fn_crear_cajero", {
        p_nombres: norm(datos.nombres), p_apellidos: norm(datos.apellidos), p_doc: datos.doc,
        p_rol: datos.rol, p_usuario: datos.usuario, p_pass: datos.pass,
      });
      if (result.error) console.error("[crearCajero]", result.error);
      return { id: result.data, error: result.error };
    }

    async update(id, updates) {
      // Si se cambia el nombre, normalizarlo (este update siempre es sobre cajeros).
      var norm = (this._helpers && this._helpers.normalizarNombre) || function (x) { return x; };
      var upd = Object.assign({}, updates);
      if (upd.nombre != null) upd.nombre = norm(upd.nombre);
      return this._update("cajeros", "id", id, this._snakify(upd));
    }

    async updateUsuario(usuario, updates) {
      return this._update("usuarios_sistema", "usuario", usuario, updates);
    }
  }

  root.CajeroService = CajeroService;
  window.CajeroService = CajeroService;
})();
