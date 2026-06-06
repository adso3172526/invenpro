// Iconos y primitivas UI compartidas (sin dependencias externas)
const Icon = ({ name, size = 16 }) => {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>,
    moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></>,
    shield: <path d="M12 2 4 5v6c0 5 3.5 9.4 8 11 4.5-1.6 8-6 8-11V5l-8-3z"/>,
    cart: <><circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.5L22 8H6"/></>,
    box: <><path d="M21 8 12 3 3 8v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5M12 13v8"/></>,
    truck: <><path d="M1 5h13v11H1zM14 8h4l3 3v5h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></>,
    users: <><circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-3.5 3-6.5 7-6.5s7 3 7 6.5"/><circle cx="17" cy="9" r="2.8"/><path d="M16 14.5c3.4 0 6 2.5 6 5.5"/></>,
    chart: <><path d="M3 21h18"/><path d="M6 17V9M11 17V5M16 17v-7M21 17v-3"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    minus: <path d="M5 12h14"/>,
    x: <path d="M18 6 6 18M6 6l12 12"/>,
    check: <path d="M5 12l5 5 9-11"/>,
    print: <><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/></>,
    trash: <><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></>,
    arrowRight: <path d="M5 12h14M13 6l6 6-6 6"/>,
    arrowDown: <path d="M12 5v14M6 13l6 6 6-6"/>,
    arrowUp: <path d="M12 19V5M6 11l6-6 6 6"/>,
    download: <><path d="M12 3v12"/><path d="m6 11 6 6 6-6"/><path d="M5 21h14"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></>,
    bell: <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9z"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
    pkg: <><path d="m7.5 4.27 9 5.15"/><path d="M21 8 12 3 3 8v8l9 5 9-5V8z"/><path d="M3.27 6.96 12 12l8.73-5.04M12 22V12"/></>,
    home: <><path d="M3 12 12 3l9 9"/><path d="M5 10v10h14V10"/></>,
    alert: <><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>,
    store: <><path d="M3 9 5 4h14l2 5"/><path d="M3 9v11h18V9"/><path d="M3 9a3 3 0 0 0 6 0M9 9a3 3 0 0 0 6 0M15 9a3 3 0 0 0 6 0"/></>,
    scan: <><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M3 17v2a2 2 0 0 1 2 2h2M17 21h2a2 2 0 0 1 2-2v-2"/><path d="M7 12h10"/></>,
  };
  return <svg {...props}>{paths[name] || null}</svg>;
};

const Toast = ({ msg, onDone }) => {
  React.useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, []);
  return <div className="toast"><Icon name="check" size={14}/> {msg}</div>;
};

const Modal = ({ title, onClose, children, footer, lg, bottomSheet }) => (
  <div className="modal-bg" onClick={onClose}>
    <div className={"modal" + (lg ? " lg" : "") + (bottomSheet ? " bottom-sheet" : "")} onClick={e => e.stopPropagation()}>
      <div className="modal-h">
        <h3>{title}</h3>
        <button className="x" onClick={onClose}><Icon name="x"/></button>
      </div>
      <div className="modal-b">{children}</div>
      {footer && <div className="modal-f">{footer}</div>}
    </div>
  </div>
);

// Mini sparkline
const Spark = ({ data, color = "var(--accent)", h = 36, w = 80 }) => {
  if (!data?.length) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const span = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i*step},${h - ((v-min)/span)*h}`).join(" ");
  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// Paginación: hook + componente UI reutilizable
const usePagination = (data, pageSize = 10) => {
  const [page, setPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil((data?.length || 0) / pageSize));
  React.useEffect(() => { if (page > totalPages) setPage(1); }, [data?.length, totalPages]);
  const slice = (data || []).slice((page-1)*pageSize, page*pageSize);
  return { page, setPage, totalPages, slice, total: data?.length || 0, pageSize };
};

const Pagination = ({ page, setPage, totalPages, total, pageSize, label = "registros" }) => {
  if (total <= pageSize) return null;
  const from = (page-1)*pageSize + 1;
  const to = Math.min(total, page*pageSize);
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);
  return (
    <div className="pagination">
      <span className="muted" style={{ fontSize: 12 }}>
        Mostrando <b>{from}</b>–<b>{to}</b> de <b>{total}</b> {label}
      </span>
      <div className="row" style={{ gap: 4 }}>
        <button className="btn sm ghost" disabled={page === 1} onClick={() => setPage(1)} title="Primera">«</button>
        <button className="btn sm ghost" disabled={page === 1} onClick={() => setPage(p => p-1)} title="Anterior">‹</button>
        {start > 1 && <span className="muted" style={{ padding: "0 4px" }}>…</span>}
        {pages.map(n => (
          <button key={n} className={"btn sm" + (n === page ? " primary" : " ghost")} onClick={() => setPage(n)}>{n}</button>
        ))}
        {end < totalPages && <span className="muted" style={{ padding: "0 4px" }}>…</span>}
        <button className="btn sm ghost" disabled={page === totalPages} onClick={() => setPage(p => p+1)} title="Siguiente">›</button>
        <button className="btn sm ghost" disabled={page === totalPages} onClick={() => setPage(totalPages)} title="Última">»</button>
      </div>
    </div>
  );
};

Object.assign(window, { Icon, Toast, Modal, Spark, usePagination, Pagination });
