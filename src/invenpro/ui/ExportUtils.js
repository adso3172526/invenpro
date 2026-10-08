(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var exportXlsx = function (filename, sheets) {
    if (!window.XLSX) { alert("Libreria de Excel no disponible."); return; }
    var wb = window.XLSX.utils.book_new();
    sheets.forEach(function (s) {
      var ws = window.XLSX.utils.json_to_sheet(s.rows);
      window.XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
    });
    window.XLSX.writeFile(wb, filename);
  };
  root.ExportUtils = { exportXlsx: exportXlsx };
  window.exportXlsx = exportXlsx;
})();
