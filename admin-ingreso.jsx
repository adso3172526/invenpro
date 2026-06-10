// Ingreso de mercancía
const { useState: useStateA, useMemo: useMemoA } = React;

const Ingreso = () => {
  // Realtime: only refresh when modal is NOT open (avoid closing it mid-edit)
  const [, _rtTick] = React.useState(0);
  const _formOpenRef = React.useRef(false);
  const [items, setItems] = useStateA([]);
  const [origen, setOrigen] = useStateA(null); // null | "manual" | "qr" | "ia"
  const [showSelector, setShowSelector] = useStateA(false);
  const [showIaScanner, setShowIaScanner] = useStateA(false);
  const [showForm, setShowForm] = useStateA(false);
  _formOpenRef.current = showForm;
  React.useEffect(() => {
    const tables = ["ingresos", "productos"];
    const offs = tables.map(t => window.EventBus.on("realtime:" + t, () => {
      if (!_formOpenRef.current) _rtTick(n => n + 1);
    }));
    return () => offs.forEach(fn => fn());
  }, []);
  const [verIngreso, setVerIngreso] = useStateA(null);
  const hoy = new Date().toISOString().slice(0,10);
  const hace30 = new Date(Date.now() - 30*86400000).toISOString().slice(0,10);
  const [desde, setDesde] = useStateA(hace30);
  const [hasta, setHasta] = useStateA(hoy);
  const [proveedores, setProveedores] = useStateA([
    { nombre: "Distribuidora El Sol", nit: "900.124.567-8", tel: "(4) 444 1820" },
    { nombre: "Lácteos del Valle", nit: "830.998.221-2", tel: "(2) 660 1245" },
    { nombre: "Frutiverduras Mayor", nit: "901.445.118-3", tel: "(1) 320 7790" },
    { nombre: "Aseo y Hogar S.A.S", nit: "900.778.412-1", tel: "(4) 511 8900" },
  ]);
  const [proveedor, setProveedor] = useStateA("Distribuidora El Sol");
  const [factura, setFactura] = useStateA("FV-" + Math.floor(Math.random()*9000+1000));
  const [vendedor, setVendedor] = useStateA("");
  const [celular, setCelular] = useStateA("");
  const [recibido, setRecibido] = useStateA(() => {
    const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0,16);
  });
  const [showProv, setShowProv] = useStateA(false);
  const [provDraft, setProvDraft] = useStateA({ nombre: "", nit: "", tel: "" });
  const [toast, setToast] = useStateA(null);
  const [guardando, setGuardando] = useStateA(false);
  const ingresosFiltrados = MOCK.ingresos.filter(i => i.fecha >= desde && i.fecha <= hasta);
  const pagIng = usePagination(ingresosFiltrados, 8);

  const add = (sku, qty, costo, vence, nombreManual, codigoBarras, precio, categoriaManual) => {
    const p = MOCK.productos.find(x => x.sku === sku);
    const esNuevo = !p;
    const nombre = p ? p.nombre : (nombreManual || sku);
    const item = { sku, nombre, qty: parseInt(qty)||0, costo: parseInt(costo)||0, vence, nuevo: esNuevo, codigoBarras: codigoBarras || (p && p.codigoBarras) || "" };
    if (esNuevo) {
      item.categoria = categoriaManual || "General";
      item.precio = parseInt(precio) || Math.round((parseInt(costo)||0) * 1.3);
    } else {
      item.precio = parseInt(precio) || p.precio || 0;
    }
    setItems(it => [...it, item]);
  };

  const actualizarItem = (idx, campo, valor) => {
    setItems(it => it.map((x, i) => i === idx ? { ...x, [campo]: valor } : x));
  };

  const aplicarDatosExtraidos = (data, modo) => {
    const existeProv = proveedores.find(p => p.nit === data.nit);
    if (!existeProv) {
      setProveedores(ps => [...ps, { nombre: data.proveedor, nit: data.nit, tel: "" }]);
    }
    setProveedor(data.proveedor);
    setFactura(data.factura);
    setVendedor(data.vendedor || "");
    setCelular(data.celular || "");
    setItems(data.items.map(it => {
      const esNuevo = !!it.nuevo || !it.encontrado;
      return {
        sku: it.sku || ("NUEVO-" + Math.floor(Math.random()*9999)),
        nombre: it.nombre,
        qty: it.qty,
        costo: it.costo,
        vence: it.vence,
        nuevo: esNuevo,
        confianza: it.confianza,
        categoria: esNuevo ? "General" : undefined,
        precio: esNuevo ? Math.round((it.costo || 0) * 1.3) : undefined,
      };
    }));
    setOrigen(modo);
    setShowIaScanner(false);
    setShowForm(true);
  };

  const iniciarManual = () => {
    setItems([]); setVendedor(""); setCelular("");
    setFactura(""); setProveedor("");
    const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setRecibido(d.toISOString().slice(0,16));
    setOrigen("manual");
    setShowSelector(false);
    setShowForm(true);
  };

  const total = items.reduce((s, i) => s + i.qty * i.costo, 0);

  return (
    <>
      <div className="page-h">
        <div>
          <h2>Ingreso de mercancía</h2>
          <p className="sub">Registra entradas a la bodega y actualiza inventario y costos.</p>
        </div>
        <div className="row">
          <button className="btn primary" onClick={() => setShowSelector(true)}><Icon name="plus" size={14}/> Nuevo ingreso</button>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-h tw-flex tw-flex-col sm:tw-flex-row tw-items-start sm:tw-items-center tw-justify-between tw-gap-2.5" style={{ flexWrap: "wrap" }}>
          <h3 className="tw-m-0">Historial de ingresos</h3>
          <div className="tw-flex tw-flex-col sm:tw-flex-row tw-items-stretch sm:tw-items-center tw-gap-2 tw-w-full sm:tw-w-auto">
            <div className="tw-grid tw-grid-cols-[auto_1fr_auto_1fr] tw-gap-1.5 tw-items-center">
              <span className="muted tw-text-xs">Desde</span>
              <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="tw-text-xs" style={{ width: "100%" }}/>
              <span className="muted tw-text-xs">Hasta</span>
              <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="tw-text-xs" style={{ width: "100%" }}/>
            </div>
            <button className="btn" onClick={() => {
              const ings = MOCK.ingresos.filter(i => i.fecha >= desde && i.fecha <= hasta);
              if (ings.length === 0) { setToast("No hay ingresos en ese rango"); return; }
              const resumen = ings.map(i => ({
                "N° ingreso": i.id, "Fecha": i.fecha, "Proveedor": i.proveedor,
                "Factura": i.factura || "", "Items": i.items,
                "Costo total": i.costo, "Recibido por": i.recibe,
              }));
              const detalle = ings.flatMap(i => (i.detalle || []).map(d => ({
                "N° ingreso": i.id, "Fecha": i.fecha, "Proveedor": i.proveedor,
                "Factura": i.factura || "", "SKU": d.sku, "Producto": d.nombre,
                "Cantidad": d.qty, "Costo unit.": d.costo, "Subtotal": d.qty * d.costo,
                "Vence": d.vence || "",
              })));
              exportXlsx(`ingresos_${desde}_a_${hasta}.xlsx`, [
                { name: "Resumen", rows: resumen },
                { name: "Detalle", rows: detalle },
              ]);
              setToast(`${ings.length} ingreso(s) exportados`);
            }}><Icon name="download" size={14}/> Exportar Excel</button>
          </div>
        </div>
        {/* Desktop: tabla */}
        <div className="tw-hidden md:tw-block">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>N° ingreso</th><th>Factura</th><th>Fecha</th><th>Proveedor</th><th className="num">Items</th><th className="num">Costo total</th><th>Recibido por</th><th></th></tr></thead>
              <tbody>
                {pagIng.slice.map(i => (
                  <tr key={i.id} className="row-hover" style={{ cursor: "pointer" }} onClick={() => setVerIngreso(i)}>
                    <td className="mono">{i.id}</td>
                    <td className="mono">{i.factura || "—"}</td>
                    <td>{i.fecha}</td>
                    <td>{i.proveedor}</td>
                    <td className="num mono">{i.items}</td>
                    <td className="num mono">{window.fmtCOP(i.costo)}</td>
                    <td className="muted">{i.recibe}</td>
                    <td className="num"><button className="btn sm ghost" onClick={e => { e.stopPropagation(); setVerIngreso(i); }}><Icon name="eye" size={13}/></button></td>
                  </tr>
                ))}
                {ingresosFiltrados.length === 0 && (
                  <tr><td colSpan="8" className="muted" style={{ textAlign: "center", padding: 28 }}>Sin ingresos en el rango seleccionado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="tw-hidden md:tw-block">
          <Pagination {...pagIng} label="ingresos"/>
        </div>
      </div>

      {/* Mobile: tarjetas separadas fuera de la card */}
      <div className="tw-flex tw-flex-col tw-gap-2.5 md:tw-hidden tw-mt-2.5">
        {pagIng.slice.map(i => (
          <div key={i.id} className="tw-bg-surface tw-border tw-border-border tw-rounded-xl tw-p-3.5 tw-shadow-sm" style={{ cursor: "pointer" }} onClick={() => setVerIngreso(i)}>
            <div className="tw-flex tw-justify-between tw-items-start tw-gap-2 tw-mb-1.5">
              <div className="tw-min-w-0">
                <div className="mono tw-font-semibold tw-text-[13px] tw-truncate">{i.id}</div>
                {i.factura && <div className="mono muted tw-text-[11px] tw-truncate">{i.factura}</div>}
              </div>
              <span className="muted tw-text-[11px] tw-shrink-0">{i.fecha}</span>
            </div>
            <div className="tw-font-medium tw-text-[13px] tw-mb-1 tw-truncate">{i.proveedor}</div>
            <div className="tw-flex tw-justify-between tw-items-center tw-pt-2" style={{ borderTop: "1px dashed var(--border)" }}>
              <span className="muted tw-text-[11px]">{i.items} items · {i.recibe}</span>
              <span className="mono tw-font-semibold tw-text-[14px]">{window.fmtCOP(i.costo)}</span>
            </div>
          </div>
        ))}
        {ingresosFiltrados.length === 0 && (
          <div className="muted" style={{ textAlign: "center", padding: 28 }}>Sin ingresos en el rango seleccionado</div>
        )}
        <Pagination {...pagIng} label="ingresos"/>
      </div>

      {verIngreso && (() => {
        const [editIng, setEditIng] = [verIngreso, setVerIngreso];
        const editDet = editIng.detalle || [];
        const editTotal = editDet.reduce((s, d) => s + d.qty * d.costo, 0);
        const updField = (k, v) => setVerIngreso({ ...editIng, [k]: v });
        const updDet = (idx, k, v) => setVerIngreso({ ...editIng, detalle: editDet.map((d, i) => i === idx ? { ...d, [k]: v } : d) });
        return (
        <Modal title={`Ingreso ${editIng.id}`} lg onClose={() => setVerIngreso(null)} footer={
          <>
            <button className="btn ghost" onClick={() => setVerIngreso(null)}>Cancelar</button>
            <button className="btn" onClick={() => {
              const rows = editDet.map(d => ({
                SKU: d.sku, Producto: d.nombre, Cantidad: d.qty,
                "Costo unit.": d.costo, Subtotal: d.qty * d.costo, Vence: d.vence || "",
              }));
              exportXlsx(`ingreso_${editIng.id}.xlsx`, [{ name: "Detalle", rows }]);
            }}><Icon name="download" size={14}/> Exportar</button>
            <button className="btn primary" disabled={guardando} onClick={async () => {
              setGuardando(true);
              const err = await DB.ingresos.update(editIng.id, editIng, editDet);
              if (err) { setToast("Error al guardar"); setGuardando(false); return; }
              await hydrateData();
              setVerIngreso(null);
              setGuardando(false);
              setToast("Ingreso actualizado");
            }}><Icon name="check" size={14}/> {guardando ? "Guardando…" : "Guardar cambios"}</button>
          </>
        }>
          <div className="grid-2" style={{ marginBottom: 12, gap: 10 }}>
            <div className="field" style={{ margin: 0 }}>
              <label>Proveedor</label>
              <input value={editIng.proveedor} onChange={e => updField("proveedor", e.target.value)}/>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>N° Factura</label>
              <input className="mono" value={editIng.factura || ""} onChange={e => updField("factura", e.target.value)}/>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Fecha</label>
              <input className="mono" value={editIng.fecha} readOnly style={{ background: "var(--surface-2)", color: "var(--text-3)" }}/>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Recibido por</label>
              <input value={editIng.recibe || ""} onChange={e => updField("recibe", e.target.value)}/>
            </div>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Producto</th><th>SKU</th><th className="num">Cant.</th><th className="num">Costo unit.</th><th>Vence</th><th className="num">Subtotal</th></tr></thead>
              <tbody>
                {editDet.map((d, i) => (
                  <tr key={i}>
                    <td><input value={d.nombre} onChange={e => updDet(i, "nombre", e.target.value)} style={{ fontWeight: 500, border: "1px solid transparent", background: "transparent", padding: "2px 4px", borderRadius: 4, fontSize: 13, width: "100%", minWidth: 100 }} onFocus={e => { e.target.style.border = "1px solid var(--border)"; e.target.style.background = "var(--bg)"; }} onBlur={e => { e.target.style.border = "1px solid transparent"; e.target.style.background = "transparent"; }}/></td>
                    <td className="mono muted" style={{ fontSize: 12 }}>{d.sku}</td>
                    <td className="num"><input className="cell-input mono" value={d.qty} onChange={e => updDet(i, "qty", parseInt(e.target.value.replace(/\D/g, "")) || 0)}/></td>
                    <td className="num"><input className="cell-input mono" value={d.costo} onChange={e => updDet(i, "costo", parseInt(e.target.value.replace(/\D/g, "")) || 0)}/></td>
                    <td><input className="cell-input mono" type="date" value={d.vence || ""} onChange={e => updDet(i, "vence", e.target.value)}/></td>
                    <td className="num mono" style={{ fontWeight: 600 }}>{window.fmtCOP(d.qty * d.costo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", background: "var(--surface-2)", marginTop: 8, borderRadius: 8 }}>
            <span className="muted">{editDet.length} producto(s) · {editDet.reduce((s,d)=>s+d.qty,0)} unidades</span>
            <span className="mono" style={{ fontWeight: 600, fontSize: 18 }}>{window.fmtCOP(editTotal)}</span>
          </div>
        </Modal>
        );
      })()}

      {showSelector && (
        <Modal title="¿Cómo deseas registrar el ingreso?" lg onClose={() => setShowSelector(false)}>
          <p className="muted" style={{ marginTop: 0, marginBottom: 12, fontSize: 13 }}>
            Selecciona el método de captura. En cualquiera podrás revisar y editar los datos antes de guardar.
          </p>
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-3">
            <button className="method-card" onClick={iniciarManual}>
              <div className="method-icon" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}><Icon name="edit" size={24}/></div>
              <div className="method-title">Manual</div>
              <div className="method-desc">Captura los datos uno por uno desde el formulario.</div>
              <div className="method-tag">Tradicional</div>
            </button>
            <button className="method-card" onClick={() => { setShowSelector(false); setShowIaScanner(true); }}>
              <div className="method-icon" style={{ background: "#FFF1D6", color: "#8C6A1E" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <div className="method-title">Fotografiar factura</div>
              <div className="method-desc">Toma una foto de la factura física y la IA extrae los datos automáticamente.</div>
              <div className="method-tag warn">Con IA</div>
            </button>
          </div>
        </Modal>
      )}

      {showIaScanner && (
        <IaScannerModal onClose={() => setShowIaScanner(false)} onRead={(data) => aplicarDatosExtraidos(data, "ia")}/>
      )}

      {showForm && (() => {
        const provActual = proveedores.find(x => x.nombre === proveedor);
        const existentes = items.filter(it => !it.nuevo);
        const nuevos = items.filter(it => it.nuevo);
        const getStock = (sku) => { const p = MOCK.productos.find(x => x.sku === sku); return p ? p.stock : null; };
        return (
        <Modal title="Confirmar ingreso de mercancía" lg onClose={() => { setShowForm(false); setOrigen(null); }} footer={
          <>
            <button className="btn ghost" onClick={() => { setShowForm(false); setOrigen(null); }}>Cancelar</button>
            <button className="btn accent" disabled={guardando || items.length === 0} onClick={async () => {
              const yaExiste = MOCK.ingresos.find(i => i.factura === factura && i.proveedor === proveedor);
              if (yaExiste) {
                setToast("Esta factura ya fue registrada para este proveedor");
                return;
              }
              setGuardando(true);
              try {
                const nuevos = items.filter(it => it.nuevo);
                for (const it of nuevos) {
                  const autoSku = DB.productos.generateSku();
                  it.sku = autoSku;
                  const err = await DB.productos.create({
                    sku: autoSku,
                    nombre: it.nombre,
                    categoria: it.categoria || "General",
                    precio: it.precio || Math.round(it.costo * 1.3),
                    costo: it.costo,
                    stock: 0,
                    vence: it.vence || null,
                    codigoBarras: null,
                  });
                  if (err) { setToast("Error creando producto: " + it.nombre); setGuardando(false); return; }
                  MOCK.productos.push({ sku: autoSku, nombre: it.nombre, categoria: it.categoria || "General", precio: it.precio || 0, costo: it.costo, stock: 0, min: 0, vence: it.vence || null, unidad: "und", codigoBarras: null });
                }
                for (const it of items) {
                  await DB.productos.incrementStock(it.sku, it.qty);
                }
                const ingreso = {
                  id: "ING-" + Date.now(),
                  fecha: new Date().toISOString().slice(0, 10),
                  proveedor: proveedor,
                  items: items.length,
                  costo: total,
                  recibe: "Administrador",
                  factura: factura,
                };
                await DB.ingresos.create(ingreso, items);
                await hydrateData();
                setShowForm(false); setItems([]); setVendedor(""); setCelular(""); setOrigen(null);
                setToast("Ingreso registrado · " + nuevos.length + " producto(s) creado(s) · stock actualizado. Asigna códigos de barras en Bodega.");
              } catch (e) {
                setToast("Error al guardar: " + e.message);
              }
              setGuardando(false);
            }}><Icon name="check"/> {guardando ? "Guardando…" : "Confirmar ingreso"}</button>
          </>
        }>
          {origen && origen !== "manual" && (
            <div className={"origen-banner " + origen}>
              <div className="row" style={{ gap: 10 }}>
                <div className="origen-icon">
                  {origen === "qr" ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                    </svg>
                  ) : (
                    <Icon name="check" size={18}/>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {origen === "qr" ? "Datos importados desde QR DIAN" : "Datos extraídos por IA desde la foto"}
                  </div>
                  <div className="muted" style={{ fontSize: 11 }}>
                    {origen === "qr"
                      ? "Información validada por la DIAN. Verifica antes de confirmar."
                      : "Revisa la información extraída. Los campos con baja confianza están marcados."}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Datos del proveedor ── */}
          <div className="tw-bg-surface-2 tw-border tw-border-border tw-rounded-lg tw-p-3.5 md:tw-p-4 tw-mb-3">
            <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
              <Icon name="store" size={16}/>
              <span className="tw-font-semibold tw-text-sm">Datos del proveedor</span>
            </div>
            <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-2.5">
              <div className="field" style={{ margin: 0 }}>
                <label>Proveedor</label>
                <select value={proveedor} onChange={e => setProveedor(e.target.value)}>
                  <option value="">Seleccionar…</option>
                  {proveedores.map(p => <option key={p.nit}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>NIT / Identificación</label>
                <input className="mono" value={provActual ? provActual.nit : ""} onChange={e => {
                  if (provActual) setProveedores(ps => ps.map(p => p.nombre === proveedor ? { ...p, nit: e.target.value } : p));
                }} placeholder="900.000.000-0"/>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Teléfono</label>
                <input className="mono" value={provActual ? provActual.tel : ""} onChange={e => {
                  if (provActual) setProveedores(ps => ps.map(p => p.nombre === proveedor ? { ...p, tel: e.target.value.replace(/[^\d\s+()-]/g,"") } : p));
                }} placeholder="(4) 444 1820"/>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Dirección</label>
                <input value={provActual ? (provActual.direccion || "") : ""} onChange={e => {
                  if (provActual) setProveedores(ps => ps.map(p => p.nombre === proveedor ? { ...p, direccion: e.target.value } : p));
                }} placeholder="Cra 50 #30-20, Medellín"/>
              </div>
            </div>
          </div>

          {/* ── Datos de la factura ── */}
          <div className="tw-bg-surface-2 tw-border tw-border-border tw-rounded-lg tw-p-3.5 md:tw-p-4 tw-mb-3">
            <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span className="tw-font-semibold tw-text-sm">Datos de la factura</span>
            </div>
            <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-2.5">
              <div className="field" style={{ margin: 0 }}>
                <label>N° factura proveedor</label>
                <input className="mono" value={factura} onChange={e => setFactura(e.target.value)}/>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Fecha y hora de recibo</label>
                <input type="datetime-local" value={recibido} onChange={e => setRecibido(e.target.value)}/>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Nombre del vendedor</label>
                <input value={vendedor} onChange={e => setVendedor(e.target.value)} placeholder="Ej: Carlos Pérez"/>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Celular vendedor</label>
                <input className="mono" value={celular} onChange={e => setCelular(e.target.value.replace(/[^\d\s+()-]/g,""))} placeholder="300 123 4567"/>
              </div>
            </div>
          </div>

          {/* ── Resumen de items ── */}
          {items.length > 0 && (origen === "ia" || origen === "qr") && (
            <div className="tw-flex tw-flex-col sm:tw-flex-row tw-gap-2.5 tw-mb-3">
              <div className="tw-flex-1 tw-p-3 tw-rounded-lg tw-flex tw-items-center tw-gap-2" style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
                <Icon name="check" size={16}/>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#065F46" }}>{existentes.length} en bodega</div>
                  <div style={{ fontSize: 11, color: "#047857" }}>Se actualizará el stock</div>
                </div>
              </div>
              {nuevos.length > 0 && (
                <div className="tw-flex-1 tw-p-3 tw-rounded-lg tw-flex tw-items-center tw-gap-2" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2410C" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#9A3412" }}>{nuevos.length} nuevo(s)</div>
                    <div style={{ fontSize: 11, color: "#C2410C" }}>Se agregarán al inventario</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {nuevos.length > 0 && (
            <div className="tw-flex tw-items-center tw-gap-2 tw-p-3 tw-rounded-lg tw-mb-2.5 tw-text-xs" style={{ background: "#FFF7ED", border: "1px solid #FED7AA", color: "#9A3412" }}>
              <Icon name="box" size={16}/>
              <span>Los productos nuevos se crearán con SKU automático. Podrás asignar el código de barras después en <strong>Bodega</strong>.</span>
            </div>
          )}

          <ItemAdder onAdd={add}/>

          {items.length > 0 && (
            <div className="card mt-2">
              {/* Desktop: tabla */}
              <div className="tw-hidden md:tw-block">
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead><tr><th>Producto</th><th className="num">Stock actual</th><th className="num">Cantidad</th><th className="num">Costo unit.</th><th>Vence</th><th className="num">Subtotal</th><th></th></tr></thead>
                    <tbody>
                      {items.map((it, i) => {
                        const stockActual = getStock(it.sku);
                        return (
                        <tr key={i} className={it.nuevo ? "row-nuevo" : ""}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <input
                                value={it.nombre}
                                onChange={e => actualizarItem(i, "nombre", e.target.value)}
                                style={{ fontWeight: 500, border: "1px solid transparent", background: "transparent", color: "var(--text)", padding: "2px 4px", borderRadius: 4, fontSize: 13, width: "100%", minWidth: 120 }}
                                onFocus={e => { e.target.style.border = "1px solid var(--border)"; e.target.style.background = "var(--bg)"; }}
                                onBlur={e => { e.target.style.border = "1px solid transparent"; e.target.style.background = "transparent"; }}
                              />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2, flexWrap: "wrap" }}>
                              {!it.nuevo && <span className="muted mono" style={{ fontSize: 11 }}>{it.sku}</span>}
                              {it.nuevo && <span className="chip warn" style={{ fontSize: 9 }}>NUEVO</span>}
                              {it.nuevo && <span className="chip chip-bodega-hint" style={{ fontSize: 9, background: "#FFF7ED", color: "#9A3412", border: "1px dashed #F59E0B" }}>Sin código — asignar en Bodega</span>}
                              {!it.nuevo && <span className="chip" style={{ fontSize: 9, background: "#D1FAE5", color: "#065F46" }}>EN BODEGA</span>}
                              {it.confianza !== undefined && it.confianza < 0.9 && (
                                <span className="chip" style={{ fontSize: 9, background: "#FFF1D6", color: "#8C6A1E" }}>IA {Math.round(it.confianza*100)}%</span>
                              )}
                            </div>
                            {it.nuevo && (
                              <div className="nuevo-extras">
                                <select value={it.categoria || "General"} onChange={e => actualizarItem(i, "categoria", e.target.value)} style={{ padding: "2px 4px", borderRadius: 4, border: "1px solid var(--border)", maxWidth: 110 }}>
                                  {[...new Set(MOCK.productos.map(p => p.categoria))].sort().map(c => <option key={c} value={c}>{c}</option>)}
                                  <option value="General">General</option>
                                </select>
                                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                  <span style={{ fontSize: 10, color: "var(--text-3)" }}>Venta:</span>
                                  <input className="mono" value={it.precio || ""} onChange={e => actualizarItem(i, "precio", parseInt(e.target.value.replace(/\D/g,"")) || 0)} placeholder="Precio" style={{ padding: "2px 4px", border: "1px solid var(--border)", borderRadius: 4, width: 70 }}/>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="num">
                            {stockActual !== null ? <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{stockActual}</span> : <span className="muted" style={{ fontSize: 11 }}>—</span>}
                          </td>
                          <td className="num"><input className="cell-input mono" value={it.qty} onChange={e => actualizarItem(i, "qty", parseInt(e.target.value.replace(/\D/g,"")) || 0)}/></td>
                          <td className="num"><input className="cell-input mono" value={it.costo} onChange={e => actualizarItem(i, "costo", parseInt(e.target.value.replace(/\D/g,"")) || 0)}/></td>
                          <td><input className="cell-input mono" type="date" value={it.vence || ""} onChange={e => actualizarItem(i, "vence", e.target.value)}/></td>
                          <td className="num mono" style={{ fontWeight: 600 }}>{window.fmtCOP(it.qty * it.costo)}</td>
                          <td><button className="btn sm ghost" onClick={() => setItems(items.filter((_,j) => j !== i))}><Icon name="x" size={13}/></button></td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile: tarjetas de items */}
              <div className="tw-block md:tw-hidden tw-flex tw-flex-col tw-gap-2.5" style={{ padding: 10 }}>
                {items.map((it, i) => {
                  const stockActual = getStock(it.sku);
                  return (
                  <div key={i} className={
                    "tw-border tw-border-border tw-rounded-lg tw-p-3 tw-relative"
                    + (it.nuevo ? " tw-bg-amber-50 tw-border-l-[3px] tw-border-l-amber-400" : " tw-bg-surface")
                  }>
                    <button className="btn sm ghost tw-absolute tw-top-2 tw-right-2" onClick={() => setItems(items.filter((_,j) => j !== i))} style={{ padding: 4 }}><Icon name="x" size={13}/></button>
                    <div className="tw-mb-1.5">
                      <input
                        value={it.nombre}
                        onChange={e => actualizarItem(i, "nombre", e.target.value)}
                        style={{ fontWeight: 600, fontSize: 14, border: "1px solid transparent", background: "transparent", color: "var(--text)", padding: "2px 0", borderRadius: 4, width: "calc(100% - 30px)" }}
                        onFocus={e => { e.target.style.border = "1px solid var(--border)"; e.target.style.background = "var(--bg)"; e.target.style.padding = "2px 4px"; }}
                        onBlur={e => { e.target.style.border = "1px solid transparent"; e.target.style.background = "transparent"; e.target.style.padding = "2px 0"; }}
                      />
                      <div className="tw-flex tw-items-center tw-gap-1 tw-flex-wrap tw-mt-0.5">
                        {!it.nuevo && <span className="muted mono" style={{ fontSize: 11 }}>{it.sku}</span>}
                        {it.nuevo && <span className="chip warn" style={{ fontSize: 9 }}>NUEVO</span>}
                        {!it.nuevo && <span className="chip" style={{ fontSize: 9, background: "#D1FAE5", color: "#065F46" }}>EN BODEGA</span>}
                        {it.confianza !== undefined && it.confianza < 0.9 && (
                          <span className="chip" style={{ fontSize: 9, background: "#FFF1D6", color: "#8C6A1E" }}>IA {Math.round(it.confianza*100)}%</span>
                        )}
                      </div>
                    </div>
                    <div className="tw-grid tw-grid-cols-3 tw-gap-2 tw-mb-2">
                      <div className="field" style={{ margin: 0 }}>
                        <label style={{ fontSize: 10 }}>Cantidad</label>
                        <input className="mono" value={it.qty} onChange={e => actualizarItem(i, "qty", parseInt(e.target.value.replace(/\D/g,"")) || 0)} style={{ padding: "6px 8px", fontSize: 14 }}/>
                      </div>
                      <div className="field" style={{ margin: 0 }}>
                        <label style={{ fontSize: 10 }}>Costo unit.</label>
                        <input className="mono" value={it.costo} onChange={e => actualizarItem(i, "costo", parseInt(e.target.value.replace(/\D/g,"")) || 0)} style={{ padding: "6px 8px", fontSize: 14 }}/>
                      </div>
                      <div className="field" style={{ margin: 0 }}>
                        <label style={{ fontSize: 10 }}>Stock actual</label>
                        <div className="mono" style={{ padding: "8px", fontSize: 13, color: "var(--text-2)" }}>{stockActual !== null ? stockActual : "—"}</div>
                      </div>
                    </div>
                    <div className="tw-grid tw-grid-cols-2 tw-gap-2">
                      <div className="field" style={{ margin: 0 }}>
                        <label style={{ fontSize: 10 }}>Vence</label>
                        <input type="date" value={it.vence || ""} onChange={e => actualizarItem(i, "vence", e.target.value)} style={{ padding: "6px 8px", fontSize: 13 }}/>
                      </div>
                      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
                        <span className="mono" style={{ fontWeight: 600, fontSize: 16 }}>{window.fmtCOP(it.qty * it.costo)}</span>
                      </div>
                    </div>
                    {it.nuevo && (
                      <div className="tw-flex tw-gap-2 tw-mt-2 tw-pt-2" style={{ borderTop: "1px dashed var(--border)" }}>
                        <select value={it.categoria || "General"} onChange={e => actualizarItem(i, "categoria", e.target.value)} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 12, flex: 1 }}>
                          {[...new Set(MOCK.productos.map(p => p.categoria))].sort().map(c => <option key={c} value={c}>{c}</option>)}
                          <option value="General">General</option>
                        </select>
                        <div className="tw-flex tw-items-center tw-gap-1">
                          <span style={{ fontSize: 11, color: "var(--text-3)" }}>Venta:</span>
                          <input className="mono" value={it.precio || ""} onChange={e => actualizarItem(i, "precio", parseInt(e.target.value.replace(/\D/g,"")) || 0)} placeholder="$" style={{ padding: "6px 8px", border: "1px solid var(--border)", borderRadius: 6, width: 80, fontSize: 13 }}/>
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>

              <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-2)" }}>
                <span className="muted">{items.length} producto(s) · {items.reduce((s,i)=>s+i.qty,0)} unidades</span>
                <span className="mono" style={{ fontWeight: 600, fontSize: 18 }}>{window.fmtCOP(total)}</span>
              </div>
            </div>
          )}
        </Modal>
        );
      })()}

      {showProv && (
        <Modal title="Crear proveedor" onClose={() => setShowProv(false)} footer={
          <>
            <button className="btn ghost" onClick={() => setShowProv(false)}>Cancelar</button>
            <button className="btn primary" disabled={!provDraft.nombre || !provDraft.nit || !provDraft.tel}
              onClick={() => {
                setProveedores(ps => [...ps, { ...provDraft }]);
                setProveedor(provDraft.nombre);
                setProvDraft({ nombre: "", nit: "", tel: "" });
                setShowProv(false);
                setToast("Proveedor agregado");
              }}><Icon name="check" size={14}/> Guardar</button>
          </>
        }>
          <div className="field">
            <label>Nombre del proveedor</label>
            <input value={provDraft.nombre} onChange={e => setProvDraft(d => ({ ...d, nombre: e.target.value }))} placeholder="Ej: Distribuidora El Sol"/>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>NIT</label>
              <input className="mono" value={provDraft.nit} onChange={e => setProvDraft(d => ({ ...d, nit: e.target.value }))} placeholder="900.000.000-0"/>
            </div>
            <div className="field">
              <label>Teléfono</label>
              <input className="mono" value={provDraft.tel} onChange={e => setProvDraft(d => ({ ...d, tel: e.target.value.replace(/[^\d\s+()-]/g,"") }))} placeholder="(4) 444 1820"/>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast msg={toast} onDone={() => setToast(null)}/>}
    </>
  );
};

// =================== Escáner QR DIAN ===================
const QrScannerModal = ({ onClose, onRead }) => {
  const [estado, setEstado] = useStateA("listo");
  const escanear = () => {
    setEstado("escaneando");
    setTimeout(() => setEstado("leyendo"), 1200);
    setTimeout(() => setEstado("exito"), 2400);
    setTimeout(() => onRead(MOCK_QR_DIAN), 3400);
  };
  return (
    <Modal title="Escanear QR de factura electrónica DIAN" onClose={onClose} lg>
      <p className="muted tw-mt-0 tw-mb-3.5 tw-text-[13px]">
        Apunta la cámara al código QR impreso en la factura electrónica. El sistema descargará los datos del XML directamente desde la DIAN.
      </p>
      <div className="scanner-frame">
        <div className="scanner-viewport">
          {estado === "listo" && (
            <div className="scanner-placeholder">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                <path d="M14 14h3v3M21 14v7h-7M17 17v4"/>
              </svg>
              <div style={{ marginTop: 12, fontSize: 13 }}>Cámara lista</div>
            </div>
          )}
          {estado === "escaneando" && (
            <>
              <div className="scanner-stream"/>
              <div className="scanner-line"/>
              <div className="scanner-corners"/>
              <div className="scanner-status">Buscando código QR…</div>
            </>
          )}
          {estado === "leyendo" && (
            <>
              <div className="scanner-stream"/>
              <div className="scanner-corners green"/>
              <div className="scanner-status good">Consultando DIAN…</div>
            </>
          )}
          {estado === "exito" && (
            <div className="scanner-success">
              <Icon name="check" size={40}/>
              <div style={{ fontWeight: 600, marginTop: 8 }}>Factura encontrada</div>
              <div className="muted mono" style={{ fontSize: 11, marginTop: 4 }}>CUFE: {MOCK_QR_DIAN.cufe.slice(0,18)}...</div>
            </div>
          )}
        </div>
      </div>
      <div className="modal-f tw-mt-4 tw-rounded-lg tw-border-t tw-border-border tw-bg-surface-2">
        <button className="btn ghost" onClick={onClose} disabled={estado !== "listo"}>Cancelar</button>
        <button className="btn primary" onClick={escanear} disabled={estado !== "listo"}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1v6m0 6v6"/><circle cx="12" cy="13" r="4"/><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          </svg>
          {estado === "listo" ? "Iniciar escaneo" : "Escaneando…"}
        </button>
      </div>
    </Modal>
  );
};

// =================== Escáner IA (foto de factura) ===================
const IaScannerModal = ({ onClose, onRead }) => {
  const [estado, setEstado] = useStateA("listo");
  const [progreso, setProgreso] = useStateA(0);
  const [imgSrc, setImgSrc] = useStateA(null);
  const [fileName, setFileName] = useStateA("");
  const [isPdf, setIsPdf] = useStateA(false);
  const [imgData, setImgData] = useStateA(null);
  const [resultado, setResultado] = useStateA(null);
  const [errorMsg, setErrorMsg] = useStateA("");
  const fileRef = React.useRef(null);

  const seleccionarImagen = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const pdf = file.type === "application/pdf";
    setIsPdf(pdf);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setImgSrc(reader.result);
      const b64 = reader.result.split(",")[1];
      setImgData({ base64: b64, mimeType: file.type || "image/jpeg" });
      setEstado("preview");
    };
    reader.readAsDataURL(file);
  };

  const analizar = async () => {
    if (!imgData) return;
    setEstado("analizando");
    setProgreso(0);
    let p = 0;
    const interval = setInterval(() => {
      p += 3 + Math.random() * 5;
      if (p > 90) p = 90;
      setProgreso(Math.round(p));
    }, 300);
    try {
      const raw = await analizarConIA(imgData.base64, imgData.mimeType);
      clearInterval(interval);
      setProgreso(100);
      const items = matchItems(raw.items || []);
      const data = { ...raw, items };
      setResultado(data);
      setEstado("exito");
      setTimeout(() => onRead(data), 1200);
    } catch (err) {
      clearInterval(interval);
      const msg = err.name === "TypeError" && err.message.includes("fetch")
        ? "Sin conexión a internet. Verifica tu red e intenta de nuevo."
        : err.message || "Error al analizar la imagen.";
      setErrorMsg(msg);
      setEstado("error");
    }
  };

  const reintentar = () => {
    setEstado(imgSrc ? "preview" : "listo");
    setErrorMsg("");
    setProgreso(0);
  };

  return (
    <Modal title="Fotografiar factura" onClose={onClose} lg>
      <p className="muted tw-mt-0 tw-mb-2.5 tw-text-[13px]">
        Sube o toma una foto clara de la factura del proveedor. La IA leerá automáticamente proveedor, productos, cantidades y costos.
      </p>
      <input ref={fileRef} type="file" accept="image/*,.pdf" capture="environment" style={{ display: "none" }} onChange={seleccionarImagen}/>
      <div className="scanner-frame">
        <div className="scanner-viewport" style={{ background: "#1a1f2e" }}>
          {estado === "listo" && (
            <div className="scanner-placeholder" style={{ color: "#fff", cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <div style={{ marginTop: 12, fontSize: 13 }}>Toca para seleccionar archivo</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Foto, imagen PNG/JPG o PDF · cámara en móvil</div>
            </div>
          )}
          {estado === "preview" && imgSrc && (
            <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {isPdf ? (
                <div style={{ textAlign: "center", color: "#fff" }}>
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <div style={{ marginTop: 8, fontSize: 13, fontWeight: 500 }}>{fileName}</div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>PDF listo para analizar</div>
                </div>
              ) : (
                <img src={imgSrc} alt="Factura" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 4 }}/>
              )}
            </div>
          )}
          {estado === "analizando" && (
            <>
              {imgSrc && !isPdf && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.25 }}>
                  <img src={imgSrc} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}/>
                </div>
              )}
              <div className="ai-overlay">
                <div className="ai-status">
                  <div className="ai-spinner"/>
                  Analizando con IA… {progreso}%
                </div>
                <div className="ai-progress"><span style={{ width: progreso + "%" }}/></div>
                <div className="ai-checks">
                  {progreso > 15 && <div>✓ Imagen enviada a Gemini</div>}
                  {progreso > 40 && <div>✓ Extrayendo datos de factura</div>}
                  {progreso > 70 && <div>✓ Identificando productos</div>}
                  {progreso >= 100 && <div>✓ Cruzando con inventario</div>}
                </div>
              </div>
            </>
          )}
          {estado === "exito" && resultado && (
            <div className="scanner-success">
              <Icon name="check" size={40}/>
              <div style={{ fontWeight: 600, marginTop: 8 }}>Análisis completado</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                {resultado.items.length} productos detectados · {resultado.items.filter(i => i.encontrado).length} encontrados en inventario
              </div>
            </div>
          )}
          {estado === "error" && (
            <div className="scanner-placeholder" style={{ color: "#fff" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <div style={{ marginTop: 10, fontSize: 13, color: "#EF4444" }}>Error al analizar</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 4, maxWidth: 280, textAlign: "center", lineHeight: 1.4 }}>{errorMsg}</div>
            </div>
          )}
        </div>
      </div>
      <div className="modal-f tw-mt-4 tw-rounded-lg tw-border-t tw-border-border tw-bg-surface-2">
        <button className="btn ghost" onClick={estado === "error" ? reintentar : onClose} disabled={estado === "analizando"}>
          {estado === "error" ? "Reintentar" : "Cancelar"}
        </button>
        {estado === "listo" && (
          <button className="btn primary" onClick={() => fileRef.current?.click()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Seleccionar imagen
          </button>
        )}
        {estado === "preview" && (
          <div className="tw-flex tw-gap-2">
            <button className="btn ghost" onClick={() => { setImgSrc(null); setImgData(null); setIsPdf(false); setFileName(""); setEstado("listo"); }}>Cambiar</button>
            <button className="btn primary" onClick={analizar}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>
              Analizar con IA
            </button>
          </div>
        )}
        {estado === "error" && (
          <button className="btn primary" onClick={() => { setEstado("listo"); setImgSrc(null); setImgData(null); setIsPdf(false); setFileName(""); setErrorMsg(""); }}>
            Nueva imagen
          </button>
        )}
      </div>
    </Modal>
  );
};

const ItemAdder = ({ onAdd }) => {
  const [sku, setSku] = useStateA("");
  const [query, setQuery] = useStateA("");
  const [codigoBarras, setCodigoBarras] = useStateA("");
  const [qty, setQty] = useStateA("");
  const [costo, setCosto] = useStateA("");
  const [precio, setPrecio] = useStateA("");
  const [vence, setVence] = useStateA("");
  const [categoria, setCategoria] = useStateA("General");
  const [open, setOpen] = useStateA(false);
  const [highlight, setHighlight] = useStateA(-1);
  const opts = MOCK.productos;
  const sugeridos = useMemoA(() => {
    if (!query) return [];
    const q = query.toLowerCase().trim();
    return opts.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.codigoBarras && p.codigoBarras.includes(q))
    ).slice(0, 6);
  }, [query]);

  const elegir = (p) => {
    setSku(p.sku);
    setQuery(p.nombre);
    setCodigoBarras(p.codigoBarras || "");
    setCosto(p.costo);
    setPrecio(p.precio);
    setCategoria(p.categoria || "General");
    setOpen(false);
    setHighlight(-1);
  };

  const reset = () => {
    setSku(""); setQuery(""); setCodigoBarras(""); setQty(""); setCosto(""); setPrecio(""); setVence(""); setCategoria("General"); setHighlight(-1);
  };

  const esNuevo = query && !sku;

  return (
    <div className="tw-bg-surface-2 tw-border tw-border-border tw-rounded-lg tw-p-3 md:tw-p-4 tw-mt-3">
      <div className="tw-text-xs tw-font-semibold tw-text-txt-2 tw-mb-2 tw-flex tw-items-center tw-gap-1.5">
        <Icon name="plus" size={13}/> Agregar producto
      </div>

      {/* Fila 1: Producto (predictivo) + Código de barras */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-[1fr_200px] tw-gap-2 tw-mb-2">
        <div className="field" style={{ margin: 0, position: "relative" }}>
          <label>Producto</label>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setSku(""); setOpen(true); setHighlight(-1); }}
            onFocus={() => { if (query) setOpen(true); }}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={e => {
              if (e.key === "ArrowDown") { e.preventDefault(); setHighlight(h => Math.min(h + 1, sugeridos.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
              else if (e.key === "Enter") {
                if (highlight >= 0 && sugeridos[highlight]) elegir(sugeridos[highlight]);
                else if (sugeridos.length === 1) elegir(sugeridos[0]);
              }
              else if (e.key === "Escape") setOpen(false);
            }}
            placeholder="Escribe para buscar…"
            autoComplete="off"
          />
          {open && sugeridos.length > 0 && (
            <div className="tw-absolute tw-top-full tw-left-0 tw-right-0 tw-mt-1 tw-bg-surface tw-border tw-border-border tw-rounded-lg tw-shadow-lg tw-z-20 tw-max-h-[220px] tw-overflow-y-auto">
              {sugeridos.map((p, idx) => (
                <div key={p.sku} onMouseDown={() => elegir(p)}
                  onMouseEnter={() => setHighlight(idx)}
                  className={"tw-flex tw-justify-between tw-items-center tw-px-3 tw-py-2 tw-cursor-pointer tw-text-sm tw-border-b tw-border-border" + (idx === highlight ? " tw-bg-accent-soft" : "")}
                >
                  <div>
                    <div className="tw-font-medium">{p.nombre}</div>
                    <div className="mono muted tw-text-xs">{p.sku}{p.codigoBarras ? " · " + p.codigoBarras : ""} · {p.categoria}</div>
                  </div>
                  <span className="mono muted tw-text-xs">Stock {p.stock}</span>
                </div>
              ))}
            </div>
          )}
          {open && query && sugeridos.length === 0 && (
            <div className="tw-absolute tw-top-full tw-left-0 tw-right-0 tw-mt-1 tw-bg-surface tw-border tw-border-border tw-rounded-lg tw-p-2.5 tw-text-xs tw-text-txt-3">
              No encontrado — se creará como producto nuevo
            </div>
          )}
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Código de barras</label>
          <input className="mono" value={codigoBarras} onChange={e => setCodigoBarras(e.target.value)} placeholder="7702001148"/>
        </div>
      </div>

      {/* Fila 2: Categoría — readonly si existe, editable si es nuevo */}
      {query && (
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-[1fr_200px] tw-gap-2 tw-mb-2">
          <div className="field" style={{ margin: 0 }}>
            <label>Categoría</label>
            {esNuevo ? (
              <select value={categoria} onChange={e => setCategoria(e.target.value)}>
                {[...new Set(["General", ...MOCK.productos.map(p => p.categoria)])].sort().map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input value={categoria} readOnly style={{ background: "var(--surface-2)", color: "var(--text-3)", cursor: "default" }}/>
            )}
          </div>
        </div>
      )}

      {/* Fila 3: Cantidad, Costo, Precio, Vence, Botón */}
      <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-[1fr_1fr_1fr_1fr_auto] tw-gap-2 tw-items-end">
        <div className="field" style={{ margin: 0 }}>
          <label>Cantidad</label>
          <input className="mono" value={qty} onChange={e => setQty(e.target.value.replace(/\D/g,""))} placeholder="0"/>
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Costo unit.</label>
          <input className="mono" value={costo} onChange={e => setCosto(e.target.value.replace(/\D/g,""))} placeholder="0"/>
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Precio venta</label>
          <input className="mono" value={precio} onChange={e => setPrecio(e.target.value.replace(/\D/g,""))} placeholder="0"/>
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Vence</label>
          <input type="date" value={vence} onChange={e => setVence(e.target.value)}/>
        </div>
        <button className="btn primary tw-w-full md:tw-w-auto" disabled={(!sku && !query) || !qty} onClick={() => {
          onAdd(sku || ("NUEVO-" + Date.now()), qty, costo, vence, esNuevo ? query : undefined, codigoBarras, precio, esNuevo ? categoria : undefined);
          reset();
        }}><Icon name="plus" size={14}/> Agregar</button>
      </div>

      {esNuevo && query && (
        <div className="tw-mt-2 tw-text-xs tw-px-1 tw-flex tw-items-center tw-gap-1.5" style={{ color: "#C2410C" }}>
          <Icon name="alert" size={11}/> "{query}" no existe en bodega — se creará como producto nuevo al confirmar.
        </div>
      )}
    </div>
  );
};

Object.assign(window, { Ingreso, QrScannerModal, IaScannerModal, ItemAdder });
