/**
 * Pinia persist plugin initialization
 * Sets up pinia-plugin-persistedstate for localStorage persistence
 */

import type { Pinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

export default defineNuxtPlugin({
  name: 'pinia-persist',
  dependsOn: ['pinia'],
  setup({ $pinia }: { $pinia: Pinia }) {
    // Register the persist plugin with Pinia
    $pinia?.use(piniaPluginPersistedstate)
  },
})
