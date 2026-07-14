// assets/js/table-airquality.js
(function () {
  "use strict";

  const cfg = window.APP_CONFIG || {};
  const KEY = cfg.OPENWEATHER_API_KEY || cfg.OPENWEATHER_KEY || cfg.OPENWEATHER_APIKEY;

  const tbody = document.getElementById("airTableBody");
  const STORAGE_KEY = "AQ_CITIES_V1";

  if (!tbody) return;

  function defaultCities() {
    return [
      { name: "Rabat", lat: 34.0209, lon: -6.8416 },
      { name: "Casablanca", lat: 33.5731, lon: -7.5898 },
      { name: "Meknes", lat: 33.8938, lon: -5.5473 },
      { name: "Nador", lat: 35.1740, lon: -2.9287 },
    ];
  }

  function loadCities() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultCities();
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr) || arr.length === 0) return defaultCities();
      return arr;
    } catch {
      return defaultCities();
    }
  }

  function saveCities(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function aqiStatus(aqi) {
    switch (aqi) {
      case 1: return { text: "Bon", cls: "badge badge-success" };
      case 2: return { text: "Correct", cls: "badge badge-info" };
      case 3: return { text: "Modéré", cls: "badge badge-warning" };
      case 4: return { text: "Mauvais", cls: "badge badge-danger" };
      case 5: return { text: "Très mauvais", cls: "badge badge-danger" };
      default: return { text: "N/A", cls: "badge badge-secondary" };
    }
  }

  function fmtDate(d) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function fetchAQI(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${encodeURIComponent(KEY)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`AQI HTTP ${res.status}`);
    const data = await res.json();
    return data?.list?.[0]?.main?.aqi ?? null;
  }

  async function renderTable() {
    if (!KEY) {
      tbody.innerHTML = `<tr><td colspan="4">Clé OpenWeather manquante (config.js).</td></tr>`;
      return;
    }

    const cities = loadCities();
    saveCities(cities);

    tbody.innerHTML = `<tr><td colspan="4">Chargement...</td></tr>`;
    const now = fmtDate(new Date());

    const rows = await Promise.all(
      cities.map(async (c) => {
        try {
          const aqi = await fetchAQI(c.lat, c.lon);
          const st = aqiStatus(aqi);
          return `
            <tr>
              <td>${escapeHtml(c.name)}</td>
              <td>${aqi ?? "-"}</td>
              <td><span class="${st.cls}">${st.text}</span></td>
              <td class="text-center">${now}</td>
            </tr>
          `;
        } catch {
          return `
            <tr>
              <td>${escapeHtml(c.name)}</td>
              <td>-</td>
              <td><span class="badge badge-danger">Erreur API</span></td>
              <td class="text-center">-</td>
            </tr>
          `;
        }
      })
    );

    tbody.innerHTML = rows.join("");
  }

  document.addEventListener("DOMContentLoaded", renderTable);

  // refresh demandé par search.js
  window.addEventListener("table:refresh", renderTable);
})();
