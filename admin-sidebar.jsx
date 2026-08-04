// Sidebar del panel de administración

const Sidebar = ({ active, setActive, user, onLogout }) => {
  const [open, setOpen] = useStateA(false);
  const goTo = (id) => { setActive(id); setOpen(false); };

  return (
    <>
      {/* Mobile topbar: hamburger + logo (el título de la sección ya va en el page-h) */}
      <div className="mobile-topbar">
        <button className="mobile-burger" onClick={() => setOpen(o => !o)} aria-label="Menú">
          <span/><span/><span/>
        </button>
        <img src="logo.png" alt="InvenPro" style={{ height: 26, objectFit: "contain" }}/>
      </div>

      {/* Sidebar lateral (desktop) y menú overlay (mobile) */}
      <aside className={"sidebar" + (open ? " open" : "")}>
        <div className="mobile-menu-h">
          <img src="logo.png" alt="InvenPro" style={{ height: 36, objectFit: "contain" }}/>
          <button className="btn sm ghost" onClick={() => setOpen(false)}><Icon name="x" size={16}/></button>
        </div>
        <div className="brand" style={{ paddingTop: 4, justifyContent: "center", display: "flex" }}>
          <img src="logo.png" alt="InvenPro" style={{ height: 40, objectFit: "contain" }}/>
        </div>
        <div className="nav-cards">
          {NAV.filter(n => !n.rol || (user && user.rol === n.rol)).map(n => (
            <div key={n.id}
                 className={"nav-card" + (active === n.id ? " active" : "")}
                 style={{ "--nav-c": n.color }}
                 onClick={() => goTo(n.id)}
                 title={n.label}>
              <div className="nav-card-top">
                <Icon name={n.icon} size={26}/>
                {n.badge && <span className="nav-card-badge">{n.badge}</span>}
              </div>
              <div className="nav-card-bottom">
                <span className="nav-card-label">{n.label}</span>
              </div>
            </div>
          ))}
          {/* Tarjeta de usuario / Cerrar sesión */}
          <div className="nav-card user-logout-card"
               style={{ "--nav-c": "#475569" }}
               onClick={onLogout}
               title={`Cerrar sesión (${(user && user.nombre) || "Usuario"})`}>
            <div className="nav-card-top">
              <div className="avatar">{(user && user.nombre) ? user.nombre[0] : "A"}</div>
            </div>
            <div className="nav-card-bottom">
              <span className="nav-card-label">Cerrar sesión</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop para móvil */}
      {open && <div className="mobile-backdrop" onClick={() => setOpen(false)}/>}
    </>
  );
};

Object.assign(window, { Sidebar });
