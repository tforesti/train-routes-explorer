# Conception — train-routes-explorer

Ce document capture les décisions de conception et leur justification.
Il n'est pas lu automatiquement par Claude Code : le pointer explicitement
si besoin. Sert de mémoire du raisonnement.

## Objectif

Visualiser le réseau ferroviaire voyageurs français (lignes + gares) sur
une carte, pour repérer des trajets qu'un moteur porte-à-porte (SNCF
Connect, Trainline) ne met pas en évidence. Cas d'usage : coins mal
desservis, où l'on est entre plusieurs lignes sans voir le meilleur
enchaînement.

Le MVP est une visualisation, pas un calculateur d'itinéraire. Afficher
les lignes et leurs gares suffit à répondre au besoin initial. Le calcul
d'itinéraire multimodal (RAPTOR, CSA) est hors périmètre — à envisager
plus tard seulement.

## Source de données

GTFS national SNCF, jeu "HORAIRES SNCF" (TER + Intercités + TGV fusionnés
en un seul jeu depuis été 2025 ; les anciens jeux sectoriels sont
décommissionnés).

Lien GTFS (pointe toujours vers la dernière version) :
https://eu.ftp.opendatasoft.com/sncf/plandata/Export_OpenData_SNCF_GTFS_NewTripId.zip

### Pourquoi le national et pas un jeu régional

Vérifié : il n'existe pas de GTFS ferroviaire découpé par région. Le TER
est organisé par les Régions mais opéré et publié par SNCF de façon
centralisée. Au niveau régional (transport.data.gouv.fr), on ne trouve
que du car/bus (ex. agrégat Oùra pour Auvergne-Rhône-Alpes). SNCF elle-même
signale que l'assemblage des sous-périmètres régionaux ferroviaires est
difficile et que la maintenance du jeu national n'est pas garantie à moyen
terme (ouverture à la concurrence). Le national est donc le seul point
d'accès réaliste au ferroviaire voyageurs.

### GTFS plutôt que NeTEx

GTFS suffit pour le besoin et son écosystème d'outils est plus fourni.
NeTEx (norme européenne) est plus riche mais nettement plus lourd à parser
(XML verbeux, modèle complexe).

## Modèle de données

### Le problème GTFS : route → gares n'est pas direct

Le GTFS ne relie pas les routes aux gares directement. La chaîne est :

    routes → trips → stop_times → stops

- routes : la ligne commerciale (route_id, short_name, long_name, route_type)
- trips : un passage concret sur la route (des centaines par route :
  chaque horaire, chaque sens, chaque jour)
- stop_times : la séquence ordonnée d'arrêts d'un trip (via stop_sequence)
- stops : les gares, avec coordonnées

### Conséquence : pas de séquence canonique de gares

Tous les trips d'une route ne desservent pas les mêmes gares (un omnibus
dessert 15 gares, un direct 4). Il n'existe pas UNE séquence de gares pour
une route : c'est une simplification à construire.

Décision : stratégie "trip le plus complet". Pour chaque route, le trip
ayant le plus d'arrêts définit le tracé de la ligne. Simple, lisible, une
ligne par route sur la carte. Alternative écartée pour le MVP : l'union
de tous les segments (plus fidèle aux variantes, mais transforme la carte
en réseau complexe et alourdit le traitement). Raffinement possible plus
tard.

### Tables métier (exposées par l'app)

    stations        (id, name, lat, lon)
    routes          (id, name, type)
    route_stations  (route_id, station_id, sequence)   ← dérivée à l'ingestion

Trois tables exposées, quatre fichiers ingérés. Le cœur de la logique est
la fonction qui transforme les 4 en 3.

Séparation nette entre donnée brute (le GTFS, imposé par la source) et
donnée métier (routes + stations ordonnées). L'ingestion est une
transformation pure de l'une vers l'autre. Le lien route→stations ordonnées
est calculé UNE fois à l'ingestion, pas recalculé à chaque requête.

## Périmètre géographique : filtrage à la lecture

Trois options ont été examinées :

1. Bounding box à l'ingestion : filtrer les gares sur un rectangle de
   coordonnées avant insertion. Base = une seule région.
