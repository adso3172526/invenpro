// Cajeros y turnos

const CierreDetalleModal = ({ turno, cierre, onClose }) => {
  const c = cierre || {};
  const difColor = c.diferencia === 0 ? "var(--good)" : c.diferencia > 0 ? "var(--warn)" : "var(--bad)";
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h">
          <h3>Cierre de caja · {turno.cajero}</h3>
          <button className="x" onClick={onClose}><Icon name="x"/></button>
        </div>
        <div className="modal-b">
          <div className="muted tw-text-xs tw-mb-2">Turno {turno.id}{turno.fechaFin ? " · " + turno.fechaFin : ""}</div>
          <div className="card tw-bg-surface-2"><div className="card-b">
            <div className="row spaced"><span className="muted">Base inicial</span><span className="mono">{window.fmtCOP(c.baseInicial)}</span></div>
            <div className="row spaced"><span className="muted">Efectivo</span><span className="mono">{window.fmtCOP(c.ventasEfectivo)}</span></div>
            <div className="row spaced"><span className="muted">Transferencia</span><span className="mono">{window.fmtCOP(c.ventasTransferencia)}</span></div>
            <div className="row spaced"><span className="muted">Nequi</span><span className="mono">{window.fmtCOP(c.ventasNequi)}</span></div>
            <div className="row spaced"><span className="muted">Daviplata</span><span className="mono">{window.fmtCOP(c.ventasDaviplata)}</span></div>
            <div className="row spaced"><span className="muted">Total ventas</span><span className="mono">{window.fmtCOP(c.totalVentas)}</span></div>
            <hr className="tw-border-0 tw-border-t tw-border-border tw-my-2"/>
            <div className="row spaced"><span className="muted">Esperado (efectivo)</span><span className="mono">{window.fmtCOP(c.esperadoEfectivo)}</span></div>
            <div className="row spaced"><span className="muted">Efectivo contado</span><span className="mono">{window.fmtCOP(c.efectivoContado)}</span></div>
            <div className="row spaced"><span className="tw-font-semibold">Diferencia</span><span className="mono tw-font-semibold" style={{ color: difColor }}>{(c.diferencia > 0 ? "+" : "") + window.fmtCOP(c.diferencia)}</span></div>
          </div></div>
          {c.observaciones ? <div className="tw-mt-3"><div className="muted tw-text-xs tw-mb-1">Observaciones</div><div className="tw-text-sm">{c.observaciones}</div></div> : null}
        </div>
        <div className="modal-f">
          <button className="btn" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

const Cajeros = () => {
  const [tab, setTab] = useStateA("equipo");
  const [showAdd, setShowAdd] = useStateA(false);
  const [cfgCajero, setCfgCajero] = useStateA(null);
  const [cfgUsuario, setCfgUsuario] = useStateA(null);
  const [toast, setToast] = useStateA(null);
  const [verCierre, setVerCierre] = useStateA(null);  // turno cuyo cierre se muestra

  // Formulario "Nuevo cajero" (crea cajero + usuario de login vía fn_crear_cajero)
  const [nuevo, setNuevo] = useStateA({ nombres: "", apellidos: "", doc: "", rol: "Cajero", usuario: "", pass: "" });
  const [creando, setCreando] = useStateA(false);
  const [errCrear, setErrCrear] = useStateA("");
  const setN = (k, v) => setNuevo(p => ({ ...p, [k]: v }));
  const resetNuevo = () => { setNuevo({ nombres: "", apellidos: "", doc: "", rol: "Cajero", usuario: "", pass: "" }); setErrCrear(""); };

  // Realtime: only re-render when no modal is open
  const [, _rtTick] = React.useState(0);
  const _modalRef = React.useRef(false);
  _modalRef.current = showAdd || !!cfgCajero || !!cfgUsuario;
  React.useEffect(() => {
    const tables = ["cajeros", "turnos", "usuarios_sistema"];
    const offs = tables.map(t => window.EventBus.on("realtime:" + t, () => {
      if (!_modalRef.current) _rtTick(n => n + 1);
    }));
    return () => offs.forEach(fn => fn());
  }, []);

  // Red de seguridad: al entrar al módulo, relee los turnos desde la BD.
  // El realtime (websocket) puede perder el evento de cierre de turno, dejando
  // MOCK.turnos con el estado viejo; entonces el estado no cambiaba sin recargar.
  // Releer con DB.turnos.getAll() garantiza ver el estado correcto al entrar.
  React.useEffect(() => {
    (async () => {
      try {
        const frescos = await DB.turnos.getAll();
        if (frescos && frescos.length) MOCK.turnos = frescos;
        const cierres = await DB.cierres.getAll();
        if (cierres) MOCK.cierres = cierres;
        if (!_modalRef.current) _rtTick(n => n + 1);
      } catch (e) { console.error("refrescar turnos/cierres al entrar:", e); }
    })();
  }, []);

  const pagCaj = usePagination(MOCK.cajeros, 2);
  // Turnos ordenados del más reciente al más antiguo. Hay ids con dos formatos
  // ("T-"+Date.now() de la app y "T-2029" de datos viejos), así que se compara
  // el NÚMERO del id (no como texto, que pondría "T-2031" antes de "T-1788...").
  // Los timestamps (grandes) quedan primero; los datos viejos, al final. Se
  // ordena una copia para no mutar MOCK.
  const numTurno = (t) => { const m = String(t.id).match(/(\d+)$/); return m ? Number(m[1]) : 0; };
  const turnosOrdenados = [...MOCK.turnos].sort((a, b) => numTurno(b) - numTurno(a));
  const pagTur = usePagination(turnosOrdenados, 10);
  const cierreDe = (turnoId) => (MOCK.cierres || []).find(c => c.turnoId === turnoId);

  const currentUser = useMemoA(() => {
    try { return JSON.parse(localStorage.getItem("invenpro-session"))?.user || {}; } catch { return {}; }
  }, []);
  const esSupervisor = currentUser.rol === "Supervisor";

  const usuarios = useMemoA(() =>
    (MOCK.usuarios_sistema || []).filter(u => {
      if (MOCK.cajeros.some(c => c.nombre === u.nombre)) return false;
      if (esSupervisor && u.rol === "Administrador") return false;
      return true;
    }),
    [MOCK.usuarios_sistema, MOCK.cajeros, esSupervisor]
  );
  const pagUsr = usePagination(usuarios, 10);

  const handleCrearCajero = async () => {
    setErrCrear("");
    if (!nuevo.nombres.trim() || !nuevo.apellidos.trim() || !nuevo.doc.trim() || !nuevo.usuario.trim() || !nuevo.pass.trim()) {
      setErrCrear("Completa todos los campos."); return;
    }
    setCreando(true);
    const { id, error } = await DB.cajeros.create(nuevo);
    setCreando(false);
    if (error) { setErrCrear(error.message || "No se pudo crear el cajero."); return; }
    setShowAdd(false);
    resetNuevo();
    setToast(`Cajero ${id} creado correctamente`);
  };

  return (
    <>
      <div className="page-h tw-flex tw-flex-col sm:tw-flex-row tw-gap-3 sm:tw-items-center sm:tw-justify-between">
        <div>
          <h2>Cajeros y turnos</h2>
          <p className="sub">Administra usuarios del POS y supervisa la actividad de cada turno.</p>
        </div>
        <div className="tw-flex tw-flex-wrap tw-gap-2 tw-w-full sm:tw-w-auto">
          <div className="tab-bar tw-w-full sm:tw-w-auto">
            <button className={tab === "equipo" ? "on" : ""} onClick={() => setTab("equipo")}>Equipo</button>
            <button className={tab === "turnos" ? "on" : ""} onClick={() => setTab("turnos")}>Turnos</button>
            <button className={tab === "usuarios" ? "on" : ""} onClick={() => setTab("usuarios")}>Usuarios</button>
          </div>
          <button className="btn primary tw-w-full sm:tw-w-auto" onClick={() => setShowAdd(true)}><Icon name="plus" size={14}/> Nuevo cajero</button>
        </div>
      </div>

      {tab === "equipo" && (
        <>
          {/* Desktop: tabla */}
          <div className="card tw-hidden md:tw-block">
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Cajero</th><th>Documento</th><th>Rol</th><th>Estado</th><th>Turno actual</th><th>Ingreso</th><th className="num">Ventas (30d)</th><th></th></tr></thead>
                <tbody>
                  {pagCaj.slice.map(c => (
                    <tr key={c.id} className="row-hover">
                      <td>
                        <div className="row">
                          <div className="tw-w-[30px] tw-h-[30px] tw-rounded-full tw-bg-accent-soft tw-grid tw-place-items-center tw-font-semibold tw-text-xs" style={{ color: "var(--accent-ink)" }}>
                            {c.nombre.split(" ").map(x => x[0]).slice(0,2).join("")}
                          </div>
                          <div>
                            <div className="tw-font-medium">{c.nombre}</div>
                            <div className="muted mono tw-text-[11px]">{c.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="mono">{c.doc}</td>
                      <td><span className="chip">{c.rol}</span></td>
                      <td><span className={"chip " + (c.estado === "activo" ? "good" : "bad")}><span className="dot"/>{c.estado}</span></td>
                      <td>{c.turnoActivo ? <span className="chip accent"><span className="dot"/>En turno</span> : <span className="muted">—</span>}</td>
                      <td className="muted">{c.ingreso}</td>
                      <td className="num mono">{window.fmtCOP(c.ventas30d)}</td>
                      <td className="num">
                        <button className="btn sm ghost" onClick={() => setCfgCajero(c)}><Icon name="settings" size={13}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination {...pagCaj} label="cajeros"/>
          </div>
          {/* Mobile: tarjetas */}
          <div className="tw-block md:tw-hidden tw-flex tw-flex-col tw-gap-2.5">
            {pagCaj.slice.map(c => (
              <div key={c.id} className="tw-bg-surface tw-border tw-border-border tw-rounded-xl tw-p-3.5 tw-shadow-sm">
                <div className="tw-flex tw-items-center tw-gap-2.5 tw-mb-2">
                  <div className="tw-w-9 tw-h-9 tw-rounded-full tw-bg-accent-soft tw-grid tw-place-items-center tw-font-semibold tw-text-xs tw-shrink-0" style={{ color: "var(--accent-ink)" }}>
                    {c.nombre.split(" ").map(x => x[0]).slice(0,2).join("")}
                  </div>
                  <div className="tw-flex-1 tw-min-w-0">
                    <div className="tw-font-medium tw-text-sm">{c.nombre}</div>
                    <div className="muted mono tw-text-[11px]">{c.id} · {c.doc}</div>
                  </div>
                  <span className={"chip " + (c.estado === "activo" ? "good" : "bad")}><span className="dot"/>{c.estado}</span>
                  <button className="btn sm ghost" onClick={() => setCfgCajero(c)}><Icon name="settings" size={14}/></button>
                </div>
                <div className="tw-grid tw-grid-cols-1 min-[360px]:tw-grid-cols-2 tw-gap-x-3 tw-gap-y-1 tw-text-xs">
                  <div><span className="muted">Rol:</span> {c.rol}</div>
                  <div><span className="muted">Turno:</span> {c.turnoActivo ? "En turno" : "—"}</div>
                  <div><span className="muted">Ingreso:</span> {c.ingreso}</div>
                  <div><span className="muted">Ventas 30d:</span> <span className="mono">{window.fmtCOP(c.ventas30d)}</span></div>
                </div>
              </div>
            ))}
            <Pagination {...pagCaj} label="cajeros"/>
          </div>
        </>
      )}

      {tab === "turnos" && (
        <>
          {/* Desktop: tabla */}
          <div className="card tw-hidden md:tw-block">
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>N° turno</th><th>Cajero</th><th>Apertura</th><th>Cierre</th><th>Estado</th><th className="num">Base</th><th className="num">Ventas</th><th className="num">Trans.</th><th className="num">Diferencia</th><th></th></tr></thead>
                <tbody>
                  {pagTur.slice.map(t => {
                    const c = cierreDe(t.id);
                    const difColor = !c ? "var(--text-3)" : c.diferencia === 0 ? "var(--good)" : c.diferencia > 0 ? "var(--warn)" : "var(--bad)";
                    return (
                    <tr key={t.id} className="row-hover">
                      <td className="mono">{t.id}</td>
                      <td className="tw-font-medium">{t.cajero}</td>
                      <td className="mono tw-text-xs">{t.fechaIni}</td>
                      <td className="mono tw-text-xs">{t.fechaFin || <span className="muted">—</span>}</td>
                      <td><span className={"chip " + (t.estado === "abierto" ? "good" : "")}>{t.estado === "abierto" ? <><span className="dot"/>abierto</> : "cerrado"}</span></td>
                      <td className="num mono">{window.fmtCOP(t.baseIni)}</td>
                      <td className="num mono">{window.fmtCOP(t.ventas)}</td>
                      <td className="num mono">{t.transacciones}</td>
                      <td className="num mono" style={{ color: difColor, fontWeight: 600 }}>{c ? ((c.diferencia > 0 ? "+" : "") + window.fmtCOP(c.diferencia)) : "—"}</td>
                      <td>{c ? <button className="btn sm" onClick={() => setVerCierre(t)}>Detalle</button> : <span className="muted">—</span>}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination {...pagTur} label="turnos"/>
          </div>
          {/* Mobile: tarjetas */}
          <div className="tw-block md:tw-hidden tw-flex tw-flex-col tw-gap-2.5">
            {pagTur.slice.map(t => {
              const c = cierreDe(t.id);
              return (
              <div key={t.id} className="tw-bg-surface tw-border tw-border-border tw-rounded-xl tw-p-3.5 tw-shadow-sm">
                <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                  <div>
                    <div className="tw-font-medium tw-text-sm">{t.cajero}</div>
                    <div className="muted mono tw-text-[11px]">Turno {t.id}</div>
                  </div>
                  <span className={"chip " + (t.estado === "abierto" ? "good" : "")}>{t.estado === "abierto" ? <><span className="dot"/>abierto</> : "cerrado"}</span>
                </div>
                <div className="tw-grid tw-grid-cols-1 min-[360px]:tw-grid-cols-2 tw-gap-x-3 tw-gap-y-1 tw-text-xs">
                  <div><span className="muted">Apertura:</span> <span className="mono">{t.fechaIni}</span></div>
                  <div><span className="muted">Cierre:</span> <span className="mono">{t.fechaFin || "—"}</span></div>
                  <div><span className="muted">Base:</span> <span className="mono">{window.fmtCOP(t.baseIni)}</span></div>
                  <div><span className="muted">Ventas:</span> <span className="mono">{window.fmtCOP(t.ventas)}</span></div>
                </div>
                {c && (
                  <div className="tw-flex tw-items-center tw-justify-between tw-mt-2 tw-pt-2 tw-border-t tw-border-border">
                    <span className="tw-text-xs">Diferencia: <span className="mono tw-font-semibold" style={{ color: c.diferencia === 0 ? "var(--good)" : c.diferencia > 0 ? "var(--warn)" : "var(--bad)" }}>{(c.diferencia > 0 ? "+" : "") + window.fmtCOP(c.diferencia)}</span></span>
                    <button className="btn sm" onClick={() => setVerCierre(t)}>Detalle</button>
                  </div>
                )}
              </div>
              );
            })}
            <Pagination {...pagTur} label="turnos"/>
          </div>
        </>
      )}

      {tab === "usuarios" && (
        <>
          {/* Desktop: tabla */}
          <div className="card tw-hidden md:tw-block">
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Permisos</th><th></th></tr></thead>
                <tbody>
                  {pagUsr.slice.map(u => (
                    <tr key={u.usuario} className="row-hover">
                      <td className="mono">{u.usuario}</td>
                      <td className="tw-font-medium">{u.nombre}</td>
                      <td><span className="chip">{u.rol}</span></td>
                      <td className="muted tw-text-xs">{u.permisos ? u.permisos.join(", ") : "—"}</td>
                      <td className="num">
                        <button className="btn sm ghost" onClick={() => setCfgUsuario(u)}><Icon name="settings" size={13}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination {...pagUsr} label="usuarios"/>
          </div>
          {/* Mobile: tarjetas */}
          <div className="tw-block md:tw-hidden tw-flex tw-flex-col tw-gap-2.5">
            {pagUsr.slice.map(u => (
              <div key={u.usuario} className="tw-bg-surface tw-border tw-border-border tw-rounded-xl tw-p-3.5 tw-shadow-sm">
                <div className="tw-flex tw-items-center tw-gap-2.5 tw-mb-2">
                  <div className="tw-w-9 tw-h-9 tw-rounded-full tw-bg-accent-soft tw-grid tw-place-items-center tw-font-semibold tw-text-xs tw-shrink-0" style={{ color: "var(--accent-ink)" }}>
                    {u.nombre.split(" ").map(x => x[0]).slice(0,2).join("")}
                  </div>
                  <div className="tw-flex-1 tw-min-w-0">
                    <div className="tw-font-medium tw-text-sm">{u.nombre}</div>
                    <div className="muted mono tw-text-[11px]">{u.usuario}</div>
                  </div>
                  <span className="chip">{u.rol}</span>
                  <button className="btn sm ghost" onClick={() => setCfgUsuario(u)}><Icon name="settings" size={14}/></button>
                </div>
                <div className="tw-grid tw-grid-cols-1 min-[360px]:tw-grid-cols-2 tw-gap-x-3 tw-gap-y-1 tw-text-xs">
                  <div><span className="muted">Permisos:</span> {u.permisos ? u.permisos.join(", ") : "—"}</div>
                </div>
              </div>
            ))}
            <Pagination {...pagUsr} label="usuarios"/>
          </div>
        </>
      )}

      {showAdd && (
        <Modal title="Nuevo cajero" bottomSheet onClose={() => { setShowAdd(false); resetNuevo(); }} footer={
          <>
            <button className="btn ghost" onClick={() => { setShowAdd(false); resetNuevo(); }}>Cancelar</button>
            <button className="btn primary" disabled={creando} onClick={handleCrearCajero}>
              <Icon name="check"/> {creando ? "Creando…" : "Crear cajero"}
            </button>
          </>
        }>
          {errCrear && (
            <div className="tw-bg-bad-soft tw-text-bad tw-py-2 tw-px-3 tw-rounded-md tw-text-xs tw-mb-3 tw-font-medium">
              {errCrear}
            </div>
          )}
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-x-3">
            <div className="field"><label>Nombres</label>
              <input value={nuevo.nombres} onChange={e => setN("nombres", e.target.value)} placeholder="Ej: Carolina"/></div>
            <div className="field"><label>Apellidos</label>
              <input value={nuevo.apellidos} onChange={e => setN("apellidos", e.target.value)} placeholder="Ej: Mendoza"/></div>
            <div className="field"><label>Documento</label>
              <input className="mono" value={nuevo.doc} onChange={e => setN("doc", e.target.value)} placeholder="C.C."/></div>
            <div className="field"><label>Rol</label>
              <select value={nuevo.rol} onChange={e => setN("rol", e.target.value)}><option>Cajero</option>{!esSupervisor && <option>Supervisor</option>}</select></div>
            <div className="field"><label>Usuario POS</label>
              <input className="mono" value={nuevo.usuario} onChange={e => setN("usuario", e.target.value)} placeholder="nombre.apellido"/></div>
            <div className="field"><label>Contraseña</label>
              <input className="mono" type="password" value={nuevo.pass} onChange={e => setN("pass", e.target.value)} placeholder="mín. 4 caracteres"/></div>
          </div>
        </Modal>
      )}
      {cfgCajero && <CajeroConfig cajero={cfgCajero} esSupervisor={esSupervisor} onClose={() => setCfgCajero(null)} onDone={(msg) => { setCfgCajero(null); setToast(msg); }}/>}
      {cfgUsuario && <UsuarioConfig usuario={cfgUsuario} esSupervisor={esSupervisor} onClose={() => setCfgUsuario(null)} onDone={(msg) => { setCfgUsuario(null); setToast(msg); }}/>}
      {verCierre && <CierreDetalleModal turno={verCierre} cierre={cierreDe(verCierre.id)} onClose={() => setVerCierre(null)}/>}
      {toast && <Toast msg={toast} onDone={() => setToast(null)}/>}
    </>
  );
};

// ---- Modal de configuración de cajero ----
const CajeroConfig = ({ cajero, onClose, onDone, esSupervisor }) => {
  const [nombre, setNombre] = useStateA(cajero.nombre);
  const [doc, setDoc] = useStateA(cajero.doc);
  const [rol, setRol] = useStateA(cajero.rol);
  const [estado, setEstado] = useStateA(cajero.estado);
  const [newPass, setNewPass] = useStateA("");
  const [saving, setSaving] = useStateA(false);

  const usuario = useMemoA(() => {
    const u = MOCK.usuarios_sistema.find(u => u.nombre === cajero.nombre);
    return u ? u.usuario : null;
  }, [cajero]);

  const handleSave = async () => {
    setSaving(true);
    const updates = {};
    if (nombre !== cajero.nombre) updates.nombre = nombre;
    if (doc !== cajero.doc) updates.doc = doc;
    if (rol !== cajero.rol) updates.rol = rol;
    if (estado !== cajero.estado) updates.estado = estado;

    if (Object.keys(updates).length > 0) {
      const err = await DB.cajeros.update(cajero.id, updates);
      if (!err) {
        const idx = MOCK.cajeros.findIndex(c => c.id === cajero.id);
        if (idx !== -1) Object.assign(MOCK.cajeros[idx], updates);
      }
    }

    if (newPass && usuario) {
      const hashed = await window.hashPass(newPass);
      await DB.cajeros.updateUsuario(usuario, { pass: hashed });
    }

    if (updates.nombre && usuario) {
      const uIdx = MOCK.usuarios_sistema.findIndex(u => u.usuario === usuario);
      if (uIdx !== -1) MOCK.usuarios_sistema[uIdx].nombre = updates.nombre;
      await DB.cajeros.updateUsuario(usuario, { nombre: updates.nombre });
    }

    setSaving(false);
    onDone("Cajero actualizado correctamente");
  };


  const toggleEstado = () => setEstado(estado === "activo" ? "inactivo" : "activo");

  const initials = nombre.split(" ").map(x => x[0]).slice(0,2).join("");

  return (
    <Modal title="Configurar cajero" bottomSheet onClose={onClose} footer={
      <>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={saving} onClick={handleSave}><Icon name="check"/> Guardar</button>
      </>
    }>
      {/* Header */}
      <div className="tw-flex tw-items-center tw-gap-3 tw-mb-4">
        <div className="tw-w-10 tw-h-10 tw-rounded-full tw-bg-accent-soft tw-grid tw-place-items-center tw-font-semibold tw-text-sm" style={{ color: "var(--accent-ink)" }}>
          {initials}
        </div>
        <div>
          <div className="tw-font-medium">{cajero.nombre}</div>
          <div className="muted mono tw-text-xs">{cajero.id} · {cajero.doc}</div>
        </div>
      </div>

      {/* Datos personales */}
      <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide muted tw-mb-2">Datos personales</div>
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-x-3">
        <div className="field"><label>Nombre</label><input value={nombre} onChange={e => setNombre(e.target.value)}/></div>
        <div className="field"><label>Documento</label><input className="mono" value={doc} onChange={e => setDoc(e.target.value)}/></div>
        <div className="field"><label>Rol</label><select value={rol} onChange={e => setRol(e.target.value)}><option>Cajero</option>{!esSupervisor && <option>Supervisor</option>}</select></div>
      </div>

      {/* Credenciales */}
      <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide muted tw-mb-2 tw-mt-4">Credenciales</div>
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-x-3">
        <div className="field"><label>Usuario</label><input className="mono" value={usuario || "—"} readOnly style={{opacity:0.6}}/></div>
        <div className="field"><label>Nueva contraseña</label><input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Dejar vacío para no cambiar"/></div>
      </div>

      {/* Estado */}
      <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide muted tw-mb-2 tw-mt-4">Estado</div>
      <button className={"chip " + (estado === "activo" ? "good" : "bad")} onClick={toggleEstado} style={{cursor:"pointer"}}>
        <span className="dot"/>{estado === "activo" ? "Activo" : "Inactivo"} <span className="muted tw-text-[10px] tw-ml-1">(click para cambiar)</span>
      </button>

    </Modal>
  );
};

// ---- Modal de configuración de usuario (no-cajero) ----
const UsuarioConfig = ({ usuario, onClose, onDone, esSupervisor }) => {
  const [nombre, setNombre] = useStateA(usuario.nombre);
  const [rol, setRol] = useStateA(usuario.rol);
  const [newPass, setNewPass] = useStateA("");
  const [saving, setSaving] = useStateA(false);

  const initials = nombre.split(" ").map(x => x[0]).slice(0,2).join("");

  const handleSave = async () => {
    setSaving(true);
    const updates = {};
    if (nombre !== usuario.nombre) updates.nombre = nombre;
    if (rol !== usuario.rol) updates.rol = rol;
    if (newPass) updates.pass = await window.hashPass(newPass);

    if (Object.keys(updates).length > 0) {
      await DB.cajeros.updateUsuario(usuario.usuario, updates);
      const idx = MOCK.usuarios_sistema.findIndex(u => u.usuario === usuario.usuario);
      if (idx !== -1) {
        if (updates.nombre) MOCK.usuarios_sistema[idx].nombre = updates.nombre;
        if (updates.rol) MOCK.usuarios_sistema[idx].rol = updates.rol;
      }
    }

    setSaving(false);
    onDone("Usuario actualizado correctamente");
  };

  return (
    <Modal title="Configurar usuario" bottomSheet onClose={onClose} footer={
      <>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={saving} onClick={handleSave}><Icon name="check"/> Guardar</button>
      </>
    }>
      {/* Header */}
      <div className="tw-flex tw-items-center tw-gap-3 tw-mb-4">
        <div className="tw-w-10 tw-h-10 tw-rounded-full tw-bg-accent-soft tw-grid tw-place-items-center tw-font-semibold tw-text-sm" style={{ color: "var(--accent-ink)" }}>
          {initials}
        </div>
        <div>
          <div className="tw-font-medium">{usuario.nombre}</div>
          <div className="muted mono tw-text-xs">{usuario.usuario}</div>
        </div>
      </div>

      {/* Datos */}
      <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide muted tw-mb-2">Datos</div>
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-x-3">
        <div className="field"><label>Nombre</label><input value={nombre} onChange={e => setNombre(e.target.value)}/></div>
        <div className="field"><label>Rol</label><select value={rol} onChange={e => setRol(e.target.value)}><option>Supervisor</option>{!esSupervisor && <option>Administrador</option>}</select></div>
      </div>

      {/* Credenciales */}
      <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide muted tw-mb-2 tw-mt-4">Credenciales</div>
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-x-3">
        <div className="field"><label>Usuario</label><input className="mono" value={usuario.usuario} readOnly style={{opacity:0.6}}/></div>
        <div className="field"><label>Nueva contraseña</label><input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Dejar vacío para no cambiar"/></div>
      </div>
    </Modal>
  );
};

Object.assign(window, { Cajeros, CajeroConfig, UsuarioConfig });
