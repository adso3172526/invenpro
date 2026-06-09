// Componente raíz: gestiona autenticación, rol, estado de turno
const { useState: useStateApp, useEffect: useEffectApp } = React;

// Helpers para persistir sesión en localStorage
const _ssKey = "invenpro-session";
const _ssRead = () => { try { return JSON.parse(localStorage.getItem(_ssKey)) || {}; } catch { return {}; } };
const _ssWrite = (patch) => { const cur = _ssRead(); Object.assign(cur, patch); localStorage.setItem(_ssKey, JSON.stringify(cur)); };
const _ssClear = () => localStorage.removeItem(_ssKey);

const App = () => {
  const _ss = _ssRead();
  const [theme, setTheme] = useStateApp(() => localStorage.getItem("invenpro-theme") || "light");
  const [stage, setStage] = useStateApp(_ss.stage || "login");
  const [user, setUser] = useStateApp(_ss.user || null);
  const [shift, setShift] = useStateApp(_ss.shift || null);
  const [shiftSummary, setShiftSummary] = useStateApp(null);
  const [adminPage, setAdminPage] = useStateApp(_ss.adminPage || "dashboard");

  useEffectApp(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("invenpro-theme", theme);
  }, [theme]);

  // Persistir sesión en cada cambio relevante
  useEffectApp(() => { _ssWrite({ stage }); }, [stage]);
  useEffectApp(() => { _ssWrite({ user }); }, [user]);
  useEffectApp(() => { _ssWrite({ shift }); }, [shift]);
  useEffectApp(() => { _ssWrite({ adminPage }); }, [adminPage]);

  const onLogin = async (u) => {
    // Re-hidratar datos desde Supabase para tener config actualizada
    try { await window.hydrateData(); } catch (e) { console.error("hydrateData on login:", e); }
    setUser({
      nombre: u.nombre,
      rol: u.rol,
      usuario: u.usuario,
      permisos: u.permisos || [],
    });
    // El rol y los permisos determinan la vista, no una selección manual
    const tieneAdmin = u.rol === "Administrador"
                     || u.rol === "Supervisor"
                     || (u.permisos || []).includes("USUARIO_GESTIONAR")
                     || (u.permisos || []).includes("REPORTE_VER");
    if (tieneAdmin) { setStage("admin"); return; }

    // Buscar turno abierto del cajero para reanudarlo
    const turnoAbierto = (window.MOCK.turnos || []).find(
      t => t.cajero === u.nombre && t.estado === "abierto"
    );
    if (turnoAbierto) {
      setShift({ ...turnoAbierto, caja: turnoAbierto.caja || "Caja 01", base: turnoAbierto.baseIni });
      setStage("pos");
    } else {
      setStage("shift-open");
    }
  };

  const onLogout = () => {
    _ssClear();
    setUser(null); setShift(null); setShiftSummary(null);
    setStage("login"); setAdminPage("dashboard");
  };

  if (stage === "login") return <Login onLogin={onLogin}/>;

  if (stage === "shift-open") return (
    <ShiftOpen cajero={user} onLogout={onLogout} onOpen={(s) => { setShift(s); setStage("pos"); }}/>
  );

  if (stage === "pos") return (
    <POS shift={shift} cajero={user}
      onLogout={onLogout}
      onCloseShift={(summary) => { setShiftSummary(summary); setStage("shift-closed"); }}/>
  );

  if (stage === "shift-closed") return <ShiftClosed summary={shiftSummary} onLogout={onLogout}/>;

  // Admin
  if (stage === "admin") {
    if (adminPage === "pos") {
      // Si el admin no ha abierto turno, mostrarlo como al cajero
      if (!shift) {
        return (
          <ShiftOpen cajero={user}
            onLogout={() => setAdminPage("dashboard")}
            onOpen={(s) => setShift(s)}/>
        );
      }
      return (
        <POS shift={shift} cajero={user}
          onLogout={() => setAdminPage("dashboard")}
          onCloseShift={() => { setShift(null); setAdminPage("dashboard"); }}/>
      );
    }
    return (
      <div className="app">
        <Sidebar active={adminPage} setActive={setAdminPage} user={user} onLogout={onLogout}/>
        <div className="main">
          <div className="page">
            {adminPage === "dashboard" && <Dashboard go={setAdminPage}/>}
            {adminPage === "inventory" && <Inventario/>}
            {adminPage === "ingreso" && <Ingreso/>}
            {adminPage === "vence" && <Vencimientos/>}
            {adminPage === "proveedores" && <Proveedores/>}
            {adminPage === "cajeros" && <Cajeros/>}
            {adminPage === "reportes" && <Reportes/>}
            {adminPage === "ajustes" && <Ajustes/>}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

(async () => {
  try {
    await window.hydrateData();
  } catch (e) {
    console.error("Error al hidratar datos:", e);
  }
  const el = document.getElementById("loading");
  if (el) el.remove();
  ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
})();
