import { surveyPlugin } from 'survey-vue3-ui'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(surveyPlugin)
})
