// Componente raíz: gestiona autenticación, rol, estado de turno
const { useState: useStateApp, useEffect: useEffectApp } = React;

const _ssRead = () => {
  try { return JSON.parse(localStorage.getItem("invenpro-session")) || {}; } catch { return {}; }
};
const _ssWrite = (patch) => {
  const current = _ssRead();
  Object.assign(current, patch);
  localStorage.setItem("invenpro-session", JSON.stringify(current));
};
const _ssClear = () => localStorage.removeItem("invenpro-session");
const _hasAdminAccess = (user) => {
  const permisos = user?.permisos || [];
  return user?.rol === "Administrador" || user?.rol === "Supervisor" || permisos.includes("USUARIO_GESTIONAR") || permisos.includes("REPORTE_VER");
};

const App = () => {
  const _ss = _ssRead();
  const [theme, setTheme] = useStateApp(() => localStorage.getItem("invenpro-theme") || "light");
  const [stage, setStage] = useStateApp(_ss.stage || "login");
  const [user, setUser] = useStateApp(_ss.user || null);
  const [shift, setShift] = useStateApp(_ss.shift || null);
  const [shiftSummary, setShiftSummary] = useStateApp(null);
  const [adminPage, setAdminPage] = useStateApp(_ss.adminPage || "dashboard");
  const [, forceRender] = useStateApp(0);
  const [showExitConfirm, setShowExitConfirm] = useStateApp(false);

  // Re-render when Supabase hydration completes (if it was slow)
  useEffectApp(() => {
    const handler = () => forceRender(n => n + 1);
    window.addEventListener("invenpro:hydrated", handler);
    return () => window.removeEventListener("invenpro:hydrated", handler);
  }, []);

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
    const tieneAdmin = _hasAdminAccess(u);
    if (tieneAdmin) { setStage("admin"); return; }

    // Buscar turno abierto del cajero para reanudarlo
    const turnoAbierto = (window.MOCK.turnos || []).find(
      t => t.cajero === u.nombre && t.estado === "abierto"
    );
    if (turnoAbierto) {
      // turnoAbierto es una instancia de Turno (campos privados + getters): hacerle
      // spread {...} NO copia el id ni los demás campos. Se leen por getter.
      setShift({
        id: turnoAbierto.id,
        cajero: turnoAbierto.cajero,
        fechaIni: turnoAbierto.fechaIni,
        estado: turnoAbierto.estado,
        baseIni: turnoAbierto.baseIni,
        ventas: turnoAbierto.ventas,
        transacciones: turnoAbierto.transacciones,
        caja: turnoAbierto.caja || "Caja 01",
        base: turnoAbierto.baseIni,
      });
      setStage("pos");
    } else {
      setStage("shift-open");
    }
  };

  const onLogout = () => {
    window.stopRealtime();
    _ssClear();
    setUser(null); setShift(null); setShiftSummary(null);
    setStage("login"); setAdminPage("dashboard");
  };

  // --- Guardia del botón "atrás" del navegador --------------------------------
  // La app no usa rutas/URL (todo es `stage`), así que "atrás" saldría del sitio.
  // Con sesión activa sembramos una entrada de historial y escuchamos popstate:
  // al dar "atrás" mostramos la confirmación (salir y cerrar sesión / permanecer)
  // y re-sembramos la entrada para no abandonar la app. Aplica a TODOS los usuarios.
  const loggedIn = stage !== "login";
  useEffectApp(() => {
    if (!loggedIn) return;
    window.history.pushState({ invenpro: true }, "");
    const onPop = () => {
      setShowExitConfirm(true);
      window.history.pushState({ invenpro: true }, "");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [loggedIn]);

  let screen = null;
  if (stage === "login") {
    screen = <Login onLogin={onLogin}/>;
  } else if (stage === "shift-open") {
    screen = <ShiftOpen cajero={user} onLogout={onLogout} onOpen={(s) => { setShift(s); setStage("pos"); }}/>;
  } else if (stage === "pos") {
    screen = (
      <POS shift={shift} cajero={user}
        onLogout={onLogout}
        onCloseShift={(summary) => { setShiftSummary(summary); setStage("shift-closed"); }}/>
    );
  } else if (stage === "shift-closed") {
    screen = <ShiftClosed summary={shiftSummary} onLogout={onLogout}/>;
  } else if (stage === "admin") {
    if (adminPage === "pos") {
      // Si el admin no ha abierto turno, mostrarlo como al cajero
      if (!shift) {
        screen = (
          <ShiftOpen cajero={user}
            onLogout={() => setAdminPage("dashboard")}
            onOpen={(s) => setShift(s)}/>
        );
      } else {
        screen = (
          <POS shift={shift} cajero={user}
            onLogout={() => setAdminPage("dashboard")}
            onCloseShift={() => { setShift(null); setAdminPage("dashboard"); }}/>
        );
      }
    } else {
      screen = (
        <div className="app">
          <Sidebar active={adminPage} setActive={setAdminPage} user={user} onLogout={onLogout}/>
          <div className="main">
            <div className="page">
              {adminPage === "dashboard" && <Dashboard go={setAdminPage} user={user}/>}
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
  }

  return (
    <>
      {screen}
      {showExitConfirm && (
        <Modal title="¿Salir de InvenPro?" onClose={() => setShowExitConfirm(false)} footer={
          <>
            <button className="btn ghost" onClick={() => setShowExitConfirm(false)}>Permanecer en InvenPro</button>
            <button className="btn primary" onClick={() => { setShowExitConfirm(false); onLogout(); }}>Salir y cerrar sesión</button>
          </>
        }>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            Si sales se <b>cerrará tu sesión</b>. ¿Deseas salir de InvenPro o permanecer en la aplicación?
          </p>
        </Modal>
      )}
    </>
  );
};

(async () => {
  const renderApp = () => {
    const el = document.getElementById("loading");
    if (el) el.remove();
    ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
  };

  try {
    const hydration = window.hydrateData ? window.hydrateData() : Promise.resolve();
    await Promise.race([
      hydration,
      new Promise((resolve) => setTimeout(resolve, 2500))
    ]);
  } catch (e) {
    console.error("Error al hidratar datos:", e);
  } finally {
    renderApp();
  }
})();
