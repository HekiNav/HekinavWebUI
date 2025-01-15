<script lang="ts">
export default {
    name: "RoutingOptions"
}
</script>
<script setup lang="ts">
import { useSearchOptionsStore } from '@/stores/options';
import RoutingModeSelector from './RoutingModeSelector.vue';
const modes = [
    "train",
    "bus",
    "subway",
    "ferry",
    "tram"
]
const options = useSearchOptionsStore()

function doStuff() {
    options.increment()
    console.log(options.count)
}
</script>
<template>
    <div class="modesContainer">
        <RoutingModeSelector v-for="mode in modes" :key="mode" :mode="mode">
        </RoutingModeSelector>
    </div>
    <button @click="doStuff">fooa1</button>
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