<script setup lang="ts"></script>

<template>
  <nav>
    <RouterLink to="/">Map</RouterLink>
    |
    <RouterLink to="/about">About</RouterLink>
  </nav>
  <main>
    <RouterView />
  </main>
</template>
