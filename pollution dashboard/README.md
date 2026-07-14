# Pollution Dashboard

A real-time air quality dashboard built on top of the [Black Dashboard](https://www.creative-tim.com/product/black-dashboard) Bootstrap 4 admin template. It tracks air pollution (AQI, PM2.5, PM10) for a set of cities using the [OpenWeather Air Pollution API](https://openweathermap.org/api/air-pollution), and displays the data through charts, a live table, and an interactive Leaflet map.

## Features

- **Live AQI table** — current Air Quality Index for a default list of cities (Rabat, Casablanca, Meknes, Nador), with color-coded status badges (Bon / Correct / Modéré / Mauvais / Très mauvais).
- **PM2.5 history charts** — per-city line/bar charts (Chart.js) built from up to 48h of historical air pollution data, sampled every 3 hours.
- **Interactive map** — Leaflet map centered on Rabat; click anywhere to reverse-geocode the location and fetch its current AQI.
- **City search** — search any city by name, geocode it via OpenWeather, and add it to the table/map on the fly. Cities you search for are persisted in `localStorage`.
- Built on the full Black Dashboard component set (cards, tables, notifications, typography, RTL support, etc.).

## Project structure

```
pollution dashboard/
├── assets/
│   ├── css/                 # Compiled CSS (black-dashboard, bootstrap, icons)
│   ├── scss/                # SCSS sources
│   ├── js/
│   │   ├── config.example.js    # App config template (copy to config.js, gitignored)
│   │   ├── charts-airquality.js # Chart.js PM2.5 history charts + AQI table
│   │   ├── table-airquality.js  # Live AQI table backed by localStorage city list
│   │   ├── pollution-map.js     # Leaflet map, click-to-check AQI, "air:update" listener
│   │   ├── search.js            # City search box (geocoding + dispatches map/table updates)
│   │   ├── pollution.js         # Legacy/simple AQI table loader (superseded by table-airquality.js)
│   │   ├── core/                 # jQuery, Popper, Bootstrap
│   │   └── plugins/              # Chart.js, bootstrap-notify, perfect-scrollbar
│   ├── img/ and fonts/
│   └── demo/                 # Template demo helpers
├── examples/
│   ├── dashboard.html        # Main dashboard (table + charts)
│   └── map.html              # Full-page map view
├── docs/
│   └── documentation.html    # Black Dashboard component documentation
├── index.html                 # Redirects to examples/dashboard.html
├── gulpfile.js                 # SCSS build/watch tasks
├── genezio.yaml                 # Genezio static deployment config
├── package.json
├── CHANGELOG.md
└── LICENSE.md
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Add your OpenWeather API key

Copy the config template and fill in your own key — `config.js` is gitignored so your key is never committed:

```bash
cp assets/js/config.example.js assets/js/config.js
```

```js
window.APP_CONFIG = {
  OPENWEATHER_API_KEY: "YOUR_API_KEY_HERE",
  DEFAULT_COUNTRY: "MA",
  DEFAULT_CITY: "Rabat",
};
```

Get a free key at [openweathermap.org/api](https://openweathermap.org/api).

### 3. Run it

This is a static site — no build step is required to view it. Open `index.html` in a browser, or serve the folder with any static server, e.g.:

```bash
npx serve .
```

Then visit `examples/dashboard.html` for the main dashboard, or `examples/map.html` for the full-page map.

### 4. (Optional) Rebuild CSS from SCSS

If you edit files under `assets/scss/`, recompile with Gulp:

```bash
npx gulp compile-scss   # one-off build
npx gulp watch          # rebuild on change
npx gulp open-app       # opens the dashboard and watches for changes
```

## Deployment

The project includes a `genezio.yaml` for one-click static deployment to [Genezio](https://genezio.com/).

## Tech stack

- [Black Dashboard](https://www.creative-tim.com/product/black-dashboard) (Bootstrap 4 admin template) by Creative Tim
- [Chart.js](https://www.chartjs.org/) for charts
- [Leaflet](https://leafletjs.com/) for the interactive map
- [OpenWeather Air Pollution & Geocoding APIs](https://openweathermap.org/api) for air quality data
- Vanilla JavaScript for all pollution-specific logic (no framework/build step required)

## License

MIT — see [LICENSE.md](LICENSE.md). Base template © Creative Tim.
