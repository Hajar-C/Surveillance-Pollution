/*=========================================================
   charts-airquality.js
   - Black Dashboard (Chart.js) + OpenWeather Air Pollution
   - Historique "simple" (sans calcul): points toutes les X heures
   - 4 charts : PM2.5 (µg/m³)
   - Tableau : AQI + statut (optionnel, gardé)
========================================================= */

(function () {
  "use strict";

  // ---------- Helpers ----------
  function $(id) {
    return document.getElementById(id);
  }

  function mustGetApiKey() {
    const cfg = window.APP_CONFIG || {};
    const k = cfg.OPENWEATHER_API_KEY || cfg.OPENWEATHER_KEY || cfg.OPENWEATHER_APIKEY;
    if (!k) {
      console.error("[charts-airquality] Clé OpenWeather introuvable dans window.APP_CONFIG");
      return null;
    }
    return k;
  }

  function fmtDate(tsSec) {
    const d = new Date(tsSec * 1000);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    return `${dd}/${mm} ${hh}h`;
  }

  function aqiLabel(aqi) {
    switch (aqi) {
      case 1: return "Bon";
      case 2: return "Correct";
      case 3: return "Modéré";
      case 4: return "Mauvais";
      case 5: return "Très mauvais";
      default: return "N/A";
    }
  }

  function aqiBadgeClass(aqi) {
    switch (aqi) {
      case 1: return "badge-success";
      case 2: return "badge-info";
      case 3: return "badge-warning";
      case 4: return "badge-danger";
      case 5: return "badge-danger";
      default: return "badge-secondary";
    }
  }

  function safeDestroy(chartRef) {
    try {
      if (chartRef && typeof chartRef.destroy === "function") chartRef.destroy();
    } catch (e) {}
  }

  // ---------- Chart builders ----------
  function buildLineChart(canvasId, labels, data, title) {
    const el = $(canvasId);
    if (!el) return null;

    return new Chart(el.getContext("2d"), {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: title,
            data,
            borderColor: "#d048b6",
            backgroundColor: "rgba(208,72,182,0.10)",
            pointBackgroundColor: "#d048b6",
            pointHoverBackgroundColor: "#d048b6",
            fill: true,
            tension: 0.25,
            pointRadius: 2,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true } },
        scales: {
          x: { ticks: { autoSkip: true, maxTicksLimit: 8 } },
          y: { beginAtZero: true },
        },
      },
    });
  }

  function buildBarChart(canvasId, labels, data, title) {
    const el = $(canvasId);
    if (!el) return null;

    return new Chart(el.getContext("2d"), {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: title,
            data,
            // IMPORTANT: visibilité des barres
            backgroundColor: "rgba(208,72,182,0.18)",
            borderColor: "#d048b6",
            borderWidth: 2,
            // rend les barres plus "nettes"
            borderSkipped: false,
            barPercentage: 0.75,
            categoryPercentage: 0.8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true } },
        scales: {
          x: { ticks: { autoSkip: true, maxTicksLimit: 8 } },
          y: { beginAtZero: true },
        },
      },
    });
  }

  // ---------- OpenWeather calls ----------
  async function geocodeCity(apiKey, cityName) {
    const url =
      "https://api.openweathermap.org/geo/1.0/direct?q=" +
      encodeURIComponent(cityName) +
      "&limit=1&appid=" +
      encodeURIComponent(apiKey);

    const r = await fetch(url);
    if (!r.ok) throw new Error("Geocoding failed: " + r.status);
    const arr = await r.json();
    if (!Array.isArray(arr) || arr.length === 0) throw new Error("Ville introuvable: " + cityName);
    return { lat: arr[0].lat, lon: arr[0].lon, name: arr[0].name };
  }

  async function fetchCurrent(apiKey, lat, lon) {
    const url =
      "https://api.openweathermap.org/data/2.5/air_pollution?lat=" +
      encodeURIComponent(lat) +
      "&lon=" +
      encodeURIComponent(lon) +
      "&appid=" +
      encodeURIComponent(apiKey);

    const r = await fetch(url);
    if (!r.ok) throw new Error("air_pollution current failed: " + r.status);
    const j = await r.json();
    const item = j?.list?.[0];
    if (!item) throw new Error("air_pollution current: no data");
    return {
      dt: item.dt,
      aqi: item.main?.aqi ?? null,
      pm25: item.components?.pm2_5 ?? null,
      pm10: item.components?.pm10 ?? null,
    };
  }

  async function fetchHistory(apiKey, lat, lon, hoursBack, stepHours) {
    const now = Math.floor(Date.now() / 1000);
    const start = now - hoursBack * 3600;

    const url =
      "https://api.openweathermap.org/data/2.5/air_pollution/history?lat=" +
      encodeURIComponent(lat) +
      "&lon=" +
      encodeURIComponent(lon) +
      "&start=" +
      encodeURIComponent(start) +
      "&end=" +
      encodeURIComponent(now) +
      "&appid=" +
      encodeURIComponent(apiKey);

    const r = await fetch(url);
    if (!r.ok) throw new Error("air_pollution history failed: " + r.status);
    const j = await r.json();
    const list = Array.isArray(j?.list) ? j.list : [];

    const stepSec = stepHours * 3600;
    let lastKept = 0;

    const points = [];
    for (const it of list) {
      const dt = it.dt;
      if (!dt) continue;
      if (points.length === 0 || dt - lastKept >= stepSec) {
        points.push({
          dt,
          aqi: it.main?.aqi ?? null,
          pm25: it.components?.pm2_5 ?? null,
          pm10: it.components?.pm10 ?? null,
        });
        lastKept = dt;
      }
    }
    return points;
  }

  // ---------- Table ----------
  function fillTable(rows) {
    const body = $("airTableBody");
    if (!body) return;

    body.innerHTML = rows
      .map((row) => {
        const badge = aqiBadgeClass(row.aqi);
        const status = aqiLabel(row.aqi);
        const dtText = row.dt ? fmtDate(row.dt) : "N/A";
        const aqi = row.aqi ?? "N/A";

        return `
          <tr>
            <td>${row.city}</td>
            <td>${aqi}</td>
            <td><span class="badge ${badge}">${status}</span></td>
            <td class="text-center">${dtText}</td>
          </tr>
        `;
      })
      .join("");
  }

  // ---------- Main ----------
  let chartRabat = null;
  let chartCasa = null;
  let chartMeknes = null;
  let chartNador = null;

  async function loadCityToChartPM25(apiKey, city, canvasId, type) {
    const geo = await geocodeCity(apiKey, city);
    const history = await fetchHistory(apiKey, geo.lat, geo.lon, 48, 3); // 48h, 1 point / 3h

    let points = history;
    if (!points || points.length === 0) {
      const cur = await fetchCurrent(apiKey, geo.lat, geo.lon);
      points = [cur];
    }

    const labels = points.map((p) => fmtDate(p.dt));
    const data = points.map((p) => (p.pm25 == null ? 0 : p.pm25));

    const title = `${city} - PM2.5 (µg/m³)`;

    if (type === "bar") return buildBarChart(canvasId, labels, data, title);
    return buildLineChart(canvasId, labels, data, title);
  }

  async function initDashboard() {
    const apiKey = mustGetApiKey();
    if (!apiKey) return;

    const CITIES = ["Rabat", "Casablanca", "Meknes", "Nador"];

    // Table current AQI (gardée)
    try {
      const rows = [];
      for (const city of CITIES) {
        const geo = await geocodeCity(apiKey, city);
        const cur = await fetchCurrent(apiKey, geo.lat, geo.lon);
        rows.push({ city, aqi: cur.aqi, dt: cur.dt });
      }
      fillTable(rows);
    } catch (e) {
      console.error("[charts-airquality] table error:", e);
    }

    // Destroy old charts (si demo.js avait déjà dessiné)
    safeDestroy(chartRabat);
    safeDestroy(chartCasa);
    safeDestroy(chartMeknes);
    safeDestroy(chartNador);

    // Charts : PM2.5 pour les 4 villes
    try {
      chartRabat = await loadCityToChartPM25(apiKey, "Rabat", "chartBig1", "line");
      chartCasa = await loadCityToChartPM25(apiKey, "Casablanca", "chartLinePurple", "line");

      // Meknes en bar (barres visibles + contour rose)
      chartMeknes = await loadCityToChartPM25(apiKey, "Meknes", "CountryChart", "bar");

      chartNador = await loadCityToChartPM25(apiKey, "Nador", "chartLineGreen", "line");
    } catch (e) {
      console.error("[charts-airquality] charts error:", e);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (typeof Chart === "undefined") {
      console.error("[charts-airquality] Chart.js introuvable. Vérifie chartjs.min.js");
      return;
    }
    initDashboard();
  });
})();
