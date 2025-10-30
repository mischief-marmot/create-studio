<script setup lang="ts">
import { navigation } from '~/lib/navigation'
import clsx from 'clsx'

const route = useRoute()

defineProps<{
  className?: string
  onLinkClick?: (e: MouseEvent) => void
}>()
</script>

<template>
  <nav :class="clsx('text-base lg:text-sm', className)">
    <ul role="list" class="space-y-9">
      <li v-for="section in navigation" :key="section.title">
        <h2 class="font-display font-medium text-slate-900 dark:text-white">
          {{ section.title }}
        </h2>
        <ul
          role="list"
          class="mt-2 space-y-2 border-l-2 border-slate-100 lg:mt-4 lg:space-y-4 lg:border-slate-200 dark:border-slate-800"
        >
          <li v-for="link in section.links" :key="link.href" class="relative">
            <NuxtLink
              :to="link.href"
              :class="clsx(
                'block w-full pl-3.5 before:pointer-events-none before:absolute before:top-1/2 before:-left-1 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full',
                link.href === route.path
                  ? 'font-semibold text-sky-500 before:bg-sky-500'
                  : 'text-slate-500 before:hidden before:bg-slate-300 hover:text-slate-600 hover:before:block dark:text-slate-400 dark:before:bg-slate-700 dark:hover:text-slate-300'
              )"
              @click="onLinkClick"
            >
              {{ link.title }}
            </NuxtLink>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</template>
