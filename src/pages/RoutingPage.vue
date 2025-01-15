<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script setup lang="ts">
import "leaflet/dist/leaflet.css";
import {
    LMap,
    LIcon,
    LTileLayer,
    LMarker,
    LControlLayers,
    LTooltip,
    LPopup,
    LPolyline,
    LPolygon,
    LRectangle,
} from "@vue-leaflet/vue-leaflet";
import RoutingHome from "../components/RoutingHome.vue";

</script>
<script lang="ts">
export default {
    name: "RoutingPage",
    components: {
        LMap,
        LTileLayer,
    },
    data() {
        return {
            zoom: 2,
        };
    },
}
</script>

<template>
    <div class="container">
        <div class="sidebar">
            <RoutingHome></RoutingHome>
        </div>
        <div class="map-container">
            <l-map id="map" ref="map" v-model:zoom="zoom" :center="[47.41322, -1.219482]" :use-global-leaflet="false">
                <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" layer-type="base"
                    name="OpenStreetMap">
                </l-tile-layer>
            </l-map>
        </div>
    </div>
</template>
<style>
.container {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: row;
}

.map-container {
    width: 70%;
}

.sidebar {
    width: 30%;
}
</style>