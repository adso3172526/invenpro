(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  class InventoryUseCase {
    constructor(productoService) {
      this._productoService = productoService || null;
    }

    async getProducts() {
      if (!this._productoService) throw new Error("ProductoService no inyectado en InventoryUseCase");
      return this._productoService.getAll();
    }

    async createProduct(producto) {
      if (!this._productoService) throw new Error("ProductoService no inyectado en InventoryUseCase");
      return this._productoService.create(producto);
    }

    async updateProduct(sku, updates) {
      if (!this._productoService) throw new Error("ProductoService no inyectado en InventoryUseCase");
      return this._productoService.update(sku, updates);
    }
  }

  root.InventoryUseCase = InventoryUseCase;
  window.InventoryUseCase = InventoryUseCase;
})();
