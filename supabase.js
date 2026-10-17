// Supabase client — InvenPro
(function () {
  const SUPABASE_URL  = "https://wwwfahcrwfowvnpusjbc.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3d2ZhaGNyd2Zvd3ZucHVzamJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjUyOTIsImV4cCI6MjA5NjE0MTI5Mn0.umZOMowkRGeuASytetlcKUrSjnNGiM6UgxJnzDV1JYE";

  // global.headers FUERZA apikey + Authorization en TODAS las peticiones (REST,
  // functions, storage). Blinda contra el error intermitente "No API key found
  // in request": aunque el estado interno del cliente se corrompa, la apikey
  // siempre viaja. Esta app no usa Supabase Auth (login propio vía fn_login), así
  // que la autorización es siempre la anon.
  window.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: "Bearer " + SUPABASE_ANON_KEY,
      },
    },
  });
})();
