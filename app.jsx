// Componente raíz: gestiona autenticación, rol, estado de turno
const { useState: useStateApp, useEffect: useEffectApp } = React;

const App = () => {
  const [theme, setTheme] = useStateApp(() => localStorage.getItem("invenpro-theme") || "light");
  const [stage, setStage] = useStateApp("login"); // login | shift-open | pos | shift-closed | admin
  const [user, setUser] = useStateApp(null);
  const [shift, setShift] = useStateApp(null);
  const [shiftSummary, setShiftSummary] = useStateApp(null);
  const [adminPage, setAdminPage] = useStateApp("dashboard");

  useEffectApp(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("invenpro-theme", theme);
  }, [theme]);

  const onLogin = (u) => {
    setUser({
      nombre: u.nombre,
      rol: u.rol,
      usuario: u.usuario,
      permisos: u.permisos || [],
    });
    // El rol y los permisos determinan la vista, no una selección manual
    const tieneAdmin = (u.permisos || []).includes("USUARIO_GESTIONAR")
                     || (u.permisos || []).includes("REPORTE_VER");
    if (tieneAdmin) setStage("admin");
    else setStage("shift-open");
  };

  const onLogout = () => {
    setUser(null); setShift(null); setShiftSummary(null);
    setStage("login"); setAdminPage("dashboard");
  };

  if (stage === "login") return (<>
    <Login onLogin={onLogin}/>
    <ThemeToggle theme={theme} setTheme={setTheme}/>
  </>);

  if (stage === "shift-open") return (<>
    <ShiftOpen cajero={user} onLogout={onLogout} onOpen={(s) => { setShift(s); setStage("pos"); }}/>
    <ThemeToggle theme={theme} setTheme={setTheme}/>
  </>);

  if (stage === "pos") return (
    <POS shift={shift} cajero={user} theme={theme} setTheme={setTheme}
      onLogout={onLogout}
      onCloseShift={(summary) => { setShiftSummary(summary); setStage("shift-closed"); }}/>
  );

  if (stage === "shift-closed") return (<>
    <ShiftClosed summary={shiftSummary} onLogout={onLogout}/>
    <ThemeToggle theme={theme} setTheme={setTheme}/>
  </>);

  // Admin
  if (stage === "admin") {
    if (adminPage === "pos") {
      // Si el admin no ha abierto turno, mostrarlo como al cajero
      if (!shift) {
        return (
          <>
            <ShiftOpen cajero={user}
              onLogout={() => setAdminPage("dashboard")}
              onOpen={(s) => setShift(s)}/>
            <ThemeToggle theme={theme} setTheme={setTheme}/>
          </>
        );
      }
      return (
        <POS shift={shift} cajero={user} theme={theme} setTheme={setTheme}
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
          </div>
        </div>
        <ThemeToggle theme={theme} setTheme={setTheme}/>
      </div>
    );
  }
  return null;
};

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
