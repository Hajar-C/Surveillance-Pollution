console.log("✅ inscription.js chargé");

const supabaseUrl = 'https://cjzgmsxfyqbdwlqtehgd.supabase.co';
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqemdtc3hmeXFiZHdscXRlaGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjI3MzksImV4cCI6MjA4MjIzODczOX0.CWpZJBEqHycQmOU9FjQ43KQ3vceUdHPfz2zObnEFRTA";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
// ⚠️ URL de ton Edge Function (slug = signup)
const SIGNUP_URL = `${supabaseUrl}/functions/v1/signup`;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");
  const toast = document.getElementById("toast");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const city = document.getElementById("city").value.trim();

    if (!name || !email || !city) {
      showToast("❌ Tous les champs sont requis");
      return;
    }

    try {
      const res = await fetch(SIGNUP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`, // clé anon côté frontend
          "apikey": supabaseKey
        },
        body: JSON.stringify({ name, email, city })
      });

      const data = await res.json();
      if (res.ok) {
        showToast("✅ " + (data.message || "Inscription réussie"));
        form.reset();
      } else {
        showToast("❌ " + (data.error || "Erreur serveur"));
      }
    } catch (err) {
      console.error("Erreur réseau :", err);
      showToast("❌ Erreur réseau / CORS");
    }
  });

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  }
});
