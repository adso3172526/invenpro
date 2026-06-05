// Supabase client — InvenPro
// Sustituye SUPABASE_URL y SUPABASE_ANON_KEY con los valores de tu proyecto.
(function () {
  const SUPABASE_URL  = "https://wwwfahcrwfowvnpusjbc.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3d2ZhaGNyd2Zvd3ZucHVzamJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjUyOTIsImV4cCI6MjA5NjE0MTI5Mn0.umZOMowkRGeuASytetlcKUrSjnNGiM6UgxJnzDV1JYE";

  if (window.supabase && window.supabase.createClient) {
    window.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    console.error("Supabase SDK no cargó. Intentando cargar dinámicamente...");
    var s = document.createElement("script");
    s.src = "https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js";
    s.onload = function () {
      if (window.supabase && window.supabase.createClient) {
        window.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase cargado via fallback.");
      } else {
        console.error("No se pudo cargar Supabase. Verifica tu conexión a internet.");
      }
    };
    s.onerror = function () {
      console.error("No se pudo cargar Supabase. Verifica tu conexión a internet.");
    };
    document.head.appendChild(s);
  }
})();
