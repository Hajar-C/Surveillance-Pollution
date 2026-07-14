console.log("✅ main.js chargé");

const supabaseUrl = 'https://cjzgmsxfyqbdwlqtehgd.supabase.co';
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqemdtc3hmeXFiZHdscXRlaGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjI3MzksImV4cCI6MjA4MjIzODczOX0.CWpZJBEqHycQmOU9FjQ43KQ3vceUdHPfz2zObnEFRTA";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const BACKEND_URL = "https://cjzgmsxfyqbdwlqtehgd.supabase.co/functions/v1/collect-pollution";

let map = null;
let marker = null;
let pollutionChart = null;

document.addEventListener("DOMContentLoaded", () => {
  console.log("🟢 DOM chargé");
  initPollutionButton();
  initMapIfExists();
});

// ✅ Fonction toast
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) {
    alert(msg); // fallback si pas de div toast
    return;
  }
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function initPollutionButton() {
  const btn = document.getElementById("btnPollution");
  if (!btn) return;
  btn.addEventListener("click", collectByCity);
}

async function collectByCity() {
  const city = document.getElementById("searchCity").value.trim();
  if (!city) return alert("Entrez une ville");

  console.log("📡 Appel backend :", city);

  const res = await fetch(BACKEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseKey}`,
      "apikey": supabaseKey
    },
    body: JSON.stringify({ city })
  });

  if (!res.ok) {
    const t = await res.text();
    console.error("❌ Erreur backend :", t);
    alert("Erreur serveur : " + t);
    return;
  }

  const data = await res.json();
  console.log("✅ Réponse backend :", data);

  if (!data.lat || !data.lon || !data.aqi) {
    alert("Données manquantes ou invalides");
    return;
  }

  showResult(city, data);
  showOnMap(data.lat, data.lon, data.aqi, data.pm25, data.pm10, city);
  loadPollutionHistory(city);

  // ✅ Message de confirmation
  showToast("✅ Message bien envoyé");
}

function initMapIfExists() {
  const mapDiv = document.getElementById("map");
  if (!mapDiv) {
    console.log("❌ map div non trouvée");
    return;
  }

  console.log("🗺️ Initialisation map Leaflet");

  map = L.map("map", { doubleClickZoom: false }).setView([31.79, -7.09], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  // ✅ double‑clic → afficher coordonnées + pollution + insérer en table
  map.on("dblclick", async (e) => {
    const { lat, lng } = e.latlng;

    if (marker) map.removeLayer(marker);
    marker = L.circleMarker([lat, lng], {
      radius: 10,
      color: "blue",
      fillColor: "blue",
      fillOpacity: 0.6
    }).addTo(map);

    try {
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
          "apikey": supabaseKey
        },
        body: JSON.stringify({ lat, lon: lng })
      });

      const data = await res.json();

      if (res.ok && data.aqi) {
        // ✅ Afficher popup
        marker.bindPopup(`
          <b>${data.city || "Coordonnées sélectionnées"}</b><br>
          Lat: ${lat.toFixed(5)}<br>
          Lon: ${lng.toFixed(5)}<br>
          AQI : ${data.aqi}<br>
          PM2.5 : ${data.pm25}<br>
          PM10 : ${data.pm10}
        `).openPopup();

        // ✅ Insérer aussi dans la table pollution
        await supabaseClient.from("pollution").insert({
          city: data.city || "Coordonnées",
          lat,
          lon: lng,
          aqi: data.aqi,
          pm25: data.pm25,
          pm10: data.pm10,
          source: "openweather",
          date_time: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });

        // ✅ Mettre à jour l’historique
        loadPollutionHistory(data.city || "Coordonnées");

        // ✅ Message de confirmation
        showToast("✅ Message bien envoyé");
      } else {
        marker.bindPopup(`
          <b>Coordonnées sélectionnées</b><br>
          Lat: ${lat.toFixed(5)}<br>
          Lon: ${lng.toFixed(5)}<br>
          ❌ Pollution non disponible
        `).openPopup();
      }
    } catch (err) {
      console.error("Erreur backend :", err);
      marker.bindPopup(`
        <b>Coordonnées sélectionnées</b><br>
        Lat: ${lat.toFixed(5)}<br>
        Lon: ${lng.toFixed(5)}<br>
        ❌ Erreur serveur
      `).openPopup();
    }
  });
}

function showOnMap(lat, lon, aqi, pm25, pm10, city) {
  if (!map) return;

  if (marker) map.removeLayer(marker);

  const colors = ["green", "yellow", "orange", "red", "black"];
  const color = colors[aqi - 1] || "gray";

  marker = L.circleMarker([lat, lon], {
    radius: 12,
    color,
    weight: 2,
    fillColor: color,
    fillOpacity: 0.7
  }).addTo(map);

  marker.bindPopup(`
    <b>${city}</b><br>
    AQI : ${aqi}<br>
    PM2.5 : ${pm25}<br>
    PM10 : ${pm10}
  `).openPopup();

  map.setView([lat, lon], 10);
}

function showResult(city, d) {
  document.getElementById("result").innerHTML = `
    <h3>${city}</h3>
    <p>AQI : ${d.aqi}</p>
    <p>PM2.5 : ${d.pm25}</p>
    <p>PM10 : ${d.pm10}</p>
  `;
}

async function loadPollutionHistory(city) {
  const { data } = await supabaseClient
    .from("pollution")
    .select("aqi, pm25, date_time")
    .eq("city", city)
    .order("date_time");

  if (!data || !data.length) return;

  const labels = data.map(d =>
    new Date(d.date_time).toLocaleString()
  );

  const ctx = document.getElementById("pollutionChart");
  if (pollutionChart) pollutionChart.destroy();

  pollutionChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "AQI", data: data.map(d => d.aqi), borderColor: "red" },
        { label: "PM2.5", data: data.map(d => d.pm25), borderColor: "blue" }
      ]
    }
  });
}
