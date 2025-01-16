<script lang="ts">
export default {
    name: "RoutingOptions"
}
</script>
<script setup lang="ts">
import RoutingModeSelector from './RoutingModeSelector.vue';
const modes = [
    "train",
    "bus",
    "subway",
    "ferry",
    "tram"
]

</script>
<template>
    <div class="modesContainer">
        <RoutingModeSelector v-for="mode in modes" :key="mode" :mode="mode">
        </RoutingModeSelector>
    </div>
</template>
<style>
.modesContainer {
    display: flex;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: row;
    grid-area: transitmodes;
    justify-content: space-around;
    align-content: center;
}
</style>