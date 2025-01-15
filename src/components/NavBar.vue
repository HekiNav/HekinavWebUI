<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script lang="ts">
import "../assets/root.css"

export default {
    name: 'NavBar',
}
import { RouterLink } from 'vue-router';

</script>
<template>
    <nav>
        <ul>
            <RouterLink to="/">
                <li class="navItem"><img class="logo" src="../assets/img/hekinav.png" alt="hekinav logo"></li>
            </RouterLink>
            <RouterLink to="/nav/">
                <li class="navItem">Routing</li>
            </RouterLink>
            <RouterLink to="/map/">
                <li class="navItem">Line Graph</li>
            </RouterLink>
            <RouterLink to="/changelog/">
                <li class="navItem">Changelog</li>
            </RouterLink>
            <RouterLink to="/tools/">
                <li class="navItem">Tools</li>
            </RouterLink>
            <RouterLink to="/discord/">
                <li class="navItem">Discord</li>
            </RouterLink>

        </ul>
    </nav>
</template>
<style>
nav {
    top: 0;
    width: 100vw;
    height: 10vh;
    font-family: var(--f-header);
    z-index: 12000;
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
}

nav a {
    flex-grow: 1;
    flex-shrink: 0;
}

li {
    float: left;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
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