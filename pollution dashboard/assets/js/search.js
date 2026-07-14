// assets/js/search.js
(function () {
  "use strict";

  const cfg = window.APP_CONFIG || {};
  const KEY = cfg.OPENWEATHER_API_KEY || cfg.OPENWEATHER_KEY || cfg.OPENWEATHER_APIKEY;

  const STORAGE_KEY = "AQ_CITIES_V1";

  function normCityName(s) {
    return String(s || "").trim().replace(/\s+/g, " ");
  }
  function cityKey(name) {
    return normCityName(name).toLowerCase();
  }

  function loadCities() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  function saveCities(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
  function upsertCity(list, cityObj) {
    const k = cityKey(cityObj.name);
    const idx = list.findIndex((c) => cityKey(c.name) === k);
    if (idx >= 0) list[idx] = { ...list[idx], ...cityObj };
    else list.push(cityObj);
    return list;
  }

  async function geocodeCity(cityName) {
    // IMPORTANT: on met ",MA" pour Maroc + on n'impose pas MA uniquement (sinon parfois Agadir bug)
    const url =
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${encodeURIComponent(KEY)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Geocoding HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error("Ville introuvable");
    const x = data[0];
    return { name: x.name || cityName, lat: x.lat, lon: x.lon, country: x.country || "" };
  }

  async function fetchAQI(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${encodeURIComponent(KEY)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`AQI HTTP ${res.status}`);
    const data = await res.json();
    return data?.list?.[0]?.main?.aqi ?? null;
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

  function showMsg(msg, kind) {
    const el = document.getElementById("citySearchMsg");
    if (!el) return;
    el.className = kind === "ok" ? "text-success mt-2" : "text-danger mt-2";
    el.textContent = msg;
  }

  function closeModalSafely() {
    // évite overlay bloquant
    if (!window.jQuery) return;
    const $ = window.jQuery;
    $("#searchModal").modal("hide");
    $("body").removeClass("modal-open");
    $(".modal-backdrop").remove();
  }

  async function handleSearch() {
    const input = document.getElementById("citySearchInput");
    if (!input) return;

    const cityName = normCityName(input.value);
    if (!cityName) {
      showMsg("Tape le nom d'une ville.", "err");
      return;
    }
    if (!KEY) {
      showMsg("Clé OpenWeather manquante (config.js).", "err");
      return;
    }

    try {
      showMsg("Recherche...", "ok");

      const geo = await geocodeCity(cityName);
      const aqi = await fetchAQI(geo.lat, geo.lon);

      // Save en localStorage pour le tableau
      const list = loadCities();
      upsertCity(list, { name: geo.name, lat: geo.lat, lon: geo.lon });
      saveCities(list);

      // Event pour la map (pollution-map.js écoute ça)
      window.dispatchEvent(new CustomEvent("air:update", {
        detail: {
          city: geo.name,
          lat: geo.lat,
          lon: geo.lon,
          aqi: aqi,
          label: aqiLabel(aqi)
        }
      }));

      // Demander au tableau de se rafraîchir si présent
      window.dispatchEvent(new CustomEvent("table:refresh"));

      showMsg(`OK: ${geo.name} (AQI: ${aqi ?? "N/A"})`, "ok");
      input.value = "";

      closeModalSafely();
    } catch (e) {
      console.error("[search] error:", e);
      showMsg("Ville introuvable ou erreur API.", "err");
      // en cas d'erreur, on ne ferme pas forcément
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("citySearchBtn");
    const input = document.getElementById("citySearchInput");

    if (btn) btn.addEventListener("click", (e) => { e.preventDefault(); handleSearch(); });
    if (input) input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); handleSearch(); }
    });

    // sécurité: si modal se ferme mal, on nettoie au hide
    if (window.jQuery) {
      window.jQuery("#searchModal").on("hidden.bs.modal", function () {
        closeModalSafely();
      });
    }
  });
})();
