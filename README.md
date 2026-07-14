# Système de Surveillance Active de la Pollution de l'Air avec Alerte Intelligente par Email

**Projet de Fin de Semestre** — Master *Informatique, Gouvernance et Transformation Digitale*, Département Informatique, Faculté des Sciences de Rabat, Université Mohammed V (année universitaire 2025-2026).

Réalisé par **Nirmine Hiani** et **Hajar Chahbi**, encadré par **Mme Sara Diouani**.

## Contexte et problématique

Avec l'évolution du cloud computing et la généralisation des applications web, la gestion de données environnementales en temps réel est devenue un enjeu clé, notamment pour la pollution atmosphérique, qui impacte directement la santé publique dans les grandes villes. Les données de qualité de l'air existent (via des API météo/environnementales) mais restent souvent dispersées, peu exploitées et difficiles d'accès pour les utilisateurs finaux.

**Problématique du projet :** comment concevoir une application cloud permettant de collecter, stocker, analyser et visualiser les données de pollution à partir d'API externes, de manière simple, fiable et accessible ?

**Objectifs :**
- collecter les données de pollution à partir d'une API météo (OpenWeather) ;
- centraliser les données dans une base cloud sécurisée ;
- exploiter des services cloud pour le traitement et la gestion des données ;
- développer une interface permettant de visualiser les niveaux de pollution par ville ;
- mettre en place une architecture simple, *scalable* et réutilisable ;
- mettre en pratique les notions de cloud computing (PaaS, BaaS, serverless).

## Deux applications complémentaires

Le projet a été réalisé en deux itérations, chacune explorant une plateforme cloud différente :

| | [`pollution dashboard/`](pollution%20dashboard/README.md) | [`pollution predictor/`](pollution%20predictor/) |
|---|---|---|
| **Rôle** | Version 1 — tableau de bord de visualisation | Version 2 — évolution avec backend complet et alertes |
| **Hébergement** | Microsoft Azure (Storage Account, hébergement statique) | Frontend statique + Supabase (backend) |
| **Persistance des données** | `localStorage` du navigateur uniquement | Base PostgreSQL Supabase (persistante) |
| **Alertes** | Aucune | Alertes email automatiques via EmailJS/Gmail |
| **Authentification / utilisateurs** | Aucune | Inscription, contact, désinscription |

### 1. Pollution Dashboard — visualisation sur Microsoft Azure

