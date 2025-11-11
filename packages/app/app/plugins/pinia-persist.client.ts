/**
 * Pinia persist plugin initialization
 * Sets up pinia-plugin-persistedstate for localStorage persistence
 */

import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

export default defineNuxtPlugin(({ $pinia }) => {
  // Register the persist plugin with Pinia
  $pinia?.use(piniaPluginPersistedstate)
})
