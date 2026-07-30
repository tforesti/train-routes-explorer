# train-routes-explorer

Carte interactive des lignes de train françaises. Objectif : visualiser
le réseau ferroviaire voyageurs (lignes + gares) pour repérer des trajets
qu'un moteur de recherche porte-à-porte ne montre pas.

## Stack
- Back : Deno + TypeScript, Drizzle ORM, PostgreSQL
- Front : Vue.js (SPA), MapLibre GL pour la carte
- Style back : data-oriented (données/comportement séparés, fonctions
  pures, immutabilité, pas d'OOP à état)

## Source de données
- GTFS national SNCF (TER + Intercités + TGV), jeu "HORAIRES SNCF".
  Lien GTFS (toujours la dernière version) :
  https://eu.ftp.opendatasoft.com/sncf/plandata/Export_OpenData_SNCF_GTFS_NewTripId.zip
- Pas de GTFS ferroviaire régional : le ferroviaire n'est publié qu'en
  national. Le découpage régional n'existe que pour le car/bus.

## Modèle de données (cible)
Trois tables métier exposées par l'app :
- stations (id, name, lat, lon)
- routes (id, name, type)
- route_stations (route_id, station_id, sequence) — dérivée à l'ingestion

Quatre fichiers GTFS ingérés (routes, trips, stop_times, stops) servent
à reconstruire ces 3 tables. L'ingestion est une transformation pure
GTFS → modèle métier.

## Règles de conception
- L'ingestion ne porte AUCUNE logique de région. Elle transforme le GTFS
  national complet en 3 tables.
- Le filtrage géographique (par région) est prévu pour se faire à la lecture,
  côté API, mais n'est PAS implémenté dans le MVP : l'endpoint /api/routes
  renvoie tout le réseau (569 routes, ~6500 route_stations) sans filtre.
  Volumétrie mesurée trop faible pour justifier un filtre dès le départ
  (~500 Ko-1 Mo de JSON, chargeable en un coup). À ajouter plus tard si le
  besoin se confirme (comparer des zones, alléger le premier chargement).
- Séquence de gares d'une route : stratégie "trip le plus complet"
  (le trip ayant le plus d'arrêts définit le tracé de la ligne).
- Filtre routes, deux conditions cumulatives :
  - route_type == "2" (rail strict). Les route_type == "0" (tram-train,
    ex. Nantes-Châteaubriant) sont volontairement exclues — décision
    prise pour garder un filtre simple plutôt qu'une liste blanche cas
    par cas.
  - route_short_name != "INCONNU" (agency_id "OCEdefault" : dessertes
    fourre-tout sans nom commercial exploitable, 39 routes dont 19 déjà
    en route_type=2).
  - Vérifié sur le vrai fichier (2026-07) : 569 routes attendues après
    ce double filtre, 3538 gares mères (stations) attendues.
- Gares : dédupliquer via location_type / parent_station pour ne pas
  avoir un point par quai. Ne garder que location_type == "1" (gares
  mères) pour la table stations.
- Parsing CSV : ne jamais faire de split(',') naïf. routes.txt contient
  au moins une ligne réelle avec une virgule à l'intérieur d'un champ
  entre guillemets (route "E01", "Navettes Meuse TGV - Bar le Duc,
  Commercy et Verdun"). Utiliser un vrai parseur CSV (jsr:@std/csv).

## Infra
- PostgreSQL en local nativement (Homebrew, service déjà actif), pas de
  Docker. `DATABASE_URL` pointe sur `localhost:5432`. Créer la base une
  fois : `createdb train_routes_explorer`.

## Déploiement
- VPS OVH (Debian), géré par le repo séparé `tf89-infra` (Ansible).
  https://train-routes-explorer.tf89.fr, port local 8081.
- Docker Compose (postgres + app). Un seul port exposé : le serveur
  Deno sert /api/routes ET le front buildé (web/dist) sur le même port,
  pas de découpage côté reverse-proxy.
- Migrations et ingestion GTFS : étapes manuelles post-déploiement
  (deno task db:migrate, puis docker cp + deno task ingest), pas
  automatisées dans le compose.
- Pièges rencontrés :
  - Image postgres:18+ : volume à monter sur /var/lib/postgresql, pas
    /var/lib/postgresql/data (changement de convention depuis la v18).
  - Chemins relatifs non fiables dans le conteneur (working directory
    différent de WORKDIR selon l'entrypoint de l'image denoland/deno) :
    toujours dériver les chemins de fichiers via import.meta.url, pas
    de chemin relatif nu.
  - maplibre-gl charge dynamiquement 2 fichiers (worker + shared) que
    Vite ne détecte pas au build ; copiés manuellement en prebuild
    (voir app/web/package.json).

## Commandes
Toutes les commandes back/front s'exécutent depuis `app/` (racine du code,
`deno.json` y vit) :
- `cd app && deno task ingest -- --dir=../data/Export_OpenData_SNCF_GTFS_NewTripId`
  : peuple la base
- `cd app && deno task dev` : lance l'API (Deno.serve, port 8000)
- `cd app && deno task test` : tests unitaires (pipeline d'ingestion sur fixture)
- `cd app && deno task db:generate` / `db:migrate` : migrations Drizzle
- Front : `cd app/web && npm run dev` (port 5173, proxy /api vers :8000)
