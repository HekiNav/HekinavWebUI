<script lang="ts">
export default {
  name: "RoutingHome",
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
          <div title="option-1">
            <input id="option-1" name="option" type="radio" checked />
            <label class="option" for="option-1" data-txt="Finland v2"></label>
          </div>
          <div title="option-2">
            <input id="option-2" name="option" type="radio" />
            <label class="option" for="option-2" data-txt="HSL v2"></label>
          </div>
          <div title="option-3">
            <input id="option-3" name="option" type="radio" />
            <label class="option" for="option-3" data-txt="Hekinav"></label>
          </div>
        </div>
      </div>

    </h1>
    <h1>from</h1><input type="text" placeholder="Origin" class="placeInput" name="origin" id="origin">
    <h1>to</h1><input type="text" placeholder="Destination" class="placeInput" name="destination" id="destination">
    <h1>at</h1><input type="time" class="timeInput" name="time" id="time"><input type="date" class="dateInput"
      name="date" id="date">
  </div>
</template>

<style scoped>
.container {
  width: 100%;
  height: 100%;
  background-color: var(--c-secondary);
  display: grid;
  grid-template-columns: 1fr 2fr 4fr;
  grid-template-rows: repeat(5, 1fr) 10fr;
  grid-template-areas:
    "header header header"
    "from origin origin"
    "to destination destination";
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
  z-index: 100000;
  font-size: var(--fs-h3);
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  top: -100px;
  opacity: 0;
  transition: 300ms;
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
  width: 100%;
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






#origin {
  grid-area: origin;
}

#destination {
  grid-area: destination;
}

input {
  font-family: var(--t-normal);
  font-size: var(--fs-h4);
}

.placeInput {
  margin: 2%;
  height: 80%;
  width: 96%;
  border-width: 1px;
  border-color: black;
  border-style: solid;
  color: var(--c-text);
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
