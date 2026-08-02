<script setup lang="ts"></script>

<template>
  <div class="about">
    <h1>Méthodologie</h1>
    <p>
      Les données viennent de l'export GTFS national de la SNCF (jeu "HORAIRES SNCF"),
      qui fusionne TER, Intercités et TGV. Il n'existe pas de jeu GTFS ferroviaire
      découpé par région — seul le car/bus l'est.
    </p>
    <p>
      Le filtre appliqué aux lignes est cumulatif : rail strict (route_type == 2,
      donc pas de tram-train) et exclusion des dessertes sans nom commercial
      exploitable (39 routes marquées "INCONNU" dans la donnée source).
    </p>
    <p>
      Le tracé de chaque ligne est défini par son trip le plus complet — le passage
      qui dessert le plus de gares — plutôt que l'union de toutes les variantes.
    </p>
  </div>
</template>