<script setup lang="ts">
import { Map, Layers, Sources, Styles } from "vue3-openlayers";
import { ref } from "vue";
import RoutingHome from "../components/RoutingHome.vue";
import { MVT } from 'ol/format';

const zoom = 15;
const center: Array<GLfloat> = [2776349.9688816136, 8438737.417225536];
const projection: string = "EPSG:3857";
const mapUrl = ref("https://digitransit-prod-cdn-origin.azureedge.net/map/v2/hsl-map/{z}/{x}/{y}.png?digitransit-subscription-key=bbc7a56df1674c59822889b1bc84e7ad");
const stopsUrl = ref("https://digitransit-prod-cdn-origin.azureedge.net/map/v2/finland-stop-map/{z}/{x}/{y}.pbf?digitransit-subscription-key=a1e437f79628464c9ea8d542db6f6e94")
const mvtFormat = new MVT();
const radius = ref(10);
const strokeWidth = ref(2);
const stroke = ref("#ff0000");
const fill = ref("#ffffff");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const overrideStyleFunction = (feature: any, style: any) => {

    const properties = feature.get('type');  //from extra data in properties of the feature
    console.log(properties)
    style.getImage().getFill().setColor("red");
    return style;

}
</script>

<script lang="ts">
export default {
    name: "RoutingPage",
}
</script>

<template>
    <div class="container">
        <div class="sidebar">
            <RoutingHome></RoutingHome>
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
                            <Styles.OlStyleStroke :color="stroke" :width="strokeWidth"></Styles.OlStyleStroke>
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
