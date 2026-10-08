(function () {
  var root = (window.InvenPro = window.InvenPro || {});
  var Sanitizer = root.Sanitizer || root.SQLInjection || window.Sanitizer || {};

  class BaseRepository {
    constructor(tableName, primaryKey, mapper, db) {
      this.tableName = tableName;
      this.primaryKey = primaryKey || "id";
      this.mapper = mapper || function (row) { return row; };
      this._db = db || null;
    }

    getDb() {
      if (!this._db) {
        throw new Error("DataSource no inyectado en el repositorio. Use setDb() o inyecte db en el constructor.");
      }
      return this._db;
    }

    setDb(db) {
      this._db = db;
    }

    _sanitizeId(id) {
      return Sanitizer.sanitizeId ? Sanitizer.sanitizeId(id) : id;
    }

    _sanitizeString(value) {
      return Sanitizer.sanitizeString ? Sanitizer.sanitizeString(value) : value;
    }

    _sanitizeLike(value) {
      return Sanitizer.sanitizeLike ? Sanitizer.sanitizeLike(value) : value;
    }

    async findAll() {
      var result = await this.getDb().from(this.tableName).select("*");
      if (result.error) throw result.error;
      return (result.data || []).map(this.mapper);
    }

    async findById(id) {
      var safeId = this._sanitizeId(id);
      var result = await this.getDb()
        .from(this.tableName).select("*").eq(this.primaryKey, safeId).maybeSingle();
      if (result.error) throw result.error;
      return result.data ? this.mapper(result.data) : null;
    }

    async findByField(field, value) {
      var safeValue = typeof value === "string" ? this._sanitizeString(value) : value;
      var result = await this.getDb()
        .from(this.tableName).select("*").eq(field, safeValue).maybeSingle();
      if (result.error) throw result.error;
      return result.data ? this.mapper(result.data) : null;
    }

    async findByLike(field, pattern) {
      var safePattern = this._sanitizeLike(pattern);
      var result = await this.getDb()
        .from(this.tableName).select("*").ilike(field, "%" + safePattern + "%");
      if (result.error) throw result.error;
      return (result.data || []).map(this.mapper);
    }

    async create(entity) {
      var result = await this.getDb().from(this.tableName).insert(entity);
      if (result.error) throw result.error;
      return true;
    }

    async update(id, patch) {
      var safeId = this._sanitizeId(id);
      var result = await this.getDb()
        .from(this.tableName).update(patch).eq(this.primaryKey, safeId);
      if (result.error) throw result.error;
      return true;
    }

    async remove(id) {
      var safeId = this._sanitizeId(id);
      var result = await this.getDb()
        .from(this.tableName).delete().eq(this.primaryKey, safeId);
      if (result.error) throw result.error;
      return true;
    }
  }

  root.BaseRepository = BaseRepository;
  window.BaseRepository = BaseRepository;
})();
