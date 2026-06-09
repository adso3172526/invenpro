// Proveedores
const { useState: useStateA, useMemo: useMemoA } = React;

const Proveedores = () => {
  const [list, setList] = useStateA(MOCK.proveedores);
  const [q, setQ] = useStateA("");
  const [estado, setEstado] = useStateA("Todos");
  const [categoria, setCategoria] = useStateA("Todas");
  const [editing, setEditing] = useStateA(null);
  const [confirmBaja, setConfirmBaja] = useStateA(null);
  const [toast, setToast] = useStateA(null);

  const categorias = useMemoA(() => ["Todas", ...Array.from(new Set(list.map(p => p.categoria)))], [list]);

  const filtered = useMemoA(() => list.filter(p => {
    if (estado !== "Todos" && p.estado !== estado) return false;
    if (categoria !== "Todas" && p.categoria !== categoria) return false;
    if (q) {
      const s = q.toLowerCase();
      if (!p.nombre.toLowerCase().includes(s) &&
          !p.nit.toLowerCase().includes(s) &&
          !(p.contacto || "").toLowerCase().includes(s) &&
          !(p.email || "").toLowerCase().includes(s)) return false;
    }
    return true;
  }), [list, q, estado, categoria]);

  const activos = list.filter(p => p.estado === "activo").length;
  const inactivos = list.length - activos;
  const pagProv = usePagination(filtered, 10);
  const guardar = async (data) => {
    if (data.id) {
      await DB.updateProveedor(data.id, data);
      setToast("Proveedor actualizado");
    } else {
      const nextId = "PRV-" + String(list.length + 1).padStart(3, "0");
      const nuevo = { ...data, id: nextId, ingresos: 0, ultimoIngreso: null, estado: "activo" };
      await DB.createProveedor(nuevo);
      setToast("Proveedor creado");
    }
    await hydrateData();
    setList(MOCK.proveedores);
    setEditing(null);
  };

  const toggleEstado = async (p) => {
    const nuevoEstado = p.estado === "activo" ? "inactivo" : "activo";
    await DB.updateProveedor(p.id, { estado: nuevoEstado });
    setToast(p.estado === "activo" ? "Proveedor dado de baja" : "Proveedor reactivado");
    await hydrateData();
    setList(MOCK.proveedores);
    setConfirmBaja(null);
  };

  return (
    <>
      <div className="page-h tw-flex tw-flex-col sm:tw-flex-row tw-gap-3 sm:tw-items-center sm:tw-justify-between">
        <div>
          <h2>Proveedores</h2>
          <p className="sub">Crea, edita o da de baja a las empresas que abastecen tu inventario.</p>
        </div>
        <button className="btn primary tw-w-full sm:tw-w-auto" onClick={() => setEditing("new")}><Icon name="plus" size={14}/> Nuevo proveedor</button>
      </div>

      <div className="tw-grid tw-grid-cols-3 tw-gap-2 tw-mt-2">
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
            <div className="muted mono tw-text-xs tw-self-center tw-hidden sm:tw-block">{filtered.length}/{list.length}</div>
          </div>
        </div>

        {/* Desktop: tabla */}
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

        {/* Mobile: tarjetas */}
        <div className="tw-flex tw-flex-col tw-gap-2.5 md:tw-hidden">
          {pagProv.slice.map(p => (
            <div key={p.id} className="tw-bg-surface tw-border tw-border-border tw-rounded-xl tw-p-3 tw-shadow-sm">
              <div className="tw-flex tw-items-start tw-justify-between tw-gap-2 tw-mb-2">
                <div className="tw-flex tw-items-center tw-gap-2.5 tw-min-w-0">
                  <div className="tw-w-8 tw-h-8 tw-rounded-lg tw-bg-accent-soft tw-grid tw-place-items-center tw-font-semibold tw-text-xs tw-shrink-0" style={{ color: "var(--accent-ink)" }}>
                    {p.nombre.split(" ").map(x => x[0]).slice(0,2).join("").toUpperCase()}
                  </div>
                  <div className="tw-min-w-0">
                    <div className="tw-font-medium tw-text-sm tw-truncate">{p.nombre}</div>
                    <div className="muted mono tw-text-[11px]">{p.id} · {p.ciudad}</div>
                  </div>
                </div>
                <span className={"chip tw-shrink-0 " + (p.estado === "activo" ? "good" : "bad")}><span className="dot"/>{p.estado}</span>
              </div>
              <div className="tw-grid tw-grid-cols-2 tw-gap-x-3 tw-gap-y-1.5 tw-text-xs tw-mb-3 tw-pl-[42px]">
                <div><span className="muted">NIT:</span> <span className="mono">{p.nit}</span></div>
                <div><span className="muted">Categoría:</span> {p.categoria}</div>
                <div><span className="muted">Contacto:</span> {p.contacto}</div>
                <div><span className="muted">Tel:</span> <span className="mono">{p.tel}</span></div>
                <div><span className="muted">Términos:</span> <span className="mono">{p.terminos}</span></div>
                <div><span className="muted">Ingresos:</span> <span className="mono">{p.ingresos}</span></div>
              </div>
              <div className="tw-flex tw-justify-end tw-gap-1.5 tw-border-t tw-border-border tw-pt-2.5 tw-mt-1">
                <button className="btn sm ghost" onClick={() => setEditing(p)}><Icon name="edit" size={13}/> Editar</button>
                <button className="btn sm ghost" onClick={() => setConfirmBaja(p)}>
                  <Icon name={p.estado === "activo" ? "trash" : "check"} size={13}/> {p.estado === "activo" ? "Baja" : "Reactivar"}
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="muted tw-text-center tw-py-8">Sin resultados con los filtros aplicados</div>
          )}
        </div>
        <Pagination {...pagProv} label="proveedores"/>
      </div>

      {editing && (
        <ProveedorForm
          inicial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={guardar}
        />
      )}

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
  const [d, setD] = useStateA(inicial || {
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
            <option>Abarrotes</option><option>Lácteos</option><option>Frutas y verduras</option>
            <option>Aseo</option><option>Bebidas</option><option>Panadería</option><option>Otros</option>
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

Object.assign(window, { Proveedores, ProveedorForm });
