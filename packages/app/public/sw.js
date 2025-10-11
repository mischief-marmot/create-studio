// Create Studio Service Worker
// Handles background timers and push notifications

const CACHE_VERSION = 'v1';
const TIMER_CHECK_INTERVAL = 1000; // Check timers every second

// Storage for active timers
let activeTimers = new Map();

// Install event
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing');
  event.waitUntil(self.skipWaiting()); // Activate immediately
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating');
  event.waitUntil(
    self.clients.claim().then(() => {
      console.log('[ServiceWorker] ✅ Activated and claimed all clients!');
    }).catch((error) => {
      console.error('[ServiceWorker] ❌ Activation failed:', error);
    })
  );
});

// Message handler for timer management
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);

  const { type, data } = event.data;

  switch (type) {
    case 'REGISTER_TIMER':
      registerTimer(data, event.source);
      break;

    case 'UPDATE_TIMER':
      updateTimer(data);
      break;

    case 'CANCEL_TIMER':
      cancelTimer(data.timerId);
      break;

    case 'GET_ACTIVE_TIMERS':
      sendActiveTimers(event.source);
      break;

    case 'SYNC_STORAGE':
      // Store the latest storage state for timer references
      self.latestStorage = data.storage;
      break;
  }
});

// Register a new timer
function registerTimer(timerData, client) {
  const { timerId, duration, label, stepIndex } = timerData;

  console.log('[ServiceWorker] Registering timer:', { timerId, duration, label });

  // Calculate end time
  const endTime = Date.now() + (duration * 1000);

  activeTimers.set(timerId, {
    timerId,
    label,
    duration,
    endTime,
    stepIndex,
    clientId: client?.id,
    status: 'running'
  });

  // Start checking timers if not already running
  startTimerCheck();

  // Send confirmation back to client
  client?.postMessage({
    type: 'TIMER_REGISTERED',
    data: { timerId }
  });
}

// Update an existing timer
function updateTimer(timerData) {
  const { timerId, remaining, status } = timerData;

  const timer = activeTimers.get(timerId);
  if (!timer) return;

  console.log('[ServiceWorker] Updating timer:', { timerId, remaining, status });

  if (status === 'paused') {
    timer.pausedRemaining = remaining;
    timer.status = 'paused';
  } else if (status === 'running' && timer.status === 'paused') {
    // Resume from paused
    timer.endTime = Date.now() + (timer.pausedRemaining * 1000);
    timer.status = 'running';
  }

  activeTimers.set(timerId, timer);
}

// Cancel a timer
function cancelTimer(timerId) {
  console.log('[ServiceWorker] Canceling timer:', timerId);
  activeTimers.delete(timerId);

  if (activeTimers.size === 0) {
    stopTimerCheck();
  }
}

// Timer checking interval
let timerCheckInterval = null;

function startTimerCheck() {
  if (timerCheckInterval) return; // Already running

  console.log('[ServiceWorker] Starting timer check interval');

  timerCheckInterval = setInterval(() => {
    checkTimers();
  }, TIMER_CHECK_INTERVAL);
}

function stopTimerCheck() {
  if (timerCheckInterval) {
    console.log('[ServiceWorker] Stopping timer check interval');
    clearInterval(timerCheckInterval);
    timerCheckInterval = null;
  }
}

// Check all timers and trigger notifications for completed ones
async function checkTimers() {
  const now = Date.now();
  const completedTimers = [];

  for (const [timerId, timer] of activeTimers.entries()) {
    if (timer.status !== 'running') continue;

    const remaining = Math.max(0, Math.floor((timer.endTime - now) / 1000));

    // Timer completed
    if (remaining === 0 && timer.status === 'running') {
      completedTimers.push(timer);
      timer.status = 'completed';
      activeTimers.set(timerId, timer);
    }
  }

  // Handle completed timers
  for (const timer of completedTimers) {
    await handleTimerComplete(timer);
  }
}

// Handle timer completion
async function handleTimerComplete(timer) {
  console.log('[ServiceWorker] Timer completed:', timer);

  // Show notification
  await showTimerNotification(timer);

  // Notify all clients
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(client => {
    client.postMessage({
      type: 'TIMER_COMPLETED',
      data: {
        timerId: timer.timerId,
        label: timer.label
      }
    });
  });

  // Play alarm sound via clients (SW can't play audio directly)
  clients.forEach(client => {
    client.postMessage({
      type: 'PLAY_TIMER_ALARM',
      data: { timerId: timer.timerId }
    });
  });
}

// Show notification for completed timer
async function showTimerNotification(timer) {
  try {
    console.log('[ServiceWorker] 🔔 Attempting to show notification for timer:', timer.label);

    // Check if notifications are supported
    if (!self.registration.showNotification) {
      console.log('[ServiceWorker] ❌ Notifications not supported in this browser');
      return;
    }

    console.log('[ServiceWorker] 📢 Creating notification...');

    await self.registration.showNotification('Timer Complete! ⏰', {
      body: `"${timer.label}" has finished`,
      icon: '/img/icon.svg',
      tag: `timer-${timer.timerId}`,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      silent: false,
      data: {
        timerId: timer.timerId,
        url: self.location.origin
      }
    });

    console.log('[ServiceWorker] ✅ Notification shown successfully!');
  } catch (error) {
    console.error('[ServiceWorker] ❌ Error showing notification:', error);
  }
}

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'view' || !event.action) {
    // Open or focus the app
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        // Check if there's already a window open
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window if none exists
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
    );
  }
});

// Send active timers to client
function sendActiveTimers(client) {
  const timers = Array.from(activeTimers.values());

  client?.postMessage({
    type: 'ACTIVE_TIMERS',
    data: { timers }
  });
}

// Periodic background sync for timer updates (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'timer-sync') {
    console.log('[ServiceWorker] Periodic sync for timers');
    event.waitUntil(checkTimers());
  }
});

// Push event handler (for future push notification support)
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push event received');

  if (event.data) {
    const data = event.data.json();

    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        badge: '/badge-72.png',
        data: data.data
      })
    );
  }
});
