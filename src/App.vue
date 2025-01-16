<script setup lang="ts">
import { RouterView } from 'vue-router';
import NavBar from './components/NavBar.vue'
import "./assets/root.css"
</script>

<template>

  <div class="wrapper">
    <NavBar></NavBar>
    <!-- Pages go here -->
    <RouterView />
  </div>
</template>

<style>
#app {
  padding: 0;
  margin: 0;
  width: 100vw;
  height: 100vh;
}

.wrapper {
  display: flex;
  flex-direction: column;
}
</style>
