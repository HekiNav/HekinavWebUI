<script lang="ts">
export default {
  name: "RoutingHome",
}
</script>

<template>
  <div class="container">
    <h1 class="header">Get routes</h1>
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
  text-align: center;
}

h1 {
  color: var(--c-white);
}

#origin {
  grid-area: origin;
}

#destination {
  grid-area: destination;
}

input {
  font-family: var(--t-normal);
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
