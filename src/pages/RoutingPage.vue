<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script setup lang="ts">
import { Map, Layers, Sources, Styles } from "vue3-openlayers";
import { ref } from "vue";
import RoutingHome from "../components/RoutingHome.vue";
import { MVT } from 'ol/format';
import { RoutingView, useRoutingGlobalStore } from "@/stores/routingGlobal";
import RoutingItienararyList from "@/components/RoutingItienararyList.vue";
import RoutingLoading from "@/components/RoutingLoading.vue";

const zoom = 15;
const center: Array<GLfloat> = [2776349.9688816136, 8438737.417225536];
const projection: string = "EPSG:3857";
const mapUrl = ref("https://cdn.digitransit.fi/map/v2/hsl-map/{z}/{x}/{y}.png?digitransit-subscription-key=bbc7a56df1674c59822889b1bc84e7ad");
const stopsUrl = ref("https://cdn.digitransit.fi/map/v2/finland-stop-map/{z}/{x}/{y}.pbf?digitransit-subscription-key=a1e437f79628464c9ea8d542db6f6e94")
const mvtFormat = new MVT();
const radius = ref(10);

const fill = ref("#ffffff");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const overrideStyleFunction = (feature: any, style: any) => {
    const type = feature.get('type');
    let color = ""
    switch (type) {
        case "TRAM":
            color = "#00985f"
            break
        case "BUS":
            color = "#007ac9"
            break
        case "RAIL":
            color = "#8c4799"
            break
        case "FERRY":
            color = "#00b9e4"
            break
        case "SUBWAY":
            color = "#ff6319"
            break
        case "AIRPLANE":
            color = "#0046ad"
            break
        default:
            color = "#fc03f0"
    }

    style.getImage().getFill().setColor(color);

    return style
}
const routingGlobal = ref(useRoutingGlobalStore())
const { pageBack } = useRoutingGlobalStore()

</script>

<script lang="ts">
export default {
    name: "RoutingPage",
}
</script>

<template>
    <div class="container">
        <div class="sidebar">
            <div class="back-arrow" v-if="routingGlobal.routingView != RoutingView.HOME" @mousedown="pageBack()"><img
                    src="../assets/img/back.svg" alt="Go back"></div>
            <RoutingHome v-if="routingGlobal.routingView == RoutingView.HOME"></RoutingHome>
            <RoutingLoading v-if="routingGlobal.routingView == RoutingView.LOADING"></RoutingLoading>
            <RoutingItienararyList v-if="routingGlobal.routingView == RoutingView.LIST"></RoutingItienararyList>
        </div>
        <div class="map-container">
            <Map.OlMap id="map">
                <!-- Providing ol-options to the Map component -->
                <Map.OlView :projection="projection" :zoom="zoom" :center="center" />

                <!-- Base Tile Layer -->
                <Layers.OlTileLayer>
                    <Sources.OlSourceXyz :url="mapUrl" />
                </Layers.OlTileLayer>

                <!-- Vector Tile Layer -->
                <Layers.OlVectorTileLayer :style="null">
                    <Sources.OlSourceVectorTile :url="stopsUrl" :format="mvtFormat" />
                    <Styles.OlStyle :overrideStyleFunction="overrideStyleFunction">
                        <Styles.OlStyleCircle :radius="radius">
                            <Styles.OlStyleFill :color="fill" />
                        </Styles.OlStyleCircle>
                    </Styles.OlStyle>
                </Layers.OlVectorTileLayer>
            </Map.OlMap>
        </div>
    </div>
</template>

<style>
.container {
    height: 90vh;
    width: 100%;
    display: flex;
    flex-direction: row;
}

.back-arrow {
    position: absolute;
    height: 2rem;
    width: 2rem;
    margin: .5rem;
}

.map-container {
    width: 70%;
}

.sidebar {
    width: 30%;
}

#map {
    width: 100%;
    height: 100%;
}
</style>
