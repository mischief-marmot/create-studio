# Service Worker Integration for Background Timers

## Overview

Service Worker support has been integrated to enable background timer processing and push notifications. This allows timers to continue running even when the page is not in focus or minimized, with notifications shown when timers complete.

## Architecture

### Components

1. **Service Worker** (`/packages/app/public/sw.js`)
   - Runs in background independent of page lifecycle
   - Tracks active timers with 1-second interval checking
   - Sends push notifications on timer completion
   - Communicates with page via postMessage

2. **Service Worker Manager** (`/packages/shared/src/lib/service-worker/sw-manager.ts`)
   - Singleton class for interacting with Service Worker
   - Handles registration, timer registration, updates, and cancellation
   - Provides notification permission API
   - Dispatches custom events for timer events

3. **Nuxt Plugin** (`/packages/app/app/plugins/service-worker.client.ts`)
   - Registers Service Worker on app startup
   - Provides fallback alarm sound player
   - Makes swManager available globally via `$sw`

4. **Timer Manager Integration** (`/packages/widgets/src/composables/useSharedTimerManager.ts`)
   - Extended to sync with Service Worker
   - Registers timers on start
   - Updates SW on pause/resume
   - Cancels timers in SW on reset
   - Listens for SW completion events

## Message Flow

### Timer Start Flow
```
User clicks start
  ↓
Timer Manager: startTimer()
  ↓
Service Worker: REGISTER_TIMER message
  ↓
SW: Starts background tracking
  ↓
SW: Sends TIMER_REGISTERED confirmation
```

### Timer Pause Flow
```
User clicks pause
  ↓
Timer Manager: pauseTimer()
  ↓
Service Worker: UPDATE_TIMER {status: 'paused'}
  ↓
SW: Pauses background timer
```

### Timer Resume Flow
```
User clicks resume
  ↓
Timer Manager: resumeTimer()
  ↓
Service Worker: UPDATE_TIMER {status: 'running'}
  ↓
SW: Resumes background timer with remaining time
```

### Timer Completion Flow (Background)
```
SW: Detects timer reached 0
  ↓
SW: Shows push notification
  ↓
SW: Sends TIMER_COMPLETED message to all clients
  ↓
Timer Manager: Receives sw:timer-completed event
  ↓
Timer Manager: Updates UI state, plays alarm
```

## API Reference

### ServiceWorkerManager Methods

```typescript
// Register the service worker
await swManager.register('/sw.js'): Promise<boolean>

// Request notification permission
await swManager.requestNotificationPermission(): Promise<NotificationPermission>

// Register a timer
await swManager.registerTimer({
  timerId: string,
  duration: number,
  label: string,
  stepIndex?: number
}): Promise<void>

// Update timer state
await swManager.updateTimer({
  timerId: string,
  remaining: number,
  status: 'running' | 'paused' | 'completed'
}): Promise<void>

// Cancel a timer
await swManager.cancelTimer(timerId: string): Promise<void>

// Get active timers
await swManager.getActiveTimers(): Promise<any[]>

// Check if SW is ready
swManager.isReady(): boolean
```

### Custom Events

The following custom events are dispatched on `window`:

- `sw:timer-completed` - Timer has reached 0
  ```typescript
  event.detail = { timerId: string, label: string }
  ```

- `sw:play-alarm` - Request to play alarm sound
  ```typescript
  event.detail = { timerId: string }
  ```

- `sw:timer-registered` - Timer successfully registered in SW
  ```typescript
  event.detail = { timerId: string }
  ```

- `sw:active-timers` - List of active timers from SW
  ```typescript
  event.detail = { timers: Array<Timer> }
  ```

## Service Worker Messages

### Messages TO Service Worker

- `REGISTER_TIMER` - Register new timer
  ```typescript
  {
    type: 'REGISTER_TIMER',
    data: {
      timerId: string,
      duration: number,
      label: string,
      stepIndex?: number
    }
  }
  ```

- `UPDATE_TIMER` - Update timer state
  ```typescript
  {
    type: 'UPDATE_TIMER',
    data: {
      timerId: string,
      remaining: number,
      status: 'running' | 'paused' | 'completed'
    }
  }
  ```

- `CANCEL_TIMER` - Cancel a timer
  ```typescript
  {
    type: 'CANCEL_TIMER',
    data: { timerId: string }
  }
  ```

- `GET_ACTIVE_TIMERS` - Request list of active timers
  ```typescript
  {
    type: 'GET_ACTIVE_TIMERS'
  }
  ```

- `SYNC_STORAGE` - Sync storage state
  ```typescript
  {
    type: 'SYNC_STORAGE',
    data: { storage: any }
  }
  ```

### Messages FROM Service Worker

- `TIMER_COMPLETED` - Timer has completed
  ```typescript
  {
    type: 'TIMER_COMPLETED',
    data: {
      timerId: string,
      label: string
    }
  }
  ```

- `PLAY_TIMER_ALARM` - Request alarm playback
  ```typescript
  {
    type: 'PLAY_TIMER_ALARM',
    data: { timerId: string }
  }
  ```

- `TIMER_REGISTERED` - Confirmation of registration
  ```typescript
  {
    type: 'TIMER_REGISTERED',
    data: { timerId: string }
  }
  ```

- `ACTIVE_TIMERS` - List of active timers
  ```typescript
  {
    type: 'ACTIVE_TIMERS',
    data: { timers: Array<Timer> }
  }
  ```

## Notification Permissions

To enable push notifications, the app must request permission:

```typescript
const permission = await swManager.requestNotificationPermission()

if (permission === 'granted') {
  // Notifications will be shown
} else {
  // Notifications denied, timers still work but silently
}
```

The app can check current permission state:
```typescript
if ('Notification' in window) {
  console.log('Permission:', Notification.permission)
}
```

## Benefits

1. **Background Processing** - Timers continue even when page is minimized or in background tab
2. **Push Notifications** - Users are alerted when timers complete, even if they've switched apps
3. **Battery Efficient** - Service Worker uses a single interval for all timers
4. **Reliability** - Timer state persists across page refreshes via localStorage sync
5. **Cross-Origin Sync** - Works with iframe embedding via postMessage

## Browser Support

Service Workers are supported in:
- Chrome/Edge 40+
- Firefox 44+
- Safari 11.1+
- Opera 27+

Push Notifications require user permission and are supported in modern browsers.

## Testing

To test Service Worker integration:

1. **Start the dev server**
   ```bash
   npm run dev
   ```

2. **Check SW registration**
   ```javascript
   // In browser console
   navigator.serviceWorker.getRegistrations()
   ```

3. **Start a timer** - Should register with SW
4. **Minimize the browser** - Timer continues in background
5. **Wait for completion** - Should receive push notification

## Debugging

Enable Service Worker logging:
```javascript
// In browser console
localStorage.debug = 'sw:*'
```

Check active Service Worker:
```
Chrome/Edge: chrome://serviceworker-internals/
Firefox: about:debugging#/runtime/this-firefox
```

## Future Enhancements

- [ ] Periodic Background Sync for timer updates
- [ ] Support for multiple timer sounds
- [ ] Timer history and analytics
- [ ] Vibration patterns for mobile
- [ ] Rich notification actions (snooze, add time)
