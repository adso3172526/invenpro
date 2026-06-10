// Pantalla de login (sin selector de rol; el rol se resuelve por la tabla de permisos)
const Login = ({ onLogin }) => {
  const [user, setUser] = React.useState("");
  const [pass, setPass] = React.useState("");
  const [shake, setShake] = React.useState(false);
  const [error, setError] = React.useState("");

  const submit = async (e) => {
    e?.preventDefault();
    setError("");
    if (!user || !pass) {
      setShake(true); setTimeout(() => setShake(false), 400); return;
    }
    let u;
    try {
      u = await DB.auth.login(user.trim(), pass);
    } catch (err) {
      console.error("login:", err);
      setError("No se pudo conectar. Revisa tu conexión e intenta de nuevo.");
      setShake(true); setTimeout(() => setShake(false), 400); return;
    }
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
        <form className="login-form tw-w-full tw-max-w-[400px] tw-mx-auto tw-px-4 sm:tw-px-0" onSubmit={submit} style={{ animation: shake ? "shake .3s" : undefined }}>
          <div className="tw-flex tw-justify-center tw-mb-6">
            <img src="logo.png" alt="InvenPro" className="tw-object-contain tw-w-[125px] tw-h-[45px]" />
          </div>
          <h2 className="tw-text-center">Bienvenido</h2>

          <div className="field tw-mt-5">
            <label>Usuario</label>
            <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="usuario.apellido" autoFocus/>
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" />
          </div>

          {error && (
            <div className="tw-bg-bad-soft tw-text-bad tw-py-2 tw-px-3 tw-rounded-md tw-text-xs tw-mb-3 tw-font-medium">
              {error}
            </div>
          )}

          <button type="submit" className="btn primary full lg">
            Iniciar sesión
            <Icon name="arrowRight" size={16} />
          </button>

        </form>
      </div>
      <div className="login-footer">
        <div className="brandmark">
          <img src="logo.png" alt="InvenPro" className="tw-h-[22px] tw-object-contain" />
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
