// Supabase client — InvenPro
// Sustituye SUPABASE_URL y SUPABASE_ANON_KEY con los valores de tu proyecto.
(function () {
  const SUPABASE_URL  = "https://xyzcompany.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

  window.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();