2. Jeu régional dédié : écarté, n'existe pas pour le ferroviaire (voir plus
   haut).
3. Ingestion complète + filtrage à la lecture : insérer tout le national,
   filtrer côté API.

Décision : option 3.

### Justification

- Sépare proprement deux responsabilités : l'ingestion transforme le GTFS
  en modèle métier (sans notion de région) ; l'API applique la logique de
  présentation (quelle zone montrer).
- Flexibilité de périmètre sans réingérer : changer de région, élargir,
  comparer deux zones = un paramètre de requête.
- Coût accepté : ingestion plus lourde (tout le national en base), volume
  plus gros. Non bloquant pour un POC en Postgres local.

### Critère de filtrage (côté API)

Une route est retournée si au moins une de ses gares est dans la zone.

Conséquence connue : ce critère ramène les lignes qui partent de la zone
ou la traversent, y compris des TGV filant vers Paris (une route Lyon–Paris
apparaît car Lyon est dans la zone, avec toutes ses gares jusqu'à Paris).
Peut être souhaité (voir les échappées depuis chez soi) ou non. Affinements
possibles plus tard : exiger au moins 2 gares dans la zone, ou la majorité.

### Zone : rectangle vs polygone

- v1 : bounding box à la requête (comparaison lat/lon dans le WHERE).
  PostGIS pas nécessaire pour un rectangle.
- évolution : vrai polygone de région (GeoJSON des contours administratifs)
  avec test d'appartenance exact (PostGIS ST_Contains). Plus précis,
  occasion de toucher au spatial. Ne pas complexifier trop tôt.

### MVP : pas de filtrage du tout

Décision (2026-07-29) : le MVP n'implémente aucun filtrage géographique.
Les volumes réels mesurés (3538 stations, 569 routes, 6513 route_stations)
tiennent largement dans une seule réponse JSON — pas de bénéfice de
performance à filtrer dès maintenant. Le principe "filtrage à la lecture"
ci-dessus reste la direction pour une évolution future (bbox ou polygone
région), mais on ne code pas pour un besoin hypothétique.

## Algorithme d'ingestion

Pipeline en 5 étapes : 4 fichiers bruts → 3 tables métier.

    1. Parse       lire les 4 CSV → structures en mémoire
    2. Stations    stops.txt → table stations
    3. Séquences   pour chaque route, choisir le trip représentatif
                   et en extraire la séquence ordonnée de gares
    4. Routes      routes.txt → table routes (filtré ferroviaire)
    5. Jonction    écrire route_stations à partir des séquences

### Étape 1 — Parse

stop_times.txt est le plus gros fichier (produit trips × arrêts). Mesuré
sur le vrai fichier (2026-07) : 415 143 lignes — pas "plusieurs millions"
comme on le supposait avant d'avoir le fichier réel. Largement tenable en
mémoire sur un poste de dev ; le chargement en mémoire (cf. arbitrage
plus bas) n'a pas besoin de streaming pour ce volume.

#### Piège CSV

routes.txt contient au moins une ligne réelle avec une virgule à
l'intérieur d'un champ entre guillemets : la route "E01" a pour
route_long_name `"Navettes Meuse TGV - Bar le Duc, Commercy et Verdun"`.
Un split(',') naïf désaligne les colonnes sur cette ligne (la virgule
interne est comptée comme séparateur). Le parseur doit respecter les
guillemets — utiliser une lib CSV correcte (jsr:@std/csv côté Deno), pas
un split maison.

### Étape 2 — Stations

Mapping quasi direct. Subtilité : stops.txt mélange deux niveaux via
location_type (gares mères vs quais/points d'arrêt enfants, reliés par
parent_station). Pour la carte, ne garder que les gares mères, sinon
plusieurs points superposés par gare.

Vérifié sur le vrai fichier (2026-07) : 8904 stops au total, 5365 en
location_type=0 (enfants) et 3538 en location_type=1 (gares mères, donc
3538 stations attendues). Tous les enfants ont un parent_station renseigné
(0 orphelin) et tout stop_id référencé dans stop_times.txt existe dans
stops.txt — le resolver stop→station n'a pas de cas limite réel à gérer
(garder un throw fail-fast défensif en cas d'évolution future du GTFS,
mais pas de fallback silencieux nécessaire).

### Étape 3 — Séquences (cœur)

- Grouper les trips par route (trips.txt : trip_id → route_id).
- Pour chaque trip, récupérer sa séquence d'arrêts (stop_times trié par
  stop_sequence).
