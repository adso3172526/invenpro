(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseService = root.BaseService || window.BaseService;
  var Helpers = root.Helpers || {};

  class AuthService extends BaseService {
    constructor(db, deps) {
      super(db);
      this.repo = (deps && deps.repo) || null;
      this._helpers = deps && deps.helpers || Helpers;
    }

    _sanitizeLike(input) {
      if (!input) return input;
      return String(input)
        .replace(/\\/g, "\\\\")
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_")
        .replace(/\[/g, "\\[");
    }

    async login(usuario, pass) {
      var db = this.getDb();
      var helpers = this._helpers;

      // La verificacion del hash ocurre en el SERVIDOR (fn_login, SECURITY DEFINER):
      // nunca se lee la columna 'pass' desde el navegador. fn_login tambien migra
      // un hash viejo (md5) a sha-256 cuando aplica. Devuelve el usuario SIN pass.
      var hashed = await helpers.hashPass(pass);
      var legacyMd5 = helpers.md5Hex(pass);

      var result = await db.rpc("fn_login", {
        p_usuario: String(usuario || ""),
        p_sha: hashed,
        p_md5: legacyMd5,
      });
      if (result.error) {
        // fn_login lanza 'USUARIO_INACTIVO' cuando el cajero está inactivo (con
        // credenciales correctas). Lo señalizamos distinto de "credenciales malas".
        if (/USUARIO_INACTIVO/i.test(result.error.message || "")) return { inactivo: true };
        console.error("[login]", result.error);
        return null;
      }

      var rows = result.data;
      var user = Array.isArray(rows) ? rows[0] : rows;
      if (!user) return null;
      return helpers.camelize(user);
    }

    async updatePassword(usuario, newPass) {
      var helpers = this._helpers;
      var hashed = await helpers.hashPass(newPass);
      return this._update("usuarios_sistema", "usuario", usuario, { pass: hashed });
    }
  }

  root.AuthService = AuthService;
  window.AuthService = AuthService;
})();
