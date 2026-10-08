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

      var safeUsuario = this._sanitizeLike(usuario);
      var hashed = await helpers.hashPass(pass);
      var legacyMd5 = helpers.md5Hex(pass);

      var result = await db
        .from("usuarios_sistema").select("*")
        .ilike("usuario", safeUsuario).eq("pass", hashed).maybeSingle();
      if (!result.error && result.data) return helpers.camelize(result.data);

      result = await db
        .from("usuarios_sistema").select("*")
        .ilike("usuario", safeUsuario).eq("pass", legacyMd5).maybeSingle();
      if (!result.error && result.data) {
        await db.from("usuarios_sistema").update({ pass: hashed }).eq("usuario", result.data.usuario);
        return helpers.camelize(result.data);
      }

      return null;
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
