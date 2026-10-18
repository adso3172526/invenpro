// Inventario / Bodega

const Inventario = () => {
  const [q, setQ] = useStateA("");
  const [cat, setCat] = useStateA("Todos");
  const [estado, setEstado] = useStateA("Todos");
  const [toast, setToast] = useStateA(null);
  const [productos, setProductos] = useStateA(() => MOCK.productos || []);
  const [barcodeInputs, setBarcodeInputs] = useStateA({});
  const [editing, setEditing] = useStateA(null);
  const [saving, setSaving] = useStateA(false);
  const [showAjuste, setShowAjuste] = useStateA(false);
  const [scanningSku, setScanningSku] = useStateA(null);

  // Los productos de MOCK son instancias de la clase Producto (campos privados + getters);
  // hacerles spread {...p} NO copia esos getters y deja el objeto vacío. toPlain lee por
  // getter (funciona igual para instancias y objetos planos) y devuelve un objeto plano editable.
  const toPlain = (p) => p ? ({
    sku: p.sku, nombre: p.nombre, categoria: p.categoria,
    precio: p.precio, costo: p.costo, stock: p.stock, min: p.min,
    vence: p.vence, unidad: p.unidad, codigoBarras: p.codigoBarras, fotoUrl: p.fotoUrl,
  }) : p;

  const _editingRef = React.useRef(null);
  _editingRef.current = editing;
  React.useEffect(() => {
    return window.EventBus.on("realtime:productos", () => {
      // copia (nuevo array) para forzar re-render: el handler muta MOCK.productos
      // en el sitio, así que pasar la misma referencia no re-renderiza.
      if (!_editingRef.current) setProductos((MOCK.productos || []).slice());
    });
  }, []);

  const stats = useMemoA(() => {
    const productos = MOCK.productos || [];
    return {
      sinCodigo: productos.filter((p) => !p.codigoBarras).length,
      bajo: productos.filter((p) => p.stock < p.min).length,
      totalValor: productos.reduce((sum, p) => sum + p.stock * p.costo, 0),
      totalStock: productos.reduce((sum, p) => sum + p.stock, 0),
    };
  }, [productos]);
  const sinCodigo = stats.sinCodigo;
  const bajo = stats.bajo;
  const totalValor = stats.totalValor;
  const totalStock = stats.totalStock;

  const rows = useMemoA(() => {
    let list = productos;
    if (cat !== "Todos") list = list.filter((p) => p.categoria === cat);
    if (q) {
      const query = q.toLowerCase().trim();
      list = list.filter((p) => p.nombre.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query) || (p.codigoBarras && p.codigoBarras.toLowerCase().includes(query)));
    }
    if (estado === "Bajo") list = list.filter((p) => p.stock < p.min);
    else if (estado === "Sin stock") list = list.filter((p) => p.stock === 0);
    else if (estado === "Sin código") list = list.filter((p) => !p.codigoBarras);
    else if (estado === "Con código") list = list.filter((p) => !!p.codigoBarras);
    return [...list].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [productos, q, cat, estado]);
  const pag = usePagination(rows, 8);

  const asignarCodigo = async (sku) => {
    const codigo = (barcodeInputs[sku] || "").trim();
    if (!codigo) { setToast("Escanea o digita un código de barras"); return; }
    const existente = productos.find((p) => p.codigoBarras === codigo && p.sku !== sku);
    if (existente) { setToast(`Este código ya está asignado a "${existente.nombre}"`); return; }
    const error = await DB.productos.updateBarcode(sku, codigo);
    if (error) { setToast("Error al guardar: " + (error.message || "Intenta de nuevo")); return; }
    setProductos(ps => ps.map(p => p.sku === sku ? { ...toPlain(p), codigoBarras: codigo } : p));
    const mp = MOCK.productos.find(p => p.sku === sku);
    if (mp) mp.codigoBarras = codigo;
    setBarcodeInputs(prev => { const next = { ...prev }; delete next[sku]; return next; });
    setToast("Código de barras asignado correctamente");
  };

  const handleScanForSku = async (codigo) => {
    if (!scanningSku) return;
    const sku = scanningSku;
    setScanningSku(null);
    const cod = (codigo || "").trim();
    if (!cod) return;
    const existente = productos.find((p) => p.codigoBarras === cod && p.sku !== sku);
    if (existente) { setToast(`Este código ya está asignado a "${existente.nombre}"`); return; }
    const error = await DB.productos.updateBarcode(sku, cod);
    if (error) { setToast("Error al guardar: " + (error.message || "Intenta de nuevo")); return; }
    setProductos(ps => ps.map(p => p.sku === sku ? { ...toPlain(p), codigoBarras: cod } : p));
    const mp = MOCK.productos.find(p => p.sku === sku);
    if (mp) mp.codigoBarras = cod;
    setBarcodeInputs(prev => { const next = { ...prev }; delete next[sku]; return next; });
    setToast("Código de barras asignado con éxito");
  };

  const guardarProducto = async (draft) => {
    setSaving(true);
    if (draft.codigoBarras) {
      const dup = productos.find((p) => p.codigoBarras === draft.codigoBarras && p.sku !== draft.sku);
      if (dup) { setToast(`Código de barras ya asignado a "${dup.nombre}"`); setSaving(false); return; }
    }
    const error = await DB.productos.update(draft.sku, { nombre: draft.nombre, categoria: draft.categoria, precio: draft.precio, costo: draft.costo, stock: draft.stock, min: draft.min, unidad: draft.unidad, vence: draft.vence || null, codigoBarras: draft.codigoBarras || null, fotoUrl: draft.fotoUrl || null });
    if (error) { setToast("Error al guardar: " + (error.message || "Intenta de nuevo")); setSaving(false); return; }
    setProductos(ps => ps.map(p => p.sku === draft.sku ? { ...toPlain(p), ...draft } : p));
    const mp = MOCK.productos.find(p => p.sku === draft.sku);
    if (mp) Object.assign(mp, draft);
    setEditing(null);
    setSaving(false);
    setToast("Producto actualizado");
  };

  const isFilterActive = (key) => key === "stock" ? (estado === "Todos" && cat === "Todos" && !q) : estado === key;

  return (
    <>
      <div className="tw-flex tw-flex-col md:tw-h-[calc(100vh-48px)]" style={{ marginTop: -8 }}>

        <div className="page-h tw-flex tw-flex-col sm:tw-flex-row tw-gap-3 sm:tw-items-center sm:tw-justify-between">
          <div>
            <h2>Inventario</h2>
            <p className="sub">Gestiona productos, stock y códigos de barras.</p>
          </div>
          <div className="tw-flex tw-gap-2 tw-shrink-0 tw-flex-wrap">
            <button className="btn sm" onClick={() => setShowAjuste(true)}>
              <Icon name="settings" size={13} /> <span>Ajustar precios</span>
            </button>
            <button className="btn sm btn-export" style={{ background: "#21864A", color: "#ffffff", borderColor: "#21864A" }} onClick={() => exportXlsx("InvenPro_inventario.xlsx", [
              {
                name: "Inventario", rows: rows.map(p => ({
                  SKU: p.sku, "Código de barras": p.codigoBarras || "", Producto: p.nombre, Categoría: p.categoria,
                  Precio: p.precio, Costo: p.costo, Stock: p.stock, Mínimo: p.min, Unidad: p.unidad, Vence: p.vence || ""
                }))
              },
            ])}><Icon name="download" size={13} /> <span>Exportar</span></button>
          </div>
        </div>

        <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-2 tw-mb-2">
          {[
            { key: "Todos", lbl: "Productos", val: productos.length, icon: "box", c: "accent" },
            { key: "stock", lbl: "Stock total", val: totalStock.toLocaleString("es-CO"), icon: "cart", c: "good" },
            { key: "Bajo", lbl: "Stock bajo", val: bajo, icon: "alert", c: bajo > 0 ? "bad" : "good" },
            { key: "Sin código", lbl: "Sin código", val: sinCodigo, icon: "search", c: sinCodigo > 0 ? "warn" : "good" },
          ].map(k => {
            const active = isFilterActive(k.key);
            return (
              <button key={k.key}
                className="kpi"
                style={{
                  textAlign: "left",
                  borderColor: active ? "var(--accent)" : undefined,
                  background: active ? "var(--accent-soft)" : undefined,
                  cursor: "pointer",
                }}
                onClick={() => {
                  if (k.key === "stock") { setEstado("Todos"); setCat("Todos"); setQ(""); }
                  else setEstado(estado === k.key ? "Todos" : k.key);
                }}>
                <div className="label tw-text-xs tw-truncate"><span className={"chip " + k.c}><span className="dot" /></span>{k.lbl}</div>
                <div className="val" style={{ color: k.c !== "good" && k.c !== "accent" && k.val > 0 ? `var(--${k.c})` : undefined }}>{k.val}</div>
              </button>
            );
          })}
        </div>

        <div className="tw-flex tw-flex-col sm:tw-flex-row tw-items-stretch sm:tw-items-center tw-gap-2 tw-mb-2.5">
          <div className="search tw-flex-1" style={{ height: 36 }}>
            <Icon name="search" size={14} />
            <input placeholder="Buscar por nombre, SKU o código…" value={q} onChange={e => setQ(e.target.value)} style={{ fontSize: 13 }} />
            {q && (
              <button
                type="button"
                className="btn sm ghost"
                onClick={() => setQ("")}
                style={{ padding: "0 6px", minHeight: "auto", height: 24, fontSize: 12 }}
                title="Limpiar búsqueda"
              >✕</button>
            )}
          </div>
          <div className="tw-flex tw-gap-2 tw-w-full sm:tw-w-auto">
            <div className="select-pill tw-flex-1 sm:tw-flex-none" style={{ height: 36, fontSize: 13 }}>
              <span className="lbl">Cat</span>
              <select value={cat} onChange={e => setCat(e.target.value)} style={{ fontSize: 13 }}>
                <option>Todos</option>
                {CATEGORIAS.slice(1).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="select-pill tw-flex-1 sm:tw-flex-none" style={{ height: 36, fontSize: 13 }}>
              <span className="lbl">Estado</span>
              <select value={estado} onChange={e => setEstado(e.target.value)} style={{ fontSize: 13 }}>
                <option>Todos</option>
                <option>Bajo</option>
                <option>Sin stock</option>
                <option>Sin código</option>
                <option>Con código</option>
              </select>
            </div>
          </div>
        </div>

        <div className="tw-hidden md:tw-flex tw-flex-col tw-flex-1 tw-min-h-0">
          <div className="card tw-flex tw-flex-col tw-flex-1 tw-min-h-0">
            <div className="tbl-wrap tw-flex-1 tw-overflow-y-auto tw-min-h-0">
              <table className="tbl tbl-bodega">
                <thead className="tw-sticky tw-top-0 tw-z-10" style={{ background: "var(--surface)" }}>
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
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", background: "var(--surface-2)", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 16 }}>
                              {p.fotoUrl ? <img src={p.fotoUrl} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "📷"}
                            </div>
                            <div>
                              <div style={{ fontWeight: 500 }}>{p.nombre}</div>
                              <div className="mono muted" style={{ fontSize: 11 }}>{p.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="chip">{p.categoria}</span></td>
                        <td className="num mono">{window.fmtCOP(p.precio)}</td>
                        <td style={{ minWidth: 120 }}>
                          <div className="tw-flex tw-justify-between tw-mb-0.5">
                            <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{p.stock} {p.unidad}</span>
                            <span className="muted mono" style={{ fontSize: 11 }}>mín {p.min}</span>
                          </div>
                          <div className={"progress " + stockClass}><span style={{ width: `${stockPct}%` }} /></div>
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
                                <Icon name="check" size={13} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="num">
                          <button className="btn sm ghost" onClick={() => setEditing(toPlain(p))} title="Ver / editar"><Icon name="eye" size={13} /></button>
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
            <Pagination {...pag} label="productos" />
          </div>
        </div>

        <div className="inventario-mobile-list md:tw-hidden">
          {pag.slice.map(p => {
            const stockPct = Math.min(100, (p.stock / (Math.max(p.min, 1) * 3)) * 100);
            const stockClass = p.stock === 0 ? "bad" : p.stock < p.min ? "warn" : "good";
            const stockLabel = p.stock === 0 ? "Agotado" : p.stock < p.min ? "Bajo" : "En stock";
            const hasBarcode = !!p.codigoBarras;

            return (
              <div key={p.sku} className={"inventario-card" + (!hasBarcode ? " sin-codigo" : "")}>
                {/* Header: Foto + Nombre + Chips + Botón Ver/Editar */}
                <div className="inventario-card-head">
                  <div className="inventario-card-thumb">
                    {p.fotoUrl ? (
                      <img src={p.fotoUrl} alt={p.nombre} loading="lazy" />
                    ) : (
                      <span role="img" aria-label="Sin foto">📷</span>
                    )}
                  </div>
                  <div className="inventario-card-info">
                    <div className="inventario-card-title">{p.nombre}</div>
                    <div className="inventario-card-meta">
                      <span className="chip mono">{p.sku}</span>
                      <span className="chip">{p.categoria}</span>
                      {p.vence && (
                        <span className="chip muted" title={`Vence: ${p.vence}`}>
                          📅 {p.vence}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="inventario-card-action">
                    <button
                      className="btn sm ghost"
                      onClick={() => setEditing(toPlain(p))}
                      title="Ver o editar producto"
                      style={{ width: 28, height: 28, padding: 0, display: "grid", placeItems: "center" }}
                    >
                      <Icon name="eye" size={13} />
                    </button>
                  </div>
                </div>

                {/* Strip de métricas compacto: Precio y Stock */}
                <div className="inventario-metrics-strip">
                  <div className="inventario-metric">
                    <span className="inventario-metric-lbl">Precio</span>
                    <span className="inventario-metric-val mono" style={{ color: "var(--accent)" }}>
                      {window.fmtCOP(p.precio)}
                    </span>
                  </div>
                  <div className="inventario-metric">
                    <div className="tw-flex tw-justify-between tw-items-center">
                      <span className="inventario-metric-lbl">Stock (Mín {p.min})</span>
                      <span className={"chip " + stockClass} style={{ fontSize: 9, padding: "0 4px", lineHeight: "14px" }}>
                        <span className="dot" /> {stockLabel}
                      </span>
                    </div>
                    <div className="mono tw-text-xs tw-font-semibold tw-leading-tight">
                      {p.stock} <span className="muted" style={{ fontSize: 10, fontWeight: "normal" }}>{p.unidad}</span>
                    </div>
                    <div className="inventario-progress-wrap">
                      <div className={"progress " + stockClass} style={{ height: 3 }}>
                        <span style={{ width: `${stockPct}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Código de barras: Asignado vs Por asignar */}
                <div className="inventario-card-barcode">
                  {hasBarcode ? (
                    <div className="tw-flex tw-items-center tw-justify-between tw-text-[11px] tw-py-0.5">
                      <div className="tw-flex tw-items-center tw-gap-1 tw-min-w-0">
                        <Icon name="tag" size={11} style={{ color: "var(--text-3)", flexShrink: 0 }} />
                        <span className="mono tw-truncate muted" style={{ fontSize: 11 }}>
                          {p.codigoBarras}
                        </span>
                      </div>
                      <span className="tw-text-good tw-font-semibold tw-flex tw-items-center tw-gap-0.5 tw-text-[10px] tw-shrink-0">
                        <Icon name="check" size={10} /> Código OK
                      </span>
                    </div>
                  ) : (
                    <div className="tw-flex tw-flex-col tw-gap-1">
                      <div className="tw-flex tw-items-center tw-justify-between">
                        <span className="tw-text-[10px] tw-font-semibold" style={{ color: "#D97706" }}>
                          ⚠️ Sin código de barras
                        </span>
                      </div>
                      <div className="inventario-barcode-assign-row">
                        <input
                          className="bodega-barcode-input mono"
                          value={barcodeInputs[p.sku] || ""}
                          onChange={e => setBarcodeInputs(prev => ({ ...prev, [p.sku]: e.target.value }))}
                          onKeyDown={e => { if (e.key === "Enter") asignarCodigo(p.sku); }}
                          placeholder="Digitar / escanear código…"
                        />
                        {window.BarcodeScanner && (
                          <button
                            type="button"
                            className="btn sm ghost"
                            style={{ minHeight: 30, height: 30, width: 30, padding: 0, display: "grid", placeItems: "center", fontSize: 13 }}
                            onClick={() => setScanningSku(p.sku)}
                            title="Escanear con cámara"
                          >
                            📷
                          </button>
                        )}
                        <button
                          className="btn sm primary"
                          style={{ minHeight: 30, height: 30, padding: "0 10px" }}
                          onClick={() => asignarCodigo(p.sku)}
                          disabled={!(barcodeInputs[p.sku] || "").trim()}
                          title="Guardar código"
                        >
                          <Icon name="check" size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {rows.length === 0 && (
            <div className="empty-state">Sin productos con los filtros aplicados.</div>
          )}
          <Pagination {...pag} label="productos" />
        </div>

      </div>

      {editing && <ProductoEditModal
        producto={editing}
        saving={saving}
        onClose={() => setEditing(null)}
        onSave={guardarProducto}
      />}

      {scanningSku && window.BarcodeScanner && (
        <BarcodeScanner
          closeOnScan
          onScan={handleScanForSku}
          onClose={() => setScanningSku(null)}
        />
      )}

      {showAjuste && <AjustarPreciosModal
        productos={productos}
        onClose={() => setShowAjuste(false)}
        onDone={async (msg) => {
          setShowAjuste(false);
          // Refleja los precios nuevos de inmediato: re-lee de la BD y refresca
          // MOCK + estado local (no espera al realtime, que puede tardar/perderse).
          try {
            const frescos = await DB.productos.getAll();
            if (frescos && frescos.length) {
              if (MOCK.setProductos) MOCK.setProductos(frescos);
              setProductos(frescos.slice());
            }
          } catch (e) { console.error("refrescar precios tras ajuste:", e); }
          setToast(msg);
        }}
      />}

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </>
  );
};

const ProductoEditModal = ({ producto, saving, onClose, onSave }) => {
  const [d, setD] = useStateA({ ...producto });
  const set = (k, v) => setD(prev => ({ ...prev, [k]: v }));
  const venceDays = d.vence ? window.daysFromNow(d.vence) : null;
  const [subiendoFoto, setSubiendoFoto] = useStateA(false);
  const [fotoErr, setFotoErr] = useStateA("");
  const onPickFoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!d.sku) { setFotoErr("El producto necesita SKU antes de subir la foto."); return; }
    setSubiendoFoto(true); setFotoErr("");
    try {
      const url = await window.subirFotoProducto(file, d.sku);
      set("fotoUrl", url);
    } catch (err) {
      setFotoErr((err && err.message) || "No se pudo subir la foto.");
    }
    setSubiendoFoto(false);
  };

  return (
    <Modal title="Editar producto" lg bottomSheet onClose={onClose} footer={
      <>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={saving || !d.nombre} onClick={() => onSave(d)}>
          <Icon name="check" size={14} /> {saving ? "Guardando…" : "Guardar cambios"}
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

      <div className="field">
        <label>Foto del producto</label>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", background: "var(--surface-2)", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 24 }}>
            {d.fotoUrl ? <img src={d.fotoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "📷"}
          </div>
          <div>
            <input type="file" accept="image/*" id={"prod-foto-" + d.sku} style={{ display: "none" }} onChange={onPickFoto} />
            <label htmlFor={"prod-foto-" + d.sku} className="btn sm" style={{ cursor: "pointer" }}>{subiendoFoto ? "Subiendo…" : (d.fotoUrl ? "Cambiar foto" : "Subir foto")}</label>
            {fotoErr && <div className="muted" style={{ fontSize: 11, color: "var(--bad)", marginTop: 4 }}>{fotoErr}</div>}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="field"><label>Nombre *</label>
          <input value={d.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Nombre del producto" /></div>
        <div className="field"><label>Categoría</label>
          <select value={d.categoria} onChange={e => set("categoria", e.target.value)}>
            {CATEGORIAS.slice(1).map(c => <option key={c}>{c}</option>)}
            <option value="General">General</option>
          </select></div>
      </div>

      <div className="grid-2">
        <div className="field"><label>Precio de venta</label>
          <input className="mono" type="number" min="0" value={d.precio || ""} onChange={e => set("precio", e.target.value === "" ? 0 : parseInt(e.target.value))} /></div>
        <div className="field"><label>Costo</label>
          <input className="mono" type="number" min="0" value={d.costo || ""} onChange={e => set("costo", e.target.value === "" ? 0 : parseInt(e.target.value))} /></div>
      </div>

      <div className="grid-2">
        <div className="field"><label>Stock actual</label>
          <input className="mono" type="number" min="0" value={d.stock || ""} onChange={e => set("stock", e.target.value === "" ? 0 : parseInt(e.target.value))} /></div>
        <div className="field"><label>Stock mínimo</label>
          <input className="mono" type="number" min="0" value={d.min || ""} onChange={e => set("min", e.target.value === "" ? 0 : parseInt(e.target.value))} /></div>
      </div>

      <div className="grid-2">
        <div className="field"><label>Unidad</label>
          <select value={d.unidad} onChange={e => set("unidad", e.target.value)}>
            <option value="und">und</option><option value="kg">kg</option><option value="g">g</option>
            <option value="lb">lb</option><option value="lt">lt</option><option value="ml">ml</option>
            <option value="paq">paq</option><option value="caja">caja</option>
          </select></div>
        <div className="field"><label>Vencimiento</label>
          <input type="date" value={d.vence || ""} onChange={e => set("vence", e.target.value || null)} />
          {venceDays !== null && venceDays <= 14 && (
            <span className={"chip mt-1 " + (venceDays <= 5 ? "bad" : "warn")} style={{ fontSize: 10 }}>
              {venceDays <= 0 ? "Vencido" : `Vence en ${venceDays} días`}
            </span>
          )}
        </div>
      </div>

      <div className="field">
        <label>Código de barras</label>
        <input className="mono bodega-barcode-input" style={{ width: "100%" }} value={d.codigoBarras || ""} onChange={e => set("codigoBarras", e.target.value || null)} placeholder="Escanear o digitar código de barras…" />
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

// Modal de ajuste de precios por categoría. Llama a DB.productos.ajustarPreciosCategoria
// (FUNCTION fn_ajustar_precios_categoria en la BD). Vista previa con el mismo redondeo a 50.
const AjustarPreciosModal = ({ productos, onClose, onDone }) => {
  const cats = CATEGORIAS.slice(1);
  const [categoria, setCategoria] = useStateA(cats[0] || "General");
  const [pct, setPct] = useStateA("");
  const [saving, setSaving] = useStateA(false);
  const [err, setErr] = useStateA("");

  const pctNum = parseFloat(pct);
  const pctValido = pct !== "" && !isNaN(pctNum);
  const afectados = productos.filter(p => p.categoria === categoria);
  const nuevoPrecio = (precio) => Math.max(0, Math.round(precio * (1 + (pctNum || 0) / 100) / 50) * 50);

  const aplicar = async () => {
    setErr("");
    if (!pctValido) { setErr("Ingresa un porcentaje válido."); return; }
    setSaving(true);
    const { afectados: n, error } = await DB.productos.ajustarPreciosCategoria(categoria, pctNum);
    setSaving(false);
    if (error) { setErr(error.message || "No se pudo ajustar los precios."); return; }
    onDone(`${n} producto(s) actualizados en ${categoria}`);
  };

  return (
    <Modal title="Ajustar precios por categoría" bottomSheet onClose={onClose} footer={
      <>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={saving || !pctValido} onClick={aplicar}>
          <Icon name="check" size={14} /> {saving ? "Aplicando…" : "Aplicar"}
        </button>
      </>
    }>
      {err && (
        <div className="tw-bg-bad-soft tw-text-bad tw-py-2 tw-px-3 tw-rounded-md tw-text-xs tw-mb-3 tw-font-medium">
          {err}
        </div>
      )}
      <div className="grid-2">
        <div className="field"><label>Categoría</label>
          <select value={categoria} onChange={e => setCategoria(e.target.value)}>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select></div>
        <div className="field"><label>Ajuste (%)</label>
          <input className="mono" type="number" value={pct} onChange={e => setPct(e.target.value)} placeholder="+ sube · − baja" /></div>
      </div>
      <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
        {afectados.length} producto(s) en "{categoria}". Redondeo a la decena de 50.
      </div>
      {pctValido && afectados.length > 0 && (
        <div className="tbl-wrap" style={{ maxHeight: 220, overflowY: "auto" }}>
          <table className="tbl">
            <thead><tr><th>Producto</th><th className="num">Actual</th><th className="num">Nuevo</th></tr></thead>
            <tbody>
              {afectados.map(p => (
                <tr key={p.sku}>
                  <td>{p.nombre}</td>
                  <td className="num mono">{window.fmtCOP(p.precio)}</td>
                  <td className="num mono" style={{ fontWeight: 600 }}>{window.fmtCOP(nuevoPrecio(p.precio))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
};

Object.assign(window, { Inventario, ProductoEditModal, AjustarPreciosModal });
