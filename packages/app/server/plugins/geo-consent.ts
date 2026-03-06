export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    const country = getHeader(event, 'cf-ipcountry') || null
    const consentRequired = isConsentRequired(country)
    html.head.push(`<script>window.__CONSENT_REQUIRED__=${consentRequired}</script>`)
  })
})
