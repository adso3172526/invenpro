// Supabase client — InvenPro
// Sustituye SUPABASE_URL y SUPABASE_ANON_KEY con los valores de tu proyecto.
(function () {
  const SUPABASE_URL  = "https://wwwfahcrwfowvnpusjbc.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3d2ZhaGNyd2Zvd3ZucHVzamJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjUyOTIsImV4cCI6MjA5NjE0MTI5Mn0.umZOMowkRGeuASytetlcKUrSjnNGiM6UgxJnzDV1JYE";

  window.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();
