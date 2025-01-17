<script lang="ts">
import { useSearchOptionsStore } from '@/stores/options';
import { ref } from 'vue';


export default {
    name: "RoutingModeSelector",
    props: ['mode'],
    setup(props) {
        const mode = props.mode
        const searchOptions = useSearchOptionsStore()
        const enabled = ref(true)
        function toggleMode() {
            enabled.value = !enabled.value
            searchOptions.toggleMode(mode)
        }
        // expose the ref to the template
        return {
            enabled,
            toggleMode
        }
    }
}
</script>
<template>
    <div class="modeSelector" @click="toggleMode">
        <img :class="String(enabled)" :src="`/src/assets/img/icons/station.${mode}.svg`">
    </div>

</template>
<style>
.modeSelector {
    margin: 2% 0;
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