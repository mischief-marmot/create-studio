export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html) => {
    // html.head is an array with a single string containing all head content
    if (Array.isArray(html.head)) {
      html.head = html.head.map((item) => {
        // Replace preload with preconnect for /embed/main.js
        if (typeof item === 'string') {
          // Replace preload rel="preload" with rel="preconnect" for /embed/main.js
          return item.replace(
            /<link([^>]*href="[^"]*\/embed\/main\.js"[^>]*)rel="preload"([^>]*)>/gi,
            '<link$1rel="preconnect"$2>'
          ).replace(
            /<link([^>]*)rel="preload"([^>]*href="[^"]*\/embed\/main\.js"[^>]*)>/gi,
            '<link$1rel="preconnect"$2>'
          ).replace(
            /<link([^>]*href="[^"]*\/embed\/main\.js"[^>]*)fetchpriority="low"([^>]*)>/gi,
            '<link$1fetchpriority="high"$2>'
          ).replace(
            /<link([^>]*)fetchpriority="low"([^>]*href="[^"]*\/embed\/main\.js"[^>]*)>/gi,
            '<link$1fetchpriority="high"$2>'
          )
        }
        return item
      })
    }
  })
})