- Pour chaque route, choisir le trip avec le plus d'arrêts (représentatif).
- Résoudre chaque stop_id en station_id.

Perf : construire une Map trip_id → [stop_times triés] en une passe = algo
en O(n). Transformation pure stopTimes → Map<tripId, orderedStops>, sans
état, testable en isolation. Cœur data-oriented du projet.

### Étape 4 — Routes

routes.txt → routes, filtré sur route_type ferroviaire (2 = rail dans la
spec GTFS). Garantit d'écarter d'éventuelles lignes de substitution
routière (cars TER remplaçant un train).

Second filtre nécessaire, trouvé en vérifiant le vrai fichier : 39 routes
ont agency_id="OCEdefault" et route_short_name="INCONNU" (route_long_name
"-") — des dessertes fourre-tout sans nom commercial exploitable, dont 19
sont déjà en route_type=2 (donc pas éliminées par le seul filtre rail).
Décision : exclure route_short_name == "INCONNU" en plus du filtre
route_type.

Cas limite tranché : 4 routes sont en route_type=0 (tram-train), dont
Nantes-Châteaubriant qui correspondrait bien au cas d'usage du projet
(connexion peu visible sur un moteur porte-à-porte). Décision : les
exclure, comme le reste du non-rail strict — garder un filtre simple
(route_type == "2") plutôt qu'une liste blanche cas par cas. Raffinement
possible plus tard si le besoin se confirme.

Après double filtre (route_type=2 ET route_short_name != INCONNU) : 569
routes attendues (mesuré sur le fichier 2026-07 : 588 en route_type=2,
moins 19 INCONNU parmi elles).

### Étape 5 — Jonction

Écrire route_stations (route_id, station_id, sequence). Le sequence stocké
est une renumérotation propre (0, 1, 2…), pas le stop_sequence GTFS d'origine
(qui peut avoir des trous).

### Ordre de dépendance (insertion en base)

    stations        (indépendante)
    routes          (indépendante)
    route_stations  (dépend des deux : insérée en dernier)

## Arbitrage : transformation en mémoire vs SQL

Deux philosophies pour le pipeline :

- En mémoire puis insertion : charger, transformer en RAM, écrire les 3
  tables à la fin. Simple, purement fonctionnel. Contrainte : tenir les
  gros fichiers en mémoire (streamer stop_times au besoin).
- Données brutes en base puis transformation SQL : insérer les 4 fichiers
  en tables brutes, construire les 3 tables métier via requêtes (jointures,
  DISTINCT ON, window functions). Robuste sur la volumétrie, mais moins
  "data-oriented pur".

Décision pour le POC : transformation en mémoire. Sert mieux le propos
(transformation de données propre, en TS, style data-oriented) et constitue
un meilleur terrain d'entraînement. La voie SQL serait préférable pour un
vrai système de prod avec ré-ingestion régulière. Arbitrage défendable des
deux côtés — assumé en fonction de l'objectif.

## Points validés sur le vrai fichier GTFS (export 2026-07)

- location_type et parent_station dans stops.txt : confirmé, 0 orphelin.
  Dédup simple par location_type=1 → 3538 stations (cf. Étape 2).
- route_type réellement présents : 588 en "2" (rail), 109 en "3" (bus,
  substitution routière), 4 en "0" (tram-train, exclus), 1 en "3" mal
  détecté au premier passage (route "E01", cf. Piège CSV — pas un vrai
  route_type vide, artefact de parsing naïf).
- Filtre INCONNU nécessaire en plus du route_type (cf. Étape 4) : 569
  routes attendues au final.
- Volumétrie exacte de stop_times.txt : 415 143 lignes — chargement en
  mémoire confortable, pas de streaming nécessaire (cf. Étape 1 et
  arbitrage mémoire vs SQL ci-dessous, qui reste valide).
- Max de stop_times par trip : 34 — confirme que "le trip le plus
  complet" est une notion bornée et bon marché à calculer.
