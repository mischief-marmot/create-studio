# Server-Based Timer Architecture

## Overview
Timers are now managed server-side using Cloudflare KV with WebSocket synchronization for real-time updates. This works universally across all contexts (in-DOM, iframe, mobile).

## Components

### Server-Side
- **`/server/utils/timerManager.ts`**: Core timer state management with KV storage
- **`/server/api/v2/timers/index.post.ts`**: Create/update timers
- **`/server/api/v2/timers/[userId].get.ts`**: Get all user timers
- **`/server/api/v2/timers/[userId]/[timerId].delete.ts`**: Delete timer
- **`/server/api/v2/timers/ws.ts`**: WebSocket endpoint for real-time updates

### Client-Side
- **`/composables/useServerTimerSync.ts`**: WebSocket client for syncing with server
- **`/composables/useSharedTimerManager.ts`**: Local timer UI management (needs integration)

## Data Flow

1. **Timer Start**:
   - User clicks start → Local timer begins
   - POST to `/api/v2/timers` → Server stores state in KV
   - WebSocket sends confirmation

2. **Timer Updates**:
   - WebSocket server sends updates every 1 second
   - Client receives updates → Syncs local state
   - When timer reaches 0 → Server marks complete → Client plays alarm

3. **Timer Completion**:
   - Server detects completion → Updates KV → Sends WS message
   - Client plays alarm sound
   - DELETE request removes timer from KV

4. **Page Reload/Reopen**:
   - Client connects to WebSocket
   - Server sends `init` message with all active timers
   - Client restores timer state

## Storage & Cleanup

- **Storage**: Cloudflare KV with 7-day TTL
- **Cleanup**: Automatic via KV expiration
- **User ID**: Anonymous client-generated UUID

## Benefits

✅ Works in any context (in-DOM, iframe, mobile)
✅ Survives page close/reopen
✅ Real-time sync across tabs
✅ Automatic cleanup after 7 days
✅ No localStorage limitations
✅ Scales with Cloudflare

## Next Steps

1. Integrate `useServerTimerSync` with `useSharedTimerManager`
2. Generate/store anonymous user ID
3. Pass baseUrl and creationId to timer manager
4. Test timer persistence across contexts
