(function () {
  const root = (window.InvenPro = window.InvenPro || {});

  // --- IEntity: contract for all domain entities ---
  class IEntity {
    get id() { throw new Error("Not implemented: get id()"); }
    toJSON() { throw new Error("Not implemented: toJSON()"); }
    static from(data) { throw new Error("Not implemented: static from()"); }
  }

  // --- IRepository: contract for all repositories ---
  class IRepository {
    getDb() { throw new Error("Not implemented: getDb()"); }
    async findAll() { throw new Error("Not implemented: findAll()"); }
    async findById(id) { throw new Error("Not implemented: findById()"); }
    async create(entity) { throw new Error("Not implemented: create()"); }
    async update(id, patch) { throw new Error("Not implemented: update()"); }
    async remove(id) { throw new Error("Not implemented: remove()"); }
  }

  // --- IService: contract for all services ---
  class IService {
    getDb() { throw new Error("Not implemented: getDb()"); }
    async handleError(context, error) { throw new Error("Not implemented: handleError()"); }
  }

  // --- IController: contract for all controllers ---
  class IController {
    constructor(deps) { /* deps injection point */ }
  }

  // --- IRealtimeHandler: contract for realtime event handlers ---
  class IRealtimeHandler {
    constructor(store, eventBus) {
      this.store = store;
      this.eventBus = eventBus;
    }
    handleInsert(row) { throw new Error("Not implemented: handleInsert()"); }
    handleUpdate(row) { throw new Error("Not implemented: handleUpdate()"); }
    handleDelete(oldRow) { throw new Error("Not implemented: handleDelete()"); }
    dispatch(payload) {
      var camelize = root.Helpers.camelize;
      var row = camelize(payload.new || {});
      var oldRow = camelize(payload.old || {});
      switch (payload.eventType) {
        case "INSERT": return this.handleInsert(row);
        case "UPDATE": return this.handleUpdate(row);
        case "DELETE": return this.handleDelete(oldRow || row);
      }
    }
  }

  Object.assign(root, { IEntity, IRepository, IService, IController, IRealtimeHandler });
  window.IEntity = IEntity;
  window.IRepository = IRepository;
  window.IService = IService;
  window.IController = IController;
  window.IRealtimeHandler = IRealtimeHandler;
})();
