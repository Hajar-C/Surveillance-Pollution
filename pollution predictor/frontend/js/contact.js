console.log("✅ contact.js chargé");

const supabaseUrl = 'https://cjzgmsxfyqbdwlqtehgd.supabase.co';
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqemdtc3hmeXFiZHdscXRlaGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjI3MzksImV4cCI6MjA4MjIzODczOX0.CWpZJBEqHycQmOU9FjQ43KQ3vceUdHPfz2zObnEFRTA";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// ⚠️ URL de ton Edge Function (slug = quick-api)
const CONTACT_URL = `${supabaseUrl}/functions/v1/quick-api`;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const toast = document.getElementById("toast");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("contactName").value.trim();
    const email = document.getElementById("contactEmail").value.trim();
    const action = document.getElementById("contactAction").value;
    const message = document.getElementById("contactMessage").value.trim();

    if (!name || !email) {
      showToast("❌ Nom et email requis");
      return;
    }
    if (action === "message" && !message) {
      showToast("❌ Message obligatoire si vous envoyez un message");
      return;
    }

    try {
      const res = await fetch(CONTACT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`, // clé anon côté frontend
          "apikey": supabaseKey
        },
        body: JSON.stringify({ name, email, action, message })
      });

      const data = await res.json();
      if (res.ok) {
        showToast("✅ " + (data.message || "Message bien envoyé"));
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
