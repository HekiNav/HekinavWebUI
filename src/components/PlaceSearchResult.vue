<script setup lang="ts">
import { SearchLayer, TransitMode, type Place } from '@/types/Place';
import { defineProps } from "vue"
const props = defineProps(["place"])
const emitter = defineEmits<{
    "place-click": [place: Place]
}>()
const place: Place = props.place

function getImg(mode: TransitMode) {
    return `/src/assets/img/icons/station.${TransitMode[mode.toString() as keyof typeof TransitMode]}.svg`
}
</script>
<script lang="ts">
export default {
    name: "RoutingPage",
}
</script>
<template>
    <div v-if="place.layer == SearchLayer.address" @mousedown="emitter('place-click', place)" class="row spread">
        <span>{{
            place.street
            }} {{
                place.housenumber }} </span><span class="moreinfo">{{ place.locality ? place.locality + ", " :
                place.localAdmin ? place.localAdmin
                    + ", " : "" }}{{
                place.region }}</span></div>
    <div v-if="place.layer == SearchLayer.street" @mousedown="emitter('place-click', place)" class="row spread"><span>{{
        place.name
            }} </span><span class="moreinfo">{{ place.neighbourhood ? place.neighbourhood + ", " : "" }}{{
                place.locality ?
                    place.locality + ", " :
                    place.localAdmin ? place.localAdmin
                        + ", " : "" }}{{
                place.region }}</span></div>
    <div v-if="place.layer == SearchLayer.venue" @mousedown="emitter('place-click', place)" class="row spread"><span>{{
        place.name
            }} </span><span class="moreinfo">{{ place.street ? place.street + " " + place.housenumber + ", " : "" }}{{
                place.neighbourhood ?
                    place.neighbourhood + ", " : "" }}{{
                place.locality ?
                    place.locality + "," :
                    place.localAdmin ? place.localAdmin
                        + "," : "" }}{{
                place.region }}</span></div>
    <div v-if="place.layer == SearchLayer.neighbourhood" @mousedown="emitter('place-click', place)" class="row spread">
        <span>{{
            place.name
        }} </span><span class="moreinfo">{{
                place.locality ?
                    place.locality + ", " :
                    place.localAdmin ? place.localAdmin
                        + ", " : "" }}{{
                place.region }}</span>
    </div>
    <div v-if="place.layer == SearchLayer.stop || place.layer == SearchLayer.station"
        @mousedown="{ emitter('place-click', place); console.log(place) }" class="row spread"><span class="icon-c"><img
                v-for="mode in place.transitModes" :key="mode" :src="getImg(mode)" alt="" class="icon"><span
                v-if="place.code" class="background">{{ place.code }}</span> <span v-if="place.platform"
                class="background">pl. {{ place.platform }}</span>{{
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
    margin: 0 .2rem 0 0;

}

.row {
    padding: .1rem 1%;
}

.icon {
    height: 1.5rem;
    padding: 0 .2rem 0 0;
}

.icon-c {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
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