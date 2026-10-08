(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var similar = function (a, b) {
    if (!a || !b) return 0;
    a = a.toLowerCase().trim(); b = b.toLowerCase().trim();
    if (a === b) return 1;
    var longer = a.length >= b.length ? a : b;
    var shorter = a.length < b.length ? a : b;
    if (longer.length === 0) return 1;
    var m = shorter.length, n = longer.length;
    var dp = Array.from({ length: m + 1 }, function () { return new Uint16Array(n + 1); });
    for (var i = 1; i <= m; i++)
      for (var j = 1; j <= n; j++)
        dp[i][j] = shorter[i-1] === longer[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
    return (2 * dp[m][n]) / (m + n);
  };
  var matchItems = function (geminiItems, store) {
    var productos = (store && store.productos) || [];
    return geminiItems.map(function (item) {
      var bestMatch = null, bestScore = 0;
      for (var pi = 0; pi < productos.length; pi++) {
        var score = similar(item.nombre, productos[pi].nombre);
        if (score > bestScore) { bestScore = score; bestMatch = productos[pi]; }
      }
      if (bestScore > 0.7 && bestMatch)
        return Object.assign({}, item, { sku: bestMatch.sku, encontrado: true, confianza: Math.round(bestScore * 100) / 100 });
      return Object.assign({}, item, { sku: null, encontrado: false, nuevo: true, confianza: Math.round(bestScore * 100) / 100 });
    });
  };
  root.ProductMatcher = { similar: similar, matchItems: matchItems };
  window.similar = similar;
  window.matchItems = function (items) { return matchItems(items, window.MOCK); };
})();
