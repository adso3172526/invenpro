// Pantalla de login (sin selector de rol; el rol se resuelve por la tabla de permisos)
const Login = ({ onLogin }) => {
  const [user, setUser] = React.useState("");
  const [pass, setPass] = React.useState("");
  const [shake, setShake] = React.useState(false);
  const [error, setError] = React.useState("");

  const submit = (e) => {
    e?.preventDefault();
    setError("");
    if (!user || !pass) {
      setShake(true); setTimeout(() => setShake(false), 400); return;
    }
    const u = (window.MOCK.usuarios_sistema || []).find(
      x => x.usuario.toLowerCase() === user.toLowerCase().trim() && x.pass === pass
    );
    if (!u) {
      setError("Usuario o contraseña incorrectos.");
      setShake(true); setTimeout(() => setShake(false), 400); return;
    }
    onLogin(u);
  };

  return (
    <div className="login-shell">
      <div className="deco" />
      <div className="login-form-wrap">
        <form className="login-form" onSubmit={submit} style={{ animation: shake ? "shake .3s" : undefined }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <img src="logo.png" alt="InvenPro" style={{ objectFit: "contain", width: "125.35px", height: "45px" }} />
          </div>
          <h2 style={{ textAlign: "center" }}>Bienvenido</h2>

          <div className="field" style={{ marginTop: 20 }}>
            <label>Usuario</label>
            <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="usuario.apellido" autoFocus/>
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" />
          </div>

          {error && (
            <div style={{ background: "var(--bad-soft)", color: "var(--bad)", padding: "8px 12px", borderRadius: 6, fontSize: 12, marginBottom: 12, fontWeight: 500 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn primary full lg">
            Iniciar sesión
            <Icon name="arrowRight" size={16} />
          </button>

          <details style={{ marginTop: 16, fontSize: 11, color: "var(--text-3)" }}>
            <summary style={{ cursor: "pointer", userSelect: "none" }}>Cuentas de demostración</summary>
            <div style={{ marginTop: 8, padding: 10, background: "var(--surface-2)", borderRadius: 6, lineHeight: 1.7 }}>
              <div><b>admin</b> / admin123 · Administrador</div>
              <div><b>supervisor</b> / super123 · Supervisor</div>
              <div><b>jeferson.ortiz</b> / cajero123 · Cajero</div>
            </div>
          </details>
        </form>
      </div>
      <div className="login-footer">
        <div className="brandmark">
          <img src="logo.png" alt="InvenPro" style={{ height: 22, objectFit: "contain" }} />
        </div>
        <div className="pitch">
          <span>Tu minimercado, controlado al detalle.</span> Facturación, inventario, vencimientos y turnos en un solo lugar.
        </div>
        <div className="meta">
          <span>v2.4</span>
          <span>Pesos COP</span>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Login });
