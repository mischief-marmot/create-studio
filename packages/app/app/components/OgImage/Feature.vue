<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  icon?: string
}>()
</script>

<template>
  <div
    :style="{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '50px 70px',
      background: 'linear-gradient(145deg, #456a7a 0%, #2a3d4a 40%, #1a2530 100%)',
      fontFamily: 'Inter, sans-serif',
    }"
  >
    <!-- Line 1: create.studio/features -->
    <div :style="{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', marginBottom: '8px', marginLeft: '6px' }">
      <span :style="{ color: '#e6a640', fontSize: '24px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase' }">
        /features
      </span>
    </div>

    <!-- Title -->
    <h1
      :style="{
        color: '#ffffff',
        fontSize: title.length > 50 ? '68px' : '80px',
        fontWeight: '700',
        lineHeight: '1.1',
        margin: '0',
        letterSpacing: '-0.025em',
        maxWidth: '1050px',
      }"
    >
      {{ title }}
    </h1>

    <!-- Description -->
    <p
      v-if="description"
      :style="{
        color: 'rgba(255,255,255,0.75)',
        fontSize: '34px',
        lineHeight: '1.4',
        margin: '20px 0 0 0',
        marginLeft: '6px',
        maxWidth: '1000px',
      }"
    >
      {{ description }}
    </p>

    <!-- Accent line -->
    <div
      :style="{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        height: '8px',
        background: 'linear-gradient(90deg, #b060ff, #ee87cb 30%, #fff1be 72%)',
      }"
    />
  </div>
</template>
