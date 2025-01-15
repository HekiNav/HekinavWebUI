<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script lang="ts">

export default {
    name: 'NavBar',
}
import { RouterLink } from 'vue-router';

</script>
<template>
    <nav>
        <ul>
            <li>
                <RouterLink to="/"><img class="logo" src="../assets/img/hekinav.png" alt="hekinav logo"></RouterLink>
            </li>
            <li class="navItem">
                <RouterLink to="/map/">Line Map</RouterLink>
            </li>
            <li class="navItem">
                <RouterLink to="/nav/">Routing</RouterLink>
            </li>
            <li class="navItem">
                <RouterLink to="/changelog/">Changelog</RouterLink>
            </li>
            <li class="navItem">
                <RouterLink to="/tools/">Tools</RouterLink>
            </li>
            <li class="navItem">
                <RouterLink to="/discord/">Discord</RouterLink>
            </li>
        </ul>
    </nav>
</template>
<style>
nav {
    top: 0;
    width: 100vw;
    height: 10vh;
    font-family: var(--f-normal);
}

nav ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background-color: #fff;
    height: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
}

li {
    float: left;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    height: 100%;
}



.logo {
    height: 4vw;
    padding-bottom: 2%;
}

.logo-link {
    flex-wrap: wrap;
    display: flex;
    align-content: center;
    height: 100%;
    padding: 0;
}

*[hidden] {
    display: none !important;
}
</style>