// Sidebar del panel de administración
const { useState: useStateA } = React;

const Sidebar = ({ active, setActive, user, onLogout }) => {
  const [open, setOpen] = useStateA(false);
  const goTo = (id) => { setActive(id); setOpen(false); };
  const activeItem = NAV.find(n => n.id === active);

  return (
    <>
      {/* Mobile topbar: hamburger + título */}
      <div className="mobile-topbar">
        <button className="mobile-burger" onClick={() => setOpen(o => !o)} aria-label="Menú">
          <span/><span/><span/>
        </button>
        <img src="logo.png" alt="InvenPro" style={{ height: 26, objectFit: "contain" }}/>
        <div className="mobile-active-label">{activeItem ? activeItem.label : ""}</div>
      </div>

      {/* Sidebar lateral (desktop) y menú overlay (mobile) */}
      <aside className={"sidebar tw-w-[min(75vw,280px)] md:tw-w-auto" + (open ? " open" : "")}>
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
              <div className="nav-card-label-mobile">{n.label}</div>
            </div>
          ))}
        </div>
        <div className="user">
          <div className="avatar">{(user && user.nombre) ? user.nombre[0] : "A"}</div>
          <div className="user-info-mobile">
            <div className="name-m">{user && user.nombre}</div>
            <div className="role-m">{user && user.rol}</div>
          </div>
          <div className="flex-1">
            <div className="name">{user && user.nombre}</div>
            <div className="role">{user && user.rol}</div>
          </div>
          <button className="btn sm ghost" onClick={onLogout} title="Salir"><Icon name="logout" size={14}/> <span className="user-logout-label">Cerrar sesión</span></button>
        </div>
      </aside>

      {/* Backdrop para móvil */}
      {open && <div className="mobile-backdrop" onClick={() => setOpen(false)}/>}
    </>
  );
};

Object.assign(window, { Sidebar });
