<script lang="ts">


export default {
  name: "RoutingLoading",
}
</script>
<script setup lang="ts">
</script>

<template>
  <div class="container">
    <h1 class="header">Loading routes</h1>
  </div>
</template>

<style scoped>
.container {
  width: 100%;
  overflow-y: hidden;
  background-color: var(--c-secondary);
  display: flex;
  flex-direction: column;
}

.header {
  color: var(--c-white);
  grid-area: header;
  display: flex;
  flex-direction: row;
  align-items: start;
  justify-content: center;
}

h1 {
  color: var(--c-white);
  font-family: var(--f-header-2);
  font-size: var(--fs-h3);
}
</style>
