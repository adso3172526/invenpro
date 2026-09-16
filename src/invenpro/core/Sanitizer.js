(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  var SQLInjection = {
    LIKE_CHARS: /[%_]/g,
    DANGEROUS_CHARS: /['";\\]/g,
    NUMERIC_ONLY: /[^0-9.\-]/g,
    ALPHA_ONLY: /[^a-zA-Z0-9áéíóúñüÁÉÍÓÚÑÜ\s]/g,
    SKU_PATTERN: /^P-\d{5}$/,
    ID_PATTERN: /^(ING|PRV|FAC|TURN)-[\w\-]+$/,

    sanitizeLike(value) {
      if (typeof value !== "string") return String(value || "");
      return value.replace(this.LIKE_CHARS, "\\$&");
    },

    sanitizeString(value) {
      if (typeof value !== "string") return String(value || "");
      return value
        .replace(this.DANGEROUS_CHARS, "")
        .trim()
        .substring(0, 500);
    },

    sanitizeNumeric(value) {
      var n = Number(value);
      return isNaN(n) ? 0 : n;
    },

    sanitizeId(value) {
      if (typeof value !== "string") return "";
      var clean = value.replace(this.DANGEROUS_CHARS, "").trim();
      if (clean.length > 50) clean = clean.substring(0, 50);
      return clean;
    },

    sanitizeSku(value) {
      if (typeof value !== "string") return "";
      return value.replace(/[^a-zA-Z0-9\-]/g, "").substring(0, 20);
    },

    validateEmail(email) {
      if (typeof email !== "string") return false;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    sanitizeEmail(value) {
      if (typeof value !== "string") return "";
      return value.replace(this.DANGEROUS_CHARS, "").trim().substring(0, 254);
    },

    sanitizeNIT(value) {
      if (typeof value !== "string") return "";
      return value.replace(/[^0-9.\-]/g, "").substring(0, 20);
    },

    sanitizePhone(value) {
      if (typeof value !== "string") return "";
      return value.replace(/[^0-9\s\-\(\)\+]/g, "").substring(0, 20);
    }
  };

  root.SQLInjection = SQLInjection;
})();
