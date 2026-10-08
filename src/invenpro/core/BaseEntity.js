(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  class BaseEntity {
    #raw;

    constructor(data) {
      this.#raw = Object.assign({}, data || {});
    }

    get id() {
      return this.#raw.id || this.#raw.sku || this.#raw.usuario || "";
    }

    static from(data) {
      if (Array.isArray(data)) return data.map(function (item) { return new this(item); }.bind(this));
      return new this(data);
    }

    toJSON() {
      return Object.assign({}, this.#raw);
    }

    getData() {
      return Object.assign({}, this.#raw);
    }

    setData(data) {
      var allowed = this._allowedFields();
      var keys = Object.keys(data || {});
      for (var i = 0; i < keys.length; i++) {
        if (allowed.length === 0 || allowed.indexOf(keys[i]) !== -1) {
          this.#raw[keys[i]] = data[keys[i]];
        }
      }
      return this;
    }

    _allowedFields() {
      return [];
    }
  }

  root.BaseEntity = BaseEntity;
  window.BaseEntity = BaseEntity;
})();
