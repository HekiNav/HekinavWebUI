<script lang="ts">


export default {
  name: "RoutingLoading",
}
</script>
<script setup lang="ts">
</script>

<template>
  <div class="container">
    <h1 class="header">Loading routes</h1>
    <div class="loader">
      <div class="loader-cube">
        <div class="face"></div>
        <div class="face"></div>
        <div class="face"></div>
        <div class="face"></div>
        <div class="face"></div>
        <div class="face"></div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.container {
  width: 100%;
  overflow-y: hidden;
  background-color: var(--c-secondary);
  display: flex;
  flex-direction: column;
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

.loader {
  position: absolute;
  top: 50%;
  left: 15%;
  transform: translate(-50%, -50%);
  perspective: 800px;
}

.loader-cube {
  --cube-size: 3rem;
  width: 100px;
  height: 100px;
  position: relative;
  transform-style: preserve-3d;
  transform-origin: 50% 50%;
  animation: rotate 4s infinite linear;
}

.loader-cube:before,
.loader-cube:after {
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: transparent;
}

.loader-cube:before {
  transform: rotateX(90deg) translateZ(var(--cube-size));
}

.loader-cube:after {
  transform: rotateY(90deg) translateZ(3rem);
}

.loader-cube .face {
  position: absolute;
  width: 6rem;
  height: 6rem;
  background-color: rgb(252, 248, 248);
  opacity: .8;
  border: 2px solid rgb(252, 250, 250);
}

.loader-cube .face:nth-child(1) {
  transform: rotateY(0deg) translateZ(3rem);
  background-image: url("/src/assets/img/icons/station.subway.svg");
  background-color: #ff6319;
}

.loader-cube .face:nth-child(2) {
  transform: rotateX(90deg) translateZ(3rem);
  background-image: url("/src/assets/img/icons/station.bus.svg");
  background-color: #007ac9;

}

.loader-cube .face:nth-child(3) {
  transform: rotateY(90deg) translateZ(-3rem);
  background-color: #00b9e4;
  background-image: url("/src/assets/img/icons/station.ferry.svg");

}

.loader-cube .face:nth-child(4) {
  transform: rotateX(-90deg) translateZ(3rem);
  background-image: url("/src/assets/img/icons/station.tram.svg");
  background-color: #00985f;
}

.loader-cube .face:nth-child(5) {
  background-image: url("/src/assets/img/icons/station.rail.svg");
  background-color: #8c4799;
  transform: rotateY(90deg) translateZ(3rem);
}

.loader-cube .face:nth-child(6) {
  transform: rotateY(0deg) translateZ(-3rem);
  background-color: var(--c-secondary);
  background-image: url("/src/assets/img/icons/pin.svg");
  background-size: 4.5rem;
  background-repeat: no-repeat;
  background-position-x: center;
  background-position-y: center;
}

@keyframes rotate {
  0% {
    transform: rotateY(0deg) rotateX(0deg);
  }

  100% {
    transform: rotateY(1turn) rotateX(1turn);
  }
}
</style>
