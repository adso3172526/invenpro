(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  class AuthUseCase {
    constructor(authService) {
      this._authService = authService || null;
    }

    async login(usuario, pass) {
      if (!this._authService) throw new Error("AuthService no inyectado en AuthUseCase");
      return this._authService.login(usuario, pass);
    }

    async changePassword(usuario, newPass) {
      if (!this._authService) throw new Error("AuthService no inyectado en AuthUseCase");
      return this._authService.updatePassword(usuario, newPass);
    }
  }

  root.AuthUseCase = AuthUseCase;
  window.AuthUseCase = AuthUseCase;
})();
