<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
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
      alignItems: 'center',
      padding: '60px',
      background: 'linear-gradient(135deg, #1a1a1f 0%, #2a2530 50%, #1a1a1f 100%)',
      fontFamily: 'Inter, sans-serif',
    }"
  >
    <div :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }">
      <span :style="{ fontSize: '28px', fontWeight: '700', color: '#e6a640', letterSpacing: '0.05em' }">
        Create Studio
      </span>
      <h1
        v-if="title"
        :style="{
          color: '#ffffff',
          fontSize: '48px',
          fontWeight: '700',
          lineHeight: '1.2',
          margin: '0',
          textAlign: 'center',
          letterSpacing: '-0.02em',
          maxWidth: '900px',
        }"
      >
        {{ title }}
      </h1>
      <p
        v-if="description"
        :style="{
          color: 'rgba(255,255,255,0.6)',
          fontSize: '22px',
          lineHeight: '1.4',
          margin: '0',
          textAlign: 'center',
          maxWidth: '750px',
        }"
      >
        {{ description }}
      </p>
    </div>

    <!-- Accent line -->
    <div
      :style="{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        height: '4px',
        background: 'linear-gradient(90deg, #e6a640, #d94f3f, #456a7a, #00bd7e)',
      }"
    />
  </div>
</template>
