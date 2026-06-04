// Supabase client — InvenPro
// Sustituye SUPABASE_URL y SUPABASE_ANON_KEY con los valores de tu proyecto.
(function () {
  const SUPABASE_URL  = "https://YOUR_PROJECT.supabase.co";
  const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";

  window.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();
