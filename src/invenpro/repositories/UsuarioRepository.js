(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var BaseRepository = root.BaseRepository || window.BaseRepository;
  var Usuario = root.Usuario || window.Usuario;
  var Helpers = root.Helpers || {};

  class UsuarioRepository extends BaseRepository {
    constructor(db) {
      super("usuarios_sistema", "usuario", function (row) {
        return new Usuario(Helpers.camelize(row));
      }, db);
    }

    async findByUsuario(usuario) {
      return this.findById(usuario);
    }
  }

  root.UsuarioRepository = UsuarioRepository;
  window.UsuarioRepository = UsuarioRepository;
})();
