<script lang="ts">
import { ref } from 'vue';


export default {
    name: "RoutingModeSelector",
    props: ['mode'],
    setup() {
        const enabled = ref(true)

        // expose the ref to the template
        return {
            enabled
        }
    }
}
</script>
<template>
    <div class="modeSelector" @click="enabled = !enabled">
        <img v-if="mode == 'subway'" :class="String(enabled)" src="../assets/img/icons/station.subway.svg">
        <img v-if="mode == 'bus'" :class="String(enabled)" src="../assets/img/icons/station.bus.svg">
        <img v-if="mode == 'ferry'" :class="String(enabled)" src="../assets/img/icons/station.ferry.svg">
        <img v-if="mode == 'train'" :class="String(enabled)" src="../assets/img/icons/station.train.svg">
        <img v-if="mode == 'tram'" :class="String(enabled)" src="../assets/img/icons/station.tram.svg">
    </div>

</template>
<style>
.modeSelector {
    display: flex;
    height: 3rem;
    width: 3rem;
    background-color: var(--c-white);
    color: var(--c-text);
    padding: 0.2rem;
    border-radius: 0.5rem;
}

img {
    transition: 300ms;
}

.false {
    filter: grayscale(1);
}
</style>