# How to Verify Service Worker is Working

## Quick Check

### 1. Check Console Logs

When you load the app, you should see these console messages:

```
🔧 [SW Plugin] Initializing Service Worker...
✅ [SW Plugin] Service Worker registered successfully!
📋 [SW Plugin] To check SW status, run: navigator.serviceWorker.getRegistrations()
```

### 2. Check Service Worker Registration

Open browser DevTools Console and run:

```javascript
navigator.serviceWorker.getRegistrations()
```

You should see an array with at least one registration:
```javascript
[ServiceWorkerRegistration { scope: "http://localhost:3001/", ... }]
```

### 3. Check Service Worker Status

**Chrome/Edge:**
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in left sidebar
4. You should see your Service Worker listed as "activated and running"

**Firefox:**
1. Open DevTools (F12)
2. Go to **Application** → **Service Workers**
3. Or visit `about:debugging#/runtime/this-firefox`

**Safari:**
1. Open Web Inspector
2. Go to **Storage** tab
3. Look for Service Workers

### 4. Test Timer Registration

Start a timer and watch the console:

```
🔄 [Timer Manager] Registering timer with Service Worker: { id: "...", duration: 300, label: "Simmer" }
[SW Manager] Registering timer with SW: { timerId: "...", duration: 300, label: "Simmer" }
[ServiceWorker] Registering timer: { timerId: "...", duration: 300, label: "Simmer" }
[ServiceWorker] Starting timer check interval
✅ [SW Plugin] Timer registered in SW: { timerId: "..." }
```

### 5. Test Background Processing

1. **Start a timer** (e.g., 10 seconds)
2. **Minimize the browser window** or switch to another tab
3. **Wait for timer to complete**
4. You should see a **push notification** when the timer finishes

### 6. Check Active Timers in Service Worker

In DevTools Console:

```javascript
// Get swManager instance
const sw = window.$nuxt.$sw

// Check if SW is ready
console.log('SW Ready:', sw.isReady())

// Get active timers from Service Worker
sw.getActiveTimers().then(timers => {
  console.log('Active timers in SW:', timers)
})
```

## Console Log Guide

### When Service Worker Registers Successfully

```
🔧 [SW Plugin] Initializing Service Worker...
[SW Manager] Registering service worker: /sw.js
[ServiceWorker] Installing
[ServiceWorker] Activating
[SW Manager] Service worker registered: ServiceWorkerRegistration {...}
✅ [SW Plugin] Service Worker registered successfully!
```

### When Timer Starts

```
🔄 [Timer Manager] Registering timer with Service Worker: {...}
[SW Manager] Registering timer with SW: {...}
[ServiceWorker] Message received: { type: "REGISTER_TIMER", data: {...} }
[ServiceWorker] Registering timer: { timerId: "...", duration: 300, label: "..." }
[ServiceWorker] Starting timer check interval
✅ [SW Plugin] Timer registered in SW: { timerId: "..." }
```

### When Timer Pauses

```
[SW Manager] Updating timer in SW: { timerId: "...", remaining: 245, status: "paused" }
[ServiceWorker] Message received: { type: "UPDATE_TIMER", ... }
[ServiceWorker] Updating timer: { timerId: "...", remaining: 245, status: "paused" }
```

### When Timer Resumes

```
[SW Manager] Updating timer in SW: { timerId: "...", remaining: 245, status: "running" }
[ServiceWorker] Message received: { type: "UPDATE_TIMER", ... }
[ServiceWorker] Updating timer: { timerId: "...", remaining: 245, status: "running" }
```

### When Timer Completes

```
[ServiceWorker] Timer completed: { timerId: "...", label: "Simmer", ... }
[ServiceWorker] Showing notification for timer: Simmer
⏰ [SW Plugin] Timer completed: { timerId: "...", label: "Simmer" }
🔔 [SW Plugin] Playing alarm for timer: { timerId: "..." }
```

## Troubleshooting

### Service Worker Not Registering

**Issue:** No Service Worker logs in console

**Solutions:**
1. Check if Service Workers are supported:
   ```javascript
   console.log('SW Supported:', 'serviceWorker' in navigator)
   ```
2. Make sure you're using HTTPS or localhost (required for SW)
3. Check browser compatibility (Chrome 40+, Firefox 44+, Safari 11.1+)

### Timer Not Registering with Service Worker

**Issue:** See "Service Worker not ready" warning

**Solutions:**
1. Wait a moment after page load for SW to activate
2. Check if SW is actually registered:
   ```javascript
   navigator.serviceWorker.getRegistrations()
   ```
3. Reload the page - first load registers SW, second load activates it

### No Notification on Timer Completion

**Issue:** Timer completes but no notification shows

**Solutions:**
1. **Grant notification permission:**
   ```javascript
   await Notification.requestPermission()
   ```
2. Check notification permission:
   ```javascript
   console.log('Permission:', Notification.permission)
   ```
3. Make sure notifications aren't blocked for the site in browser settings

### Service Worker Not Running in Background

**Issue:** Timer stops when tab is minimized

**Solutions:**
1. Check if SW is actually activated (not just registered)
2. Make sure timer was registered with SW (check logs)
3. Some browsers limit background activity - test in Chrome first

## Testing Checklist

- [ ] Service Worker registers on page load
- [ ] SW shows as "activated and running" in DevTools
- [ ] Timer registration shows in console
- [ ] Timer shows confirmation from SW
- [ ] Pause/resume updates SW state
- [ ] Timer continues when tab is minimized
- [ ] Notification shows when timer completes
- [ ] Alarm sound plays on completion
- [ ] Multiple timers can run simultaneously

## Advanced Debugging

### View Service Worker Code

**Chrome/Edge:**
1. DevTools → Application → Service Workers
2. Click on the Service Worker source file
3. You can set breakpoints and debug

### Force Service Worker Update

```javascript
// Unregister current Service Worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister())
})

// Reload page to register fresh
location.reload()
```

### Monitor Service Worker Messages

```javascript
navigator.serviceWorker.addEventListener('message', event => {
  console.log('Message from SW:', event.data)
})
```

### Check Service Worker Internals (Chrome)

Visit: `chrome://serviceworker-internals/`

This shows all registered Service Workers and allows you to:
- Start/stop Service Workers
- Unregister Service Workers
- View console logs
- Simulate push notifications

## Expected Behavior Summary

✅ **Service Worker registers** on app startup
✅ **Timers register with SW** when started
✅ **SW tracks timers** independently of page
✅ **Notifications show** when timers complete in background
✅ **Alarm plays** when user returns to page
✅ **State syncs** between SW and in-page timer manager
✅ **Multiple timers** can run simultaneously
✅ **Timers persist** across page refreshes (via localStorage)
