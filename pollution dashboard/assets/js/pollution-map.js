// assets/js/pollution-map.js
(function () {
  "use strict";

  let map = null;
  let marker = null;

  function getApiKey() {
    const cfg = window.APP_CONFIG || {};
    return cfg.OPENWEATHER_API_KEY || cfg.OPENWEATHER_KEY || cfg.OPENWEATHER_APIKEY || null;
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

  function ensureMap(lat = 34.020882, lon = -6.84165) {
    const el = document.getElementById("map");
    if (!el) return null;

    if (!map) {
      map = L.map("map").setView([lat, lon], 11);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      // ✅ CLICK SUR MAP → ville + AQI
      map.on("click", async (ev) => {
        const key = getApiKey();
        if (!key) {
          alert("Clé OpenWeather manquante dans config.js (APP_CONFIG).");
          return;
        }

        const clickedLat = ev.latlng.lat;
        const clickedLon = ev.latlng.lng;

        try {
          const [cityName, aqi] = await Promise.all([
            reverseGeocodeCity(key, clickedLat, clickedLon),
            fetchAQI(key, clickedLat, clickedLon),
          ]);

          updateMarker({
            lat: clickedLat,
            lon: clickedLon,
            city: cityName || "Position",
            aqi: aqi,
            label: aqiLabel(aqi),
          });
        } catch (e) {
          console.error("[map click] error:", e);
          updateMarker({
            lat: clickedLat,
            lon: clickedLon,
            city: "Position",
            aqi: null,
            label: "N/A",
          });
        }
      });
    } else {
      map.setView([lat, lon], 11);
    }

    return map;
  }

  async function reverseGeocodeCity(apiKey, lat, lon) {
    // Reverse geocoding OpenWeather
    const url =
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&limit=1&appid=${encodeURIComponent(apiKey)}`;

    const r = await fetch(url);
    if (!r.ok) throw new Error("reverse geocoding HTTP " + r.status);
    const arr = await r.json();
    return arr?.[0]?.name || null;
  }

  async function fetchAQI(apiKey, lat, lon) {
    const url =
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${encodeURIComponent(apiKey)}`;

    const r = await fetch(url);
    if (!r.ok) throw new Error("AQI HTTP " + r.status);
    const j = await r.json();
    return j?.list?.[0]?.main?.aqi ?? null;
  }

  function updateMarker(detail) {
    if (!detail) return;
    const { lat, lon, city, aqi, label } = detail;

    ensureMap(lat, lon);

    if (!marker) marker = L.marker([lat, lon]).addTo(map);
    marker.setLatLng([lat, lon]);

    const aqiTxt = aqi == null ? "?" : aqi;
    const labTxt = label || aqiLabel(aqi);

    marker.bindPopup(`<b>${city}</b><br/>AQI: ${aqiTxt} (${labTxt})`).openPopup();
    map.setView([lat, lon], 11);
  }

  // ✅ Quand une autre partie envoie air:update (search.js par ex.)
  window.addEventListener("air:update", async (e) => {
    const d = e.detail;
    if (!d || d.lat == null || d.lon == null) return;

    const key = getApiKey();
    if (!key) {
      console.error("[air:update] Clé OpenWeather introuvable");
      return;
    }

    try {
      // Si d.city manque -> on le récupère
      const cityName = d.city ? d.city : await reverseGeocodeCity(key, d.lat, d.lon);

      updateMarker({
        lat: d.lat,
        lon: d.lon,
        city: cityName || "Position",
        aqi: d.aqi ?? null,
        label: d.label || aqiLabel(d.aqi),
      });
    } catch (err) {
      console.error("[air:update] reverse error:", err);
      updateMarker({
        lat: d.lat,
        lon: d.lon,
        city: d.city || "Position",
        aqi: d.aqi ?? null,
        label: d.label || aqiLabel(d.aqi),
      });
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("map")) ensureMap();
  });

  // expose
  window.initPollutionMap = ensureMap;
})();
