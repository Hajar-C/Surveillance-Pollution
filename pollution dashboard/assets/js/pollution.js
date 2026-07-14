// assets/js/pollution-dashboard.js
(function () {
  const KEY = window.APP_CONFIG?.OPENWEATHER_KEY;
  if (!KEY) {
    console.error("OpenWeather key missing. Check assets/js/config.js");
    return;
  }

  // Liste des villes (tu peux changer/ajouter)
  const CITIES = [
    { name: "Rabat", lat: 34.0209, lon: -6.8416 },
    { name: "Casablanca", lat: 33.5731, lon: -7.5898 },
    { name: "Meknes", lat: 33.8938, lon: -5.5473 },
    { name: "Nador", lat: 35.1740, lon: -2.9287 },
  ];

  const tbody = document.getElementById("airTableBody");
  if (!tbody) {
    console.warn("airTableBody not found in dashboard.html");
    return;
  }

  function aqiLabel(aqi) {
    // OpenWeather AQI: 1..5
    switch (aqi) {
      case 1: return { text: "Bon", cls: "text-success" };
      case 2: return { text: "Correct", cls: "text-info" };
      case 3: return { text: "Moyen", cls: "text-warning" };
      case 4: return { text: "Mauvais", cls: "text-danger" };
      case 5: return { text: "Très mauvais", cls: "text-danger" };
      default: return { text: "N/A", cls: "text-muted" };
    }
  }

  function fmtDate(d) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async function fetchPollution(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("OpenWeather error: " + res.status);
    return res.json();
  }

  async function loadTable() {
    tbody.innerHTML = `<tr><td colspan="4">Chargement...</td></tr>`;

    const rows = [];
    for (const c of CITIES) {
      try {
        const data = await fetchPollution(c.lat, c.lon);
        const item = data.list?.[0];
        const aqi = item?.main?.aqi ?? null;
        const label = aqiLabel(aqi);
        const updated = fmtDate(new Date());

        rows.push(`
          <tr>
            <td>${c.name}</td>
            <td>${aqi ?? "-"}</td>
            <td><span class="${label.cls}">${label.text}</span></td>
            <td class="text-center">${updated}</td>
          </tr>
        `);
      } catch (e) {
        rows.push(`
          <tr>
            <td>${c.name}</td>
            <td>-</td>
            <td><span class="text-danger">Erreur API</span></td>
            <td class="text-center">-</td>
          </tr>
        `);
        console.error("City error", c.name, e);
      }
    }

    tbody.innerHTML = rows.join("");
  }

  document.addEventListener("DOMContentLoaded", loadTable);
})();
