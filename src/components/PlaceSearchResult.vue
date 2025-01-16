<script setup lang="ts">
import type { Place } from '@/types/Place';
import { defineProps, defineEmits } from "vue"
const props = defineProps(["place"])
const place: Place = props.place
const emitters = defineEmits(["click"])
</script>
<script lang="ts">
export default {
    name: "RoutingPage",
}
</script>
<template>
    <div @click="emitters('click')" class="row">{{ place.name }}</div>
</template>