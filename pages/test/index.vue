<template>
    <div>
        <button id="open-iframe" @click="openIframe">Click Me</button>
    </div>
    <iframe ref="iframe" v-show="iframeVisible" allowfullscreen src="/creations/7/interactive" frameborder="0" id="interactive-iframe"></iframe>
</template>

<style>
#iframe {
    width: 100vw;
    height: 100vh;
    border: none;
    display: hidden;
}
</style>

<script setup>

import { ref } from 'vue';

const iframeVisible = ref(false);
const iframe = ref(null);
const isWindowMobile = ref(false);

onMounted(() => {
    isWindowMobile.value = window.innerWidth < 768;
});

function openIframe() {
    iframeVisible.value = true;
    if (isWindowMobile.value) {
        iframe.value.requestFullscreen();
    }
}
// do this the Vue way
function closeIframe() {
    iframeVisible.value = false;
    if (isWindowMobile.value) {
        document.exitFullscreen();
    }
}

</script>
