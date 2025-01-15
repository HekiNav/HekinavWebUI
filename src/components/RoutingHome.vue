<script lang="ts">
import { ref } from 'vue';
import { autocomplete } from '../scripts/Digitransit.ts';
import PlaceSearchResult from './PlaceSearchResult.vue';

export default {
  name: "RoutingHome",
}
</script>
<script setup lang="ts">
const origin = defineModel('origin', { default: "" })
const destination = defineModel('destination', { default: "" })
const originResults = ref([])
const destinationResults = ref([])
function search(type: LocationType) {
  if (type == 0 && origin.value.length > 1) {
    autocomplete(origin.value).then(data => {
      originResults.value = data.features
    })
  } else if (type == 1 && destination.value.length > 1) {
    autocomplete(destination.value).then(data => {
      destinationResults.value = data.features
    })

  }
}
enum LocationType {
  origin,
  destination
}
</script>

<template>
  <div class="container">
    <h1 class="header">Get routes with&nbsp;
      <div class="select">
        <div class="selected" data-default="All" data-one="Finland v2" data-two="HSL v2" data-three="Hekinav">
          <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512" class="arrow">
            <path
              d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z">
            </path>
          </svg>
        </div>
        <div class="options">
          <img class="digitransit-logo"
            src="data:image/png;base64,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"
            alt="Digitransit">
          <div title="option-1" class="option-container">
            <input id="option-1" name="option" type="radio" checked />
            <label class="option" for="option-1" data-txt="Finland&nbsp;v2"></label>
          </div>
          <div title="option-2" class="option-container">
            <input id="option-2" name="option" type="radio" />
            <label class="option" for="option-2" data-txt="HSL&nbsp;v2"></label>
          </div>
          <img class="digitransit-logo" src="../assets/img/hekinav_white.png" alt="Digitransit">
          <div title="option-3" class="option-container">
            <input id="option-3" name="option" type="radio" />
            <label class="option" for="option-3" data-txt="Hekinav"></label>
          </div>
        </div>
      </div>

    </h1>
    <h1>from</h1>
    <div class="placeInput-c" id="origin-c">
      <input v-model="origin" @keyup="search(LocationType.origin)" type="text" placeholder="Origin" class="placeInput"
        name="origin" id="origin">
      <div class="placeSearch" id="originSearch">
        <PlaceSearchResult v-for="result in originResults" :place=result :key="result.name"></PlaceSearchResult>
      </div>

    </div>
    <h1>to</h1>
    <div class="placeInput-c" id="destination-c">
      <input v-model="destination" @keyup="search(LocationType.destination)" type="text" placeholder="Destination"
        class="placeInput" name="destination" id="destination">
      <div class="placeSearch" id="destinationSearch"></div>
    </div>
    <h1>at</h1><input type="time" class="timeInput" name="time" id="time"><input type="date" class="dateInput"
      name="date" id="date">
    <RoutingOptions></RoutingOptions>
  </div>
</template>

<style scoped>
.container {
  width: 100%;
  overflow-y: hidden;
  background-color: var(--c-secondary);
  display: grid;
  grid-template-columns: 1fr 2fr 4fr;
  grid-template-rows: repeat(5, 1fr) 10fr;
  grid-template-areas:
    "header header header"
    "from origin origin"
    "to destination destination"
    "at time date"
    "transitmodes transitmodes transitmodes";
}

.header {
  color: var(--c-white);
  grid-area: header;
  display: flex;
  flex-direction: row;
  align-items: start;
  justify-content: center;
}

h1 {
  color: var(--c-white);
  font-family: var(--f-header-2);
  font-size: var(--fs-h3);
}

.digitransit-logo {
  width: 50%
}

.select {
  position: relative;
  font-family: var(--f-header-2);
  width: fit-content;
  cursor: pointer;
  transition: 300ms;
  color: var(--c-white);
  height: 3rem;
}

.selected {
  background-color: var(--c-secondary);
  position: relative;
  z-index: 10000;
  font-size: var(--fs-h3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: fit-content;
}

.arrow {
  position: relative;
  right: 0px;
  height: 10px;
  transform: rotate(-90deg);
  width: 25px;
  fill: var(--c-white);
  z-index: 100000;
  transition: 300ms;
}

.options {
  display: flex;
  flex-direction: column;
  border-radius: 5px;
  padding: 5px;
  background-color: var(--c-secondary);
  position: relative;
  width: min-content;
  top: -100px;
  opacity: 0;
  transition: 300ms;
}

.option-container {
  width: fit-content;
}

.select:hover>.options {
  opacity: 1;
  top: 0;
}

.select:hover>.selected .arrow {
  transform: rotate(0deg);
}

.option {
  transition: 300ms;
  background-color: var(--c-secondary);
  width: fit-content;
  font-size: var(--fs-h3);
}

.option:hover {
  background-color: var(--c-primary);
  ;
}

.options input[type="radio"] {
  display: none;
}

.options label {
  display: inline-block;
}

.options label::before {
  content: attr(data-txt);
}

.options input[type="radio"]:checked+label {
  display: none;
}

.options input[type="radio"]#all:checked+label {
  display: none;
}

.select:has(.options input[type="radio"]#all:checked) .selected::before {
  content: attr(data-default);
}

.select:has(.options input[type="radio"]#option-1:checked) .selected::before {
  content: attr(data-one);
}

.select:has(.options input[type="radio"]#option-2:checked) .selected::before {
  content: attr(data-two);
}

.select:has(.options input[type="radio"]#option-3:checked) .selected::before {
  content: attr(data-three);
}






#origin-c {
  grid-area: origin;
}

#destination-c {
  grid-area: destination;
}

input {
  font-family: var(--t-normal);
  font-size: var(--fs-h4);
}

.placeInput-c {
  margin: 2%;
  height: 80%;
  width: 96%;
  border-width: 1px;
  border-color: black;
  border-style: solid;
  color: var(--c-text);
}

.placeInput {
  height: 100%;
  width: 100%;
  color: var(--c-text);
  border: 0;
}

.timeInput {
  margin: 4% 0 4% 6%;
  height: 80%;
  width: 94%;
  border-width: 1px 0 1px 1px;
  border-color: black;
  border-style: solid;
}

.dateInput {
  margin: 2% 3% 2% 0;
  height: 80%;
  width: 97%;
  border-width: 1px 1px 1px 0;
  border-color: black;
  border-style: solid;
}
</style>