Tableau de bord type back-office, construit sur le template [Black Dashboard](https://www.creative-tim.com/product/black-dashboard) (Bootstrap 4), 100 % statique côté client (HTML/CSS/JavaScript, sans backend).

**Fonctionnalités :**
- **Tableau de suivi** — ville, AQI, statut (Bon/Correct/Modéré/Mauvais/Très mauvais), heure de dernière mise à jour, pour Rabat, Casablanca, Meknès et Nador.
- **Graphiques d'évolution** (Chart.js) — historique PM2.5 par ville sur 48h (1 point / 3h).
- **Carte interactive** (Leaflet + OpenStreetMap) — clic n'importe où pour géolocaliser et afficher l'AQI du point.
- **Recherche de ville** — ajoute dynamiquement une ville au tableau et à la carte, persistée en `localStorage`.

**Déploiement (décrit dans le rapport) :** hébergé en tant que site web statique sur **Azure Storage Account** (conteneur `$web`, option *Static Website* activée), accessible publiquement sans gestion de serveur ni base de données — approche **PaaS**. Le dépôt contient aussi un `genezio.yaml` permettant un déploiement alternatif en un clic sur [Genezio](https://genezio.com/).

**Limite identifiée :** les données sont stockées uniquement côté client (`localStorage`), donc perdues au rafraîchissement/changement d'appareil, et l'application ne gère ni utilisateurs ni alertes automatiques — d'où la conception de la seconde application.

Voir le [README dédié](pollution%20dashboard/README.md) pour l'installation, la configuration et la structure des fichiers.

### 2. Pollution Predictor — backend Supabase + alertes email

Évolution du premier prototype, pensée pour combler ses limites : un vrai backend, une base de données persistante et des alertes automatiques. Application front-end légère (sans framework, sans build), organisée en trois interfaces :

- **`home.html` — Dashboard** : recherche d'une ville ou double-clic sur la carte Leaflet → récupération AQI/PM2.5/PM10 via l'API OpenWeather, affichage sur la carte, et historique (AQI + PM2.5) sous forme de graphique Chart.js alimenté par les données stockées dans Supabase.
- **`index.html` — Inscription aux alertes** : formulaire (nom, email, ville au Maroc) pour s'abonner aux alertes de pollution.
- **`contact.html` — Contact / Désinscription** : envoi d'un message à l'administration, ou désabonnement des alertes.

**Backend (Supabase) :**
- Base de données **PostgreSQL** avec tables `pollution` (historique AQI/PM2.5/PM10 par ville), `users` (abonnés aux alertes) et `contact` (messages et désinscriptions).
- **Edge Functions** serverless : `collect-pollution` (récupère et stocke les données de pollution), `signup` (inscription aux alertes), `quick-api` (contact/désinscription) — invoquées depuis le frontend via `fetch` avec la clé publique Supabase.
- API REST générée automatiquement (**PostgREST**) et authentification/JWT (**GoTrue**) fournies nativement par Supabase.

**Système d'alertes email :** lorsqu'un seuil de pollution est dépassé pour une ville suivie, un email est envoyé automatiquement via **EmailJS** (connecté à un compte Gmail), avec un template personnalisé indiquant la ville, l'indice AQI détecté et des recommandations (porter un masque, éviter les sorties prolongées, protéger les personnes fragiles). Cette approche évite de mettre en place un serveur de messagerie dédié.

## Structure du dépôt

```
Cloud/
├── pollution dashboard/       # V1 — dashboard Bootstrap déployé sur Azure Storage
│   ├── assets/js/                 # config.example.js, charts-airquality.js, pollution-map.js, search.js...
│   ├── examples/                  # dashboard.html, map.html
│   └── README.md
├── pollution predictor/       # V2 — dashboard + alertes, backend Supabase
│   ├── frontend/                  # home.html, index.html, contact.html + css/js
│   └── components/loader.html
├── Cloud.pdf                                                              # Rapport complet du projet
└── Système de Surveillance Active...Emai.pptx (2).pdf                     # Support de présentation
```

## Documentation du projet

- **`Cloud.pdf`** — rapport de projet complet (contexte, choix technologiques, déploiement Azure pas à pas, architecture Supabase, fonctionnement détaillé des deux applications, conclusion).
- **`Système de Surveillance Active de la Pollution de l'Air avec Alerte Intelligente par Emai.pptx (2).pdf`** — support de présentation orale.

## Stack technique

| Composant | Technologies |
|---|---|
| Frontend (dashboard) | HTML/CSS/JS, Bootstrap 4, Chart.js, Leaflet |
| Frontend (predictor) | HTML/CSS/JS vanilla, Chart.js, Leaflet |
| Données de pollution | [OpenWeather Air Pollution & Geocoding API](https://openweathermap.org/api/air-pollution) |
| Backend / base de données | [Supabase](https://supabase.com/) (PostgreSQL, PostgREST, Edge Functions, GoTrue) |
| Alertes email | [EmailJS](https://www.emailjs.com/) via Gmail |
| Hébergement | Microsoft Azure (Storage Account — Static Website), Genezio |

## Conclusion (synthèse du rapport)

Ce projet a permis de concevoir et déployer une solution complète de surveillance et d'analyse de la qualité de l'air, reposant sur deux applications complémentaires. La première illustre l'usage du cloud computing en mode PaaS pour une consultation simple et peu coûteuse des données de pollution. La seconde, *Pollution Predictor*, enrichit cette approche avec un backend Supabase, la gestion des utilisateurs et l'automatisation des alertes par email, démontrant une architecture cloud moderne, sécurisée et évolutive. Des pistes d'évolution sont évoquées : intégration de modèles prédictifs (machine learning), automatisation plus poussée des alertes, exploitation de données environnementales plus fines.

## Licence

`pollution dashboard/` est basé sur le template Black Dashboard, sous licence MIT — voir [LICENSE.md](pollution%20dashboard/LICENSE.md).
