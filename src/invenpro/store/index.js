(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  Object.assign(root, {
    DataStore: root.DataStore || window.DataStore,
    BaseStore: root.BaseStore || window.BaseStore,
    RealtimeManager: root.RealtimeManager || window.RealtimeManager,
    ViewRefresher: root.ViewRefresher || window.ViewRefresher,
    DetalleRefetcher: root.DetalleRefetcher || window.DetalleRefetcher,
    EventBus: root.EventBus || window.EventBus,
    GenericHandler: root.GenericHandler || window.GenericHandler,
    IRealtimeHandler: root.IRealtimeHandler || window.IRealtimeHandler,
  });
})();
