// Inventario / Bodega
const { useState: useStateA, useMemo: useMemoA } = React;

const Inventario = () => {
  const [q, setQ] = useStateA("");
  const [cat, setCat] = useStateA("Todos");
  const [estado, setEstado] = useStateA("Todos");
  const [toast, setToast] = useStateA(null);
  const [productos, setProductos] = useStateA(() => MOCK.productos.map(p => ({ ...p })));
  const [barcodeInputs, setBarcodeInputs] = useStateA({});
  const [editing, setEditing] = useStateA(null);
  const [saving, setSaving] = useStateA(false);

  const sinCodigo = useMemoA(() => productos.filter(p => !p.codigoBarras).length, [productos]);
  const bajo = useMemoA(() => productos.filter(p => p.stock < p.min).length, [productos]);
  const totalValor = useMemoA(() => productos.reduce((s, p) => s + p.stock * p.costo, 0), [productos]);
  const totalStock = useMemoA(() => productos.reduce((s, p) => s + p.stock, 0), [productos]);

  const rows = useMemoA(() => {
    let list = productos;
    if (cat !== "Todos") list = list.filter(p => p.categoria === cat);
    if (q) {
      const qq = q.toLowerCase().trim();
      list = list.filter(p => p.nombre.toLowerCase().includes(qq) || p.sku.toLowerCase().includes(qq) || (p.codigoBarras && p.codigoBarras.toLowerCase().includes(qq)));
    }
    if (estado === "Bajo") list = list.filter(p => p.stock < p.min);
    if (estado === "Sin stock") list = list.filter(p => p.stock === 0);
    if (estado === "Sin código") list = list.filter(p => !p.codigoBarras);
    return [...list].sort((a, b) => (a.codigoBarras ? 1 : 0) - (b.codigoBarras ? 1 : 0));
  }, [productos, q, cat, estado]);

  const pag = usePagination(rows, 8);

  const asignarCodigo = async (sku) => {
    const codigo = (barcodeInputs[sku] || "").trim();
    if (!codigo) { setToast("Escanea o digita un código de barras"); return; }
    const existente = productos.find(p => p.codigoBarras === codigo);
    if (existente) { setToast(`Este código ya está asignado a "${existente.nombre}" (${existente.sku})`); return; }
    const err = await DB.updateCodigoBarras(sku, codigo);
    if (err) { setToast("Error al guardar: " + (err.message || "Intenta de nuevo")); return; }
    setProductos(ps => ps.map(p => p.sku === sku ? { ...p, codigoBarras: codigo } : p));
    const mp = MOCK.productos.find(p => p.sku === sku);
    if (mp) mp.codigoBarras = codigo;
    setBarcodeInputs(prev => { const next = { ...prev }; delete next[sku]; return next; });
    setToast("Código de barras asignado correctamente");
  };

  const guardarProducto = async (draft) => {
    setSaving(true);
    if (draft.codigoBarras) {
      const dup = productos.find(p => p.codigoBarras === draft.codigoBarras && p.sku !== draft.sku);
      if (dup) { setToast(`Código de barras ya asignado a "${dup.nombre}"`); setSaving(false); return; }
    }
    const err = await DB.updateProducto(draft.sku, {
      nombre: draft.nombre,
      categoria: draft.categoria,
      precio: draft.precio,
      costo: draft.costo,
      stock: draft.stock,
      min: draft.min,
      unidad: draft.unidad,
      vence: draft.vence || null,
      codigoBarras: draft.codigoBarras || null,
    });
    if (err) { setToast("Error al guardar: " + (err.message || "Intenta de nuevo")); setSaving(false); return; }
    setProductos(ps => ps.map(p => p.sku === draft.sku ? { ...p, ...draft } : p));
    const mp = MOCK.productos.find(p => p.sku === draft.sku);
    if (mp) Object.assign(mp, draft);
    setEditing(null);
    setSaving(false);
    setToast("Producto actualizado");
  };

  return (
    <>
      <div className="page-h">
        <div>
          <h2>Inventario / Bodega</h2>
          <p className="sub">{productos.length} productos · {bajo} con stock bajo · valor en bodega {window.fmtCOP(totalValor)}</p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => exportXlsx("InvenPro_inventario.xlsx", [
            { name: "Inventario", rows: rows.map(p => ({
              SKU: p.sku, "Código de barras": p.codigoBarras || "", Producto: p.nombre, Categoría: p.categoria,
              Precio: p.precio, Costo: p.costo, Stock: p.stock, Mínimo: p.min, Unidad: p.unidad, Vence: p.vence || ""
            })) },
          ])}><Icon name="download" size={14}/> Exportar Excel</button>
        </div>
      </div>

      <div className="kpi-grid tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-2 md:tw-gap-[10px]">
        <div className="kpi" style={{ cursor: "pointer", borderColor: estado === "Todos" ? "var(--accent)" : undefined, background: estado === "Todos" ? "var(--accent-soft)" : undefined }} onClick={() => setEstado("Todos")}>
          <div className="label"><Icon name="box" size={14}/> Total productos</div>
          <div className="val">{productos.length}</div>
        </div>
        <div className="kpi" style={{ cursor: "pointer", borderColor: estado === "Sin código" ? "#F59E0B" : undefined, background: estado === "Sin código" ? "var(--warn-soft)" : undefined }} onClick={() => setEstado(estado === "Sin código" ? "Todos" : "Sin código")}>
          <div className="label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Sin código de barras</div>
          <div className="val" style={{ color: sinCodigo > 0 ? "#F59E0B" : "var(--good)" }}>{sinCodigo}</div>
        </div>
        <div className="kpi" style={{ cursor: "pointer", borderColor: estado === "Bajo" ? "var(--bad)" : undefined, background: estado === "Bajo" ? "var(--bad-soft)" : undefined }} onClick={() => setEstado(estado === "Bajo" ? "Todos" : "Bajo")}>
          <div className="label"><Icon name="alert" size={14}/> Stock bajo</div>
          <div className="val" style={{ color: bajo > 0 ? "var(--bad)" : "var(--good)" }}>{bajo}</div>
        </div>
        <div className="kpi" style={{ cursor: "pointer", borderColor: estado === "Todos" && cat === "Todos" && !q ? "var(--accent)" : undefined, background: estado === "Todos" && cat === "Todos" && !q ? "var(--accent-soft)" : undefined }} onClick={() => { setEstado("Todos"); setCat("Todos"); setQ(""); }}>
          <div className="label"><Icon name="truck" size={14}/> Stock total</div>
          <div className="val">{totalStock.toLocaleString("es-CO")}</div>
        </div>
      </div>

      <div className="filterbar">
        <div className="search">
          <Icon name="search" size={16}/>
          <input placeholder="Buscar por código de barras, nombre o SKU…" value={q} onChange={e => setQ(e.target.value)}/>
        </div>
        <div className="select-pill">
          <span className="lbl">Categoría</span>
          <select value={cat} onChange={e => setCat(e.target.value)}>
            <option>Todos</option>
            {CATEGORIAS.slice(1).map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="select-pill">
          <span className="lbl">Estado</span>
          <select value={estado} onChange={e => setEstado(e.target.value)}>
            <option>Todos</option>
            <option>Bajo</option>
            <option>Sin stock</option>
            <option>Sin código</option>
          </select>
        </div>
      </div>

      {/* Desktop: tabla normal */}
      <div className="tw-hidden md:tw-block">
        <div className="card">
          <div className="tbl-wrap">
            <table className="tbl tbl-bodega">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th className="num">Precio</th>
                  <th>Stock</th>
                  <th>Código de barras</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pag.slice.map(p => {
                  const stockPct = Math.min(100, (p.stock / (Math.max(p.min, 1) * 3)) * 100);
                  const stockClass = p.stock === 0 ? "bad" : p.stock < p.min ? "warn" : "good";
                  return (
                    <tr key={p.sku} className={!p.codigoBarras ? "row-sin-codigo" : "row-hover"}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{p.nombre}</div>
                        <div className="mono muted" style={{ fontSize: 11 }}>{p.sku}</div>
                      </td>
                      <td><span className="chip">{p.categoria}</span></td>
                      <td className="num mono">{window.fmtCOP(p.precio)}</td>
                      <td style={{ minWidth: 130 }}>
                        <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                          <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{p.stock} {p.unidad}</span>
                          <span className="muted mono" style={{ fontSize: 11 }}>mín {p.min}</span>
                        </div>
                        <div className={"progress " + stockClass}><span style={{ width: `${stockPct}%` }}/></div>
                      </td>
                      <td>
                        {p.codigoBarras ? (
                          <span className="mono" style={{ fontSize: 12 }}>{p.codigoBarras}</span>
                        ) : (
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <input
                              className="bodega-barcode-input mono"
                              value={barcodeInputs[p.sku] || ""}
                              onChange={e => setBarcodeInputs(prev => ({ ...prev, [p.sku]: e.target.value }))}
                              onKeyDown={e => { if (e.key === "Enter") asignarCodigo(p.sku); }}
                              placeholder="Escanear código…"
                            />
                            <button className="btn sm primary" onClick={() => asignarCodigo(p.sku)} disabled={!(barcodeInputs[p.sku] || "").trim()}>
                              <Icon name="check" size={13}/>
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="num">
                        <button className="btn sm ghost" onClick={() => setEditing({ ...p })} title="Ver / editar"><Icon name="eye" size={13}/></button>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr><td colSpan="6"><div className="empty-state">Sin productos con los filtros aplicados.</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination {...pag} label="productos"/>
        </div>
      </div>

      {/* Mobile: tarjetas con Tailwind */}
      <div className="tw-block md:tw-hidden tw-flex tw-flex-col tw-gap-3">
        {pag.slice.map(p => {
          const stockPct = Math.min(100, (p.stock / (Math.max(p.min, 1) * 3)) * 100);
          const stockClass = p.stock === 0 ? "bad" : p.stock < p.min ? "warn" : "good";
          return (
            <div key={p.sku} className={
              "tw-bg-surface tw-border tw-border-border tw-rounded-xl tw-p-3.5 tw-shadow-sm"
              + (!p.codigoBarras ? " tw-border-l-[3px] tw-border-l-amber-400" : "")
            }>
              <div className="tw-flex tw-justify-between tw-items-start tw-mb-2">
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{p.nombre}</div>
                  <div className="mono muted" style={{ fontSize: 11 }}>{p.sku}</div>
                </div>
                <button className="btn sm ghost" onClick={() => setEditing({ ...p })} title="Ver / editar"><Icon name="eye" size={13}/></button>
              </div>
              <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
                <span className="chip">{p.categoria}</span>
                <span className="mono" style={{ fontSize: 12, color: "var(--text-2)" }}>{window.fmtCOP(p.precio)}</span>
              </div>
              <div className="tw-mb-2">
                <div className="tw-flex tw-justify-between tw-mb-1">
                  <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{p.stock} {p.unidad}</span>
                  <span className="muted mono" style={{ fontSize: 11 }}>mín {p.min}</span>
                </div>
                <div className={"progress " + stockClass}><span style={{ width: `${stockPct}%` }}/></div>
              </div>
              <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 10, marginTop: 6 }}>
                {p.codigoBarras ? (
                  <span className="mono" style={{ fontSize: 12 }}>{p.codigoBarras}</span>
                ) : (
                  <div className="tw-flex tw-flex-col tw-gap-2">
                    <input
                      className="bodega-barcode-input mono"
                      value={barcodeInputs[p.sku] || ""}
                      onChange={e => setBarcodeInputs(prev => ({ ...prev, [p.sku]: e.target.value }))}
                      onKeyDown={e => { if (e.key === "Enter") asignarCodigo(p.sku); }}
                      placeholder="Escanear código…"
                      style={{ width: "100%", minHeight: 44, fontSize: 16 }}
                    />
                    <button className="btn sm primary" style={{ width: "100%", justifyContent: "center", minHeight: 44 }} onClick={() => asignarCodigo(p.sku)} disabled={!(barcodeInputs[p.sku] || "").trim()}>
                      <Icon name="check" size={13}/> Asignar
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="empty-state">Sin productos con los filtros aplicados.</div>
        )}
        <Pagination {...pag} label="productos"/>
      </div>

      {editing && <ProductoEditModal
        producto={editing}
        saving={saving}
        onClose={() => setEditing(null)}
        onSave={guardarProducto}
      />}

      {toast && <Toast msg={toast} onDone={() => setToast(null)}/>}
    </>
  );
};

const ProductoEditModal = ({ producto, saving, onClose, onSave }) => {
  const [d, setD] = useStateA({ ...producto });
  const set = (k, v) => setD(prev => ({ ...prev, [k]: v }));
  const venceDays = d.vence ? window.daysFromNow(d.vence) : null;

  return (
    <Modal title="Editar producto" lg onClose={onClose} footer={
      <>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={saving || !d.nombre} onClick={() => onSave(d)}>
          <Icon name="check" size={14}/> {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </>
    }>
      <div style={{ padding: "8px 0 12px", borderBottom: "1px solid var(--border)", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--accent-soft)", color: "var(--accent-ink)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 14 }}>
          {d.nombre ? d.nombre.charAt(0).toUpperCase() : "?"}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{d.nombre || "Producto"}</div>
          <div className="mono muted" style={{ fontSize: 11 }}>{d.sku}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="field"><label>Nombre *</label>
          <input value={d.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Nombre del producto"/></div>
        <div className="field"><label>Categoría</label>
          <select value={d.categoria} onChange={e => set("categoria", e.target.value)}>
            {CATEGORIAS.slice(1).map(c => <option key={c}>{c}</option>)}
            <option value="General">General</option>
          </select></div>
      </div>

      <div className="grid-2">
        <div className="field"><label>Precio de venta</label>
          <input className="mono" type="number" min="0" value={d.precio} onChange={e => set("precio", parseInt(e.target.value) || 0)}/></div>
        <div className="field"><label>Costo</label>
          <input className="mono" type="number" min="0" value={d.costo} onChange={e => set("costo", parseInt(e.target.value) || 0)}/></div>
      </div>

      <div className="grid-2">
        <div className="field"><label>Stock actual</label>
          <input className="mono" type="number" min="0" value={d.stock} onChange={e => set("stock", parseInt(e.target.value) || 0)}/></div>
        <div className="field"><label>Stock mínimo</label>
          <input className="mono" type="number" min="0" value={d.min} onChange={e => set("min", parseInt(e.target.value) || 0)}/></div>
      </div>

      <div className="grid-2">
        <div className="field"><label>Unidad</label>
          <select value={d.unidad} onChange={e => set("unidad", e.target.value)}>
            <option value="und">und</option><option value="kg">kg</option><option value="g">g</option>
            <option value="lb">lb</option><option value="lt">lt</option><option value="ml">ml</option>
            <option value="paq">paq</option><option value="caja">caja</option>
          </select></div>
        <div className="field"><label>Vencimiento</label>
          <input type="date" value={d.vence || ""} onChange={e => set("vence", e.target.value || null)}/>
          {venceDays !== null && venceDays <= 14 && (
            <span className={"chip mt-1 " + (venceDays <= 5 ? "bad" : "warn")} style={{ fontSize: 10 }}>
              {venceDays <= 0 ? "Vencido" : `Vence en ${venceDays} días`}
            </span>
          )}
        </div>
      </div>

      <div className="field">
        <label>Código de barras</label>
        <input className="mono bodega-barcode-input" style={{ width: "100%" }} value={d.codigoBarras || ""} onChange={e => set("codigoBarras", e.target.value || null)} placeholder="Escanear o digitar código de barras…"/>
        {!d.codigoBarras && <span className="muted" style={{ fontSize: 11, marginTop: 4, display: "block" }}>Puedes asignarlo ahora o después desde la tabla.</span>}
      </div>

      {d.precio > 0 && d.costo > 0 && (
        <div style={{ marginTop: 8, padding: "10px 14px", background: "var(--surface-2)", borderRadius: 8, fontSize: 12, display: "flex", justifyContent: "space-between" }}>
          <span className="muted">Margen de ganancia</span>
          <span className="mono" style={{ fontWeight: 600 }}>{Math.round(((d.precio - d.costo) / d.costo) * 100)}%</span>
        </div>
      )}
    </Modal>
  );
};

Object.assign(window, { Inventario, ProductoEditModal });
