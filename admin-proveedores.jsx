// Proveedores

// Categorías de proveedor: lista editable guardada en la tabla `configuracion`
// (clave "categorias_proveedor"), igual que las categorías de producto. Se mezcla
// con los defaults y con las que ya usan los proveedores. Devuelve nombres (strings).
const PROV_CAT_DEFAULT = ["Abarrotes", "Lácteos", "Frutas y verduras", "Aseo", "Bebidas", "Panadería", "Otros"];
const getCategoriasProveedor = () => {
  const cfg = (window.MOCK && MOCK.configuracion) || {};
  let custom = null;
  try { const v = JSON.parse(cfg.categorias_proveedor || "null"); if (Array.isArray(v)) custom = v.filter(Boolean).map(String); } catch {}
  const map = new Map();
  (custom && custom.length ? custom : PROV_CAT_DEFAULT).forEach(n => { if (n) map.set(String(n), true); });
  (window.MOCK && MOCK.proveedores ? MOCK.proveedores : []).forEach(p => { if (p.categoria) map.set(p.categoria, true); });
  return Array.from(map.keys());
};

const Proveedores = () => {
  const [list, setList] = useStateA(() => MOCK.proveedores || []);
  const [q, setQ] = useStateA("");
  const [estado, setEstado] = useStateA("Todos");
  const [categoria, setCategoria] = useStateA("Todas");
  const [editing, setEditing] = useStateA(null);
  const [confirmBaja, setConfirmBaja] = useStateA(null);
  const [toast, setToast] = useStateA(null);
  const [expandedId, setExpandedId] = useStateA(null);
  const [viewMode, setViewMode] = useStateA("lista");
  const [showCats, setShowCats] = useStateA(false);
  const [, _catTick] = useStateA(0);
  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  const _modalRef = React.useRef(false);
  _modalRef.current = !!editing || !!confirmBaja;
  React.useEffect(() => {
    const off = window.EventBus.on("realtime:proveedores", () => {
      if (!_modalRef.current) setList(MOCK.proveedores || []);
    });
    // Categorías de proveedor viven en config: re-render al cambiarlas (local o realtime)
    const offCfg1 = window.EventBus.on("config:change", () => _catTick(n => n + 1));
    const offCfg2 = window.EventBus.on("realtime:configuracion", () => _catTick(n => n + 1));
    return () => { off(); offCfg1(); offCfg2(); };
  }, []);

  const categorias = useMemoA(() => ["Todas", ...Array.from(new Set(list.map(p => p.categoria)))], [list]);
  const filtered = useMemoA(() => {
    let l = list;
    if (estado !== "Todos") l = l.filter((p) => p.estado === estado);
    if (categoria !== "Todas") l = l.filter((p) => p.categoria === categoria);
    if (q) {
      const query = q.toLowerCase();
      l = l.filter((p) => {
        const nombre = (p.nombre || "").toLowerCase();
        const nit = (p.nit || "").toLowerCase();
        const contacto = (p.contacto || "").toLowerCase();
        const email = (p.email || "").toLowerCase();
        return nombre.includes(query) || nit.includes(query) || contacto.includes(query) || email.includes(query);
      });
    }
    return [...l].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [list, q, estado, categoria]);

  const stats = useMemoA(() => {
    const activos = list.filter((p) => p.estado === "activo").length;
    return { total: list.length, activos, inactivos: list.length - activos };
  }, [list]);
  const activos = stats.activos;
  const inactivos = stats.inactivos;
  const pagProv = usePagination(filtered, 10);

  const guardar = async (data) => {
    let resultado = { ok: true, message: "" };
    if (data.id) {
      const error = await DB.proveedores.update(data.id, data);
      resultado = { ok: !error, message: error ? "Error al guardar: " + (error.message || "Intenta de nuevo") : "Proveedor actualizado" };
    } else {
      // id robusto = max(PRV-NNN existentes) + 1. Antes era length+1, que colisionaba
      // (duplicate key) si habia huecos o al crear dos seguidos antes del realtime.
      const base = MOCK.proveedores || list || [];
      const nums = base.map(p => parseInt(String(p.id || "").replace(/\D/g, ""), 10)).filter(n => !isNaN(n));
      const nextId = `PRV-${String((nums.length ? Math.max.apply(null, nums) : 0) + 1).padStart(3, "0")}`;
      const nuevo = { ...data, id: nextId, ingresos: 0, ultimoIngreso: null, estado: "activo" };
      const error = await DB.proveedores.create(nuevo);
      resultado = { ok: !error, message: error ? "Error al crear: " + (error.message || "Intenta de nuevo") : "Proveedor creado" };
      // Optimista: mostrar el proveedor nuevo de inmediato (el realtime lo confirma luego)
      if (!error && MOCK.proveedores && !MOCK.proveedores.some(p => p.id === nextId)) {
        MOCK.proveedores.push(nuevo);
      }
    }
    if (!resultado.ok) {
      setToast(resultado.message);
      return;
    }
    setList((MOCK.proveedores || []).slice());
    setEditing(null);
    setToast(resultado.message);
  };

  const toggleEstado = async (p) => {
    const nuevoEstado = p.estado === "activo" ? "inactivo" : "activo";
    const error = await DB.proveedores.update(p.id, { estado: nuevoEstado });
    if (error) {
      setToast("No se pudo cambiar el estado: " + (error.message || "Intenta de nuevo"));
      return;
    }
    setList(MOCK.proveedores || []);
    setToast(p.estado === "activo" ? "Proveedor dado de baja" : "Proveedor reactivado");
    setConfirmBaja(null);
  };

  return (
    <>
      <div className="page-h tw-flex tw-flex-col sm:tw-flex-row tw-gap-3 sm:tw-items-center sm:tw-justify-between">
        <div>
          <h2>Proveedores</h2>
          <p className="sub">Crea, edita o da de baja a las empresas que abastecen tu inventario.</p>
        </div>
        <div className="tw-flex tw-gap-2 tw-w-full sm:tw-w-auto">
          <button className="btn sm tw-flex-1 sm:tw-flex-none" onClick={() => setShowCats(true)} title="Administrar categorías de proveedor">Categorías</button>
          <button className="btn primary tw-flex-1 sm:tw-flex-none" onClick={() => setEditing("new")}><Icon name="plus" size={14}/> Nuevo proveedor</button>
        </div>
      </div>

      <div className="prov-kpis tw-grid tw-grid-cols-3 tw-gap-2 tw-mt-2">
        <div className="kpi">
          <div className="label tw-text-[11px] sm:tw-text-xs"><Icon name="users" size={14}/> Total</div>
          <div className="val">{list.length}</div>
        </div>
        <div className="kpi">
          <div className="label tw-text-[11px] sm:tw-text-xs"><Icon name="check" size={14}/> Activos</div>
          <div className="val" style={{ color: "var(--good)" }}>{activos}</div>
        </div>
        <div className="kpi">
          <div className="label tw-text-[11px] sm:tw-text-xs"><Icon name="x" size={14}/> Baja</div>
          <div className="val" style={{ color: "var(--text-3)" }}>{inactivos}</div>
        </div>
      </div>

      <div className="card tw-mt-2 tw-p-3 sm:tw-p-4">
        <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-flex-wrap sm:tw-items-center tw-justify-between tw-gap-2 tw-mb-3">
          <div className="search tw-w-full sm:tw-w-auto sm:tw-flex-1 sm:tw-min-w-[200px]" style={{ minWidth: 0 }}>
            <Icon name="search" size={14}/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar nombre, NIT, contacto…"/>
          </div>
          <div className="tw-flex tw-gap-2 tw-w-full sm:tw-w-auto tw-min-w-0">
            <div className="select-pill tw-flex-1 tw-min-w-0 sm:tw-flex-none"><span className="lbl">Estado</span>
              <select value={estado} onChange={e => setEstado(e.target.value)} className="tw-min-w-0">
                <option>Todos</option><option value="activo">Activos</option><option value="inactivo">Inactivos</option>
              </select>
            </div>
            <div className="select-pill tw-flex-1 tw-min-w-0 sm:tw-flex-none"><span className="lbl">Categoría</span>
              <select value={categoria} onChange={e => setCategoria(e.target.value)} className="tw-min-w-0">
                {categorias.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="prov-view-switcher">
              <button
                type="button"
                className={"btn xs " + (viewMode === "lista" ? "primary" : "ghost")}
                style={{ height: 26, fontSize: 11, padding: "0 8px" }}
                onClick={() => setViewMode("lista")}
                title="Vista en lista acordeón"
              >
                Lista
              </button>
              <button
                type="button"
                className={"btn xs " + (viewMode === "tabla" ? "primary" : "ghost")}
                style={{ height: 26, fontSize: 11, padding: "0 8px" }}
                onClick={() => setViewMode("tabla")}
                title="Vista en tabla"
              >
                Tabla
              </button>
            </div>
            <div className="muted mono tw-text-xs tw-self-center tw-hidden sm:tw-block">{filtered.length}/{list.length}</div>
          </div>
        </div>

        {/* Vista Acordeón (activa por defecto y obligatoria en móvil) */}
        <div className={"prov-accordion-list " + (viewMode === "tabla" ? "md:tw-hidden" : "")}>
          {pagProv.slice.map(p => {
            const isExpanded = expandedId === p.id;
            return (
              <div
                key={p.id}
                className={"prov-accordion-item" + (isExpanded ? " open" : "") + (p.estado !== "activo" ? " inactivo" : "")}
              >
                {/* Encabezado: solo el nombre del proveedor */}
                <div
                  className="prov-accordion-header"
                  onClick={() => toggleExpand(p.id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                >
                  <div className="prov-accordion-avatar">
                    {p.nombre.split(" ").map(x => x[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div className="prov-accordion-title">
                    <span className="prov-accordion-name" title={p.nombre}>{p.nombre}</span>
                    {p.estado !== "activo" && (
                      <span className="chip bad tw-text-[10px] tw-py-0.5 tw-px-2">Inactivo</span>
                    )}
                  </div>
                  <div className="prov-accordion-chevron">
                    <Icon name="chevronDown" size={16} />
                  </div>
                </div>

                {/* Acordeón desplegado: resto de la información */}
                {isExpanded && (
                  <div className="prov-accordion-body">
                    <div className="prov-details-grid">
                      <div className="prov-detail-item">
                        <span className="prov-detail-label">NIT</span>
                        <span className="prov-detail-value mono">{p.nit || "—"}</span>
                      </div>
                      <div className="prov-detail-item">
                        <span className="prov-detail-label">ID Proveedor</span>
                        <span className="prov-detail-value mono">{p.id}</span>
                      </div>
                      <div className="prov-detail-item">
                        <span className="prov-detail-label">Categoría</span>
                        <span className="prov-detail-value"><span className="chip">{p.categoria || "General"}</span></span>
                      </div>
                      <div className="prov-detail-item">
                        <span className="prov-detail-label">Ciudad</span>
                        <span className="prov-detail-value">{p.ciudad || "—"}</span>
                      </div>
                      <div className="prov-detail-item">
                        <span className="prov-detail-label">Contacto</span>
                        <span className="prov-detail-value">{p.contacto || "—"}</span>
                      </div>
                      <div className="prov-detail-item">
                        <span className="prov-detail-label">Teléfono</span>
                        <span className="prov-detail-value mono">
                          {p.tel ? (
                            <a href={`tel:${p.tel.replace(/[^\d+]/g, '')}`} style={{ color: "var(--accent)", textDecoration: "none" }}>
                              📞 {p.tel}
                            </a>
                          ) : "—"}
                        </span>
                      </div>
                      {p.email && (
                        <div className="prov-detail-item">
                          <span className="prov-detail-label">Correo</span>
                          <span className="prov-detail-value">
                            <a href={`mailto:${p.email}`} style={{ color: "var(--accent)", textDecoration: "none" }}>
                              ✉️ {p.email}
                            </a>
                          </span>
                        </div>
                      )}
                      <div className="prov-detail-item">
                        <span className="prov-detail-label">Términos</span>
                        <span className="prov-detail-value">{p.terminos || "Contado"}</span>
                      </div>
                      <div className="prov-detail-item">
                        <span className="prov-detail-label">Estado</span>
                        <span className="prov-detail-value">
                          <span className={"chip " + (p.estado === "activo" ? "good" : "bad")}>
                            <span className="dot"/>{p.estado === "activo" ? "Activo" : "Inactivo"}
                          </span>
                        </span>
                      </div>
                      <div className="prov-detail-item">
                        <span className="prov-detail-label">Ingresos</span>
                        <span className="prov-detail-value mono">
                          <strong>{p.ingresos || 0}</strong> {p.ingresos === 1 ? "ingreso" : "ingresos"}
                        </span>
                      </div>
                      <div className="prov-detail-item">
                        <span className="prov-detail-label">Último ingreso</span>
                        <span className="prov-detail-value mono">{p.ultimoIngreso || "Sin registro"}</span>
                      </div>
                    </div>

                    <div className="prov-accordion-actions">
                      <button
                        type="button"
                        className="btn sm"
                        onClick={(e) => { e.stopPropagation(); setEditing(p); }}
                        title="Editar proveedor"
                      >
                        <Icon name="edit" size={13}/> Editar
                      </button>
                      <button
                        type="button"
                        className={"btn sm " + (p.estado === "activo" ? "ghost bad" : "primary")}
                        onClick={(e) => { e.stopPropagation(); setConfirmBaja(p); }}
                        title={p.estado === "activo" ? "Dar de baja" : "Reactivar"}
                      >
                        <Icon name={p.estado === "activo" ? "trash" : "check"} size={13}/>
                        {p.estado === "activo" ? "Dar de baja" : "Reactivar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="muted tw-text-center tw-py-8">Sin resultados con los filtros aplicados</div>
          )}
        </div>

        {/* Vista Tabla clásica (solo en desktop cuando viewMode === "tabla") */}
        {viewMode === "tabla" && (
          <div className="tbl-wrap tw-hidden md:tw-block">
            <table className="tbl prov-table">
              <thead>
                <tr>
                  <th>Proveedor</th><th>NIT</th><th>Categoría</th><th>Contacto</th>
                  <th>Términos</th><th>Estado</th><th className="num">Ingresos</th><th>Último</th><th></th>
                </tr>
              </thead>
              <tbody>
                {pagProv.slice.map(p => (
                  <tr key={p.id} className="row-hover">
                    <td>
                      <div className="row">
                        <div className="tw-w-8 tw-h-8 tw-rounded-lg tw-bg-accent-soft tw-grid tw-place-items-center tw-font-semibold tw-text-xs" style={{ color: "var(--accent-ink)" }}>
                          {p.nombre.split(" ").map(x => x[0]).slice(0,2).join("").toUpperCase()}
                        </div>
                        <div>
                          <div className="tw-font-medium">{p.nombre}</div>
                          <div className="muted mono tw-text-[11px]">{p.id} · {p.ciudad}</div>
                        </div>
                      </div>
                    </td>
                    <td className="mono">{p.nit}</td>
                    <td><span className="chip">{p.categoria}</span></td>
                    <td>
                      <div className="tw-text-[13px]">{p.contacto}</div>
                      <div className="muted mono tw-text-[11px]">{p.tel}</div>
                    </td>
                    <td className="mono tw-text-xs">{p.terminos}</td>
                    <td>
                      <span className={"chip " + (p.estado === "activo" ? "good" : "bad")}>
                        <span className="dot"/>{p.estado}
                      </span>
                    </td>
                    <td className="num mono">{p.ingresos}</td>
                    <td className="mono muted tw-text-xs">{p.ultimoIngreso || "—"}</td>
                    <td className="num">
                      <div className="tw-flex tw-justify-end tw-gap-1">
                        <button className="btn sm ghost" title="Editar" onClick={() => setEditing(p)}>
                          <Icon name="edit" size={13}/>
                        </button>
                        <button className="btn sm ghost" title={p.estado === "activo" ? "Dar de baja" : "Reactivar"}
                          onClick={() => setConfirmBaja(p)}>
                          <Icon name={p.estado === "activo" ? "trash" : "check"} size={13}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan="9" className="muted tw-text-center tw-py-8">Sin resultados con los filtros aplicados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <Pagination {...pagProv} label="proveedores"/>
      </div>

      {editing && (
        <ProveedorForm
          inicial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={guardar}
        />
      )}

      {showCats && <CategoriasProveedorModal onClose={() => setShowCats(false)}/>}

      {confirmBaja && (
        <Modal title={confirmBaja.estado === "activo" ? "Dar de baja proveedor" : "Reactivar proveedor"}
          onClose={() => setConfirmBaja(null)} bottomSheet
          footer={
            <>
              <button className="btn ghost" onClick={() => setConfirmBaja(null)}>Cancelar</button>
              <button className={"btn " + (confirmBaja.estado === "activo" ? "danger" : "primary")}
                onClick={() => toggleEstado(confirmBaja)}>
                <Icon name={confirmBaja.estado === "activo" ? "trash" : "check"} size={14}/>
                {confirmBaja.estado === "activo" ? " Dar de baja" : " Reactivar"}
              </button>
            </>
          }>
          {confirmBaja.estado === "activo" ? (
            <p>El proveedor <strong>{confirmBaja.nombre}</strong> dejará de aparecer al registrar nuevos ingresos. Su historial ({confirmBaja.ingresos} ingresos) se conservará. Puedes reactivarlo en cualquier momento.</p>
          ) : (
            <p>Vas a reactivar a <strong>{confirmBaja.nombre}</strong>. Volverá a estar disponible para registrar ingresos.</p>
          )}
        </Modal>
      )}

      {toast && <Toast msg={toast} onDone={() => setToast(null)}/>}
    </>
  );
};

const ProveedorForm = ({ inicial, onClose, onSave }) => {
  // inicial es una instancia de Proveedor (datos en getters); se copia a un objeto PLANO.
  // Si no, el { ...prev } de set() —spread de la instancia— borraría los demás campos al
  // editar el primero (los getters no se copian con spread).
  const [d, setD] = useStateA(() => inicial ? {
    id: inicial.id, nombre: inicial.nombre, nit: inicial.nit, contacto: inicial.contacto,
    tel: inicial.tel, email: inicial.email, ciudad: inicial.ciudad,
    categoria: inicial.categoria, terminos: inicial.terminos,
    estado: inicial.estado, ingresos: inicial.ingresos, ultimoIngreso: inicial.ultimoIngreso,
  } : {
    nombre: "", nit: "", contacto: "", tel: "", email: "",
    ciudad: "", categoria: "Abarrotes", terminos: "30 días"
  });
  const set = (k, v) => setD(prev => ({ ...prev, [k]: v }));
  const valid = d.nombre && d.nit && d.contacto && d.tel;

  return (
    <Modal title={inicial ? "Editar proveedor" : "Nuevo proveedor"} onClose={onClose} lg bottomSheet footer={
      <>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={!valid} onClick={() => onSave(d)}>
          <Icon name="check" size={14}/> {inicial ? "Guardar cambios" : "Crear proveedor"}
        </button>
      </>
    }>
      <div className="tw-grid tw-grid-cols-2 tw-gap-x-3 tw-gap-y-0">
        <div className="field tw-col-span-2 sm:tw-col-span-1"><label>Razón social *</label>
          <input value={d.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej: Distribuidora El Sol"/></div>
        <div className="field tw-col-span-2 sm:tw-col-span-1"><label>NIT *</label>
          <input className="mono" value={d.nit} onChange={e => set("nit", e.target.value)} placeholder="900.000.000-0"/></div>
        <div className="field"><label>Categoría</label>
          <select value={d.categoria} onChange={e => set("categoria", e.target.value)}>
            {getCategoriasProveedor().map(c => <option key={c} value={c}>{c}</option>)}
          </select></div>
        <div className="field"><label>Términos de pago</label>
          <select value={d.terminos} onChange={e => set("terminos", e.target.value)}>
            <option>Contado</option><option>15 días</option><option>30 días</option><option>45 días</option><option>60 días</option>
          </select></div>
        <div className="field tw-col-span-2 sm:tw-col-span-1"><label>Contacto *</label>
          <input value={d.contacto} onChange={e => set("contacto", e.target.value)} placeholder="Ej: Mauricio Rendón"/></div>
        <div className="field tw-col-span-2 sm:tw-col-span-1"><label>Teléfono *</label>
          <input className="mono" value={d.tel} onChange={e => set("tel", e.target.value)} placeholder="(4) 444 0000"/></div>
        <div className="field"><label>Correo</label>
          <input value={d.email} onChange={e => set("email", e.target.value)} placeholder="ventas@empresa.co"/></div>
        <div className="field"><label>Ciudad</label>
          <input value={d.ciudad} onChange={e => set("ciudad", e.target.value)} placeholder="Medellín"/></div>
      </div>
    </Modal>
  );
};

// Administrar categorías de proveedor (crear / renombrar / quitar). Se guardan en
// la tabla `configuracion` (clave "categorias_proveedor"), igual que las de producto.
const CategoriasProveedorModal = ({ onClose }) => {
  const proveedores = (window.MOCK && MOCK.proveedores) || [];
  const [rows, setRows] = useStateA(() => getCategoriasProveedor().map(n => ({ orig: n, nombre: n })));
  const [nueva, setNueva] = useStateA("");
  const [saving, setSaving] = useStateA(false);
  const [error, setError] = useStateA("");

  const countOf = (name) => proveedores.filter(p => p.categoria === name).length;

  const addCat = () => {
    const n = nueva.trim();
    if (!n) return;
    if (rows.some(r => r.nombre.trim().toLowerCase() === n.toLowerCase())) { setError("Esa categoría ya existe"); return; }
    setRows(r => [...r, { orig: null, nombre: n }]);
    setNueva(""); setError("");
  };
  const removeCat = (i) => setRows(rs => rs.filter((_, idx) => idx !== i));

  const guardar = async () => {
    const names = rows.map(r => r.nombre.trim()).filter(Boolean);
    if (new Set(names.map(n => n.toLowerCase())).size !== names.length) { setError("Hay categorías repetidas"); return; }
    if (!names.length) { setError("Debe quedar al menos una categoría"); return; }
    setSaving(true); setError("");
    try {
      // Renombrados: actualizar los proveedores que usaban el nombre viejo
      for (const r of rows) {
        const nn = r.nombre.trim();
        if (r.orig && nn && r.orig !== nn) {
          for (const p of proveedores.filter(x => x.categoria === r.orig)) {
            await DB.proveedores.update(p.id, { categoria: nn });
            try { p.categoria = nn; } catch (e) {}
          }
        }
      }
      const error = await DB.config.save("categorias_proveedor", JSON.stringify(names));
      if (error) throw error;
      onClose();
    } catch (e) {
      setError("Error al guardar: " + (e && e.message ? e.message : ""));
      setSaving(false);
    }
  };

  return (
    <Modal title="Categorías de proveedor" bottomSheet onClose={onClose} footer={
      <>
        <button className="btn ghost" onClick={onClose} disabled={saving}>Cancelar</button>
        <button className="btn primary" onClick={guardar} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</button>
      </>
    }>
      <p className="muted tw-text-xs tw-mb-3" style={{ lineHeight: 1.5 }}>
        Crea o renombra las categorías de proveedor. Se guardan en la configuración
        (misma tabla que las de producto). Al renombrar, se actualizan los proveedores
        que la usaban. No puedes quitar una categoría en uso.
      </p>
      <div className="tw-flex tw-gap-1.5 tw-mb-3">
        <input className="tw-flex-1" style={{ minWidth: 0 }} value={nueva} onChange={e => setNueva(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCat(); } }} placeholder="Nueva categoría…"/>
        <button type="button" className="btn primary tw-shrink-0" onClick={addCat}><Icon name="plus" size={14}/> Agregar</button>
      </div>
      <div className="tw-flex tw-flex-col tw-gap-2">
        {rows.map((r, i) => (
          <div key={i} className="tw-flex tw-items-center tw-gap-2 tw-py-1.5 tw-px-2.5 tw-rounded-xl tw-border tw-border-border" style={{ background: "var(--surface)" }}>
            <input className="tw-flex-1 tw-text-sm" style={{ minWidth: 0, border: "1px solid transparent", background: "transparent", color: "var(--text)", padding: "4px 6px", borderRadius: 6, fontWeight: 500 }}
              value={r.nombre}
              onFocus={e => { e.target.style.border = "1px solid var(--border)"; e.target.style.background = "var(--bg)"; }}
              onBlur={e => { e.target.style.border = "1px solid transparent"; e.target.style.background = "transparent"; }}
              onChange={e => setRows(rs => rs.map((x, idx) => idx === i ? { ...x, nombre: e.target.value } : x))}/>
            <span className="chip tw-shrink-0">{r.orig ? countOf(r.orig) + " prov." : "nueva"}</span>
            <button type="button" className="btn sm ghost tw-shrink-0" title={r.orig && countOf(r.orig) > 0 ? "No se puede quitar: está en uso" : "Quitar"} onClick={() => removeCat(i)} disabled={!!r.orig && countOf(r.orig) > 0}><Icon name="x" size={14}/></button>
          </div>
        ))}
        {rows.length === 0 && <div className="muted tw-text-xs tw-text-center tw-py-4 tw-rounded-xl tw-border tw-border-dashed tw-border-border">Sin categorías. Agrega una arriba.</div>}
      </div>
      {error && <div className="tw-mt-3 tw-text-xs tw-font-medium" style={{ color: "var(--bad)" }}>{error}</div>}
    </Modal>
  );
};

Object.assign(window, { Proveedores, ProveedorForm, CategoriasProveedorModal });
