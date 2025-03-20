<script lang="ts">
export default {
    name: "RoutingItineraryList",
}
</script>
<script setup lang="ts">
import { useRoutingGlobalStore } from '@/stores/routingGlobal';
import { ref } from 'vue';
const routingGlobal = useRoutingGlobalStore()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const routes: any = ref(routingGlobal.itieneraries)
console.log(routes.value.data.planConnection.edges[0].node.end + "UNTO")

for(let i = 0; i < routes.value.data.planConnection.edges.length; i++){
  const route = routes.value.data.planConnection.edges[i]
}

/*function routeToElement(route) {

}*/
</script>

<template>
    <div class="container">
        <h1 class="header">Routes</h1>
        <p>{{ routes }}</p>
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

p {
    line-break: anywhere;
    overflow: scroll;
    height: 100%;
    max-width: 100%;
}
</style>
