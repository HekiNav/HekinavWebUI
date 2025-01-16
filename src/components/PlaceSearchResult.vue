<script setup lang="ts">
import { SearchLayer, TransitMode, type Place } from '@/types/Place';
import { defineProps, defineEmits } from "vue"
const props = defineProps(["place"])
const place: Place = props.place
const emitters = defineEmits(["click"])

function getImg(mode: TransitMode) {
    return `/src/assets/img/icons/station.${TransitMode[mode.toString()]}.svg`
}
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
    <div v-if="place.layer == SearchLayer.stop || place.layer == SearchLayer.station" @click="emitters('click')"
        class="row spread"><span><img v-for="mode in place.transitModes" :key="mode" :src="getImg(mode)" alt=""
                class="icon">&nbsp;<span v-if="place.code" class="background">{{ place.code }}</span> <span
                v-if="place.platform" class="background">pl. {{ place.platform }}</span>{{
                    place.name
                }} </span><span class="moreinfo">{{
                place.locality ?
                    place.locality + ", " :
                    place.localAdmin ? place.localAdmin
                        + ", " : "" }}{{
                place.region }}</span></div>
</template>
<style>
.background {
    background-color: #aaa;
    color: black;
    border-radius: .1rem;
}

.row {
    padding: 0 1%;
}

.icon {
    height: 1rem;
}

.spread {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    background-color: transparent;
}

.moreinfo {
    font-size: 70%;
    color: var(--c-primary)
}
</style>