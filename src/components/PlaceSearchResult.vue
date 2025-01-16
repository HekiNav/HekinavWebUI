<script setup lang="ts">
import { SearchLayer, type Place } from '@/types/Place';
import { defineProps, defineEmits } from "vue"
const props = defineProps(["place"])
const place: Place = props.place
console.log(place.layer, SearchLayer.address)
const emitters = defineEmits(["click"])
</script>
<script lang="ts">
export default {
    name: "RoutingPage",
}
</script>
<template>
    <div v-if="place.layer == SearchLayer.address" @click="emitters('click')" class="row spread"><span>{{ place.street
            }} {{
                place.housenumber }} </span><span class="moreinfo">{{ place.locality ? place.locality + ", " :
                place.localAdmin ? place.localAdmin
                    + ", " : "" }}{{
                place.region }}</span></div>
    <div v-if="place.layer == SearchLayer.street" @click="emitters('click')" class="row spread"><span>{{ place.name
            }} </span><span class="moreinfo">{{ place.neighbourhood ? place.neighbourhood + ", " : "" }}{{
                place.locality ?
                    place.locality + ", " :
                    place.localAdmin ? place.localAdmin
                        + ", " : "" }}{{
                place.region }}</span></div>
    <div v-if="place.layer == SearchLayer.venue" @click="emitters('click')" class="row spread"><span>{{ place.name
            }} </span><span class="moreinfo">{{ place.street ? place.street + " " + place.housenumber + ", " : "" }}{{
                place.neighbourhood ?
                    place.neighbourhood + ", " : "" }}{{
                place.locality ?
                    place.locality + "," :
                    place.localAdmin ? place.localAdmin
                        + "," : "" }}{{
                place.region }}</span></div>
    <div v-if="place.layer == SearchLayer.neighbourhood" @click="emitters('click')" class="row spread"><span>{{
        place.name
            }} </span><span class="moreinfo">{{
                place.locality ?
                    place.locality + ", " :
                    place.localAdmin ? place.localAdmin
                        + ", " : "" }}{{
                place.region }}</span></div>
</template>
<style>
.row {
    padding: 0 1%;
}

.spread {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: end;
    background-color: transparent;
}

.moreinfo {
    font-size: 70%;
    color: var(--c-primary)
}
</style>