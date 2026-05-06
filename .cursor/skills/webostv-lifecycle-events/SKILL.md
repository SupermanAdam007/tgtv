---
name: webostv-lifecycle-events
description: webOS TV app lifecycle — states, transitions, launch/relaunch/visibility events, and the webOSLaunch, webOSRelaunch, visibilitychange event handler patterns. Use when implementing app state handling, receiving launch parameters, managing background/foreground transitions, or handling app termination.
---

# webOS TV App Lifecycle & Events

Sources:
- https://webostv.developer.lge.com/develop/getting-started/app-lifecycle
- https://webostv.developer.lge.com/develop/guides/app-lifecycle-management

Sample: https://github.com/webOS-TV-app-samples/AppLifecycle

---

## States

```
Not Launched ──webOSLaunch──► Launched (Foreground)
     ▲                              │
     │ terminate                    │ another app launches
     │                              ▼
     └──────────────────── Suspended (Background)
                                    │
                              webOSRelaunch or
                              visibilityChange(visible)
                                    │
                                    ▼
                           Launched (Foreground)
```

| State | Description |
|-------|-------------|
| **Not Launched** | App not running or terminated |
| **Launched** | Foreground, visible, active |
| **Suspended** | Background, hidden, may still execute |

---

## Events

### `webOSLaunch`

Fired when the app is first launched (from icon, CLI, or Application Manager).

```js
document.addEventListener('webOSLaunch', function(event) {
  const params = event.detail; // launch parameters object
  console.log('Launched with:', JSON.stringify(params));
  // Initialize app state here
}, true);
```

### `webOSRelaunch`

Fired when the app receives a launch request while already running (instead of restarting from scratch).

```js
document.addEventListener('webOSRelaunch', function(event) {
  const params = event.detail;
  console.log('Relaunched with:', JSON.stringify(params));

  // Do background work with params...

  // Then bring app to foreground (required when handlesRelaunch: true)
  if (typeof webOSSystem !== 'undefined') {
    webOSSystem.activate(); // webOS TV 5.0+
  } else {
    PalmSystem.activate();  // webOS TV 4.x and lower
  }
}, true);
```

> Set `"handlesRelaunch": true` in `appinfo.json` to control timing of foreground activation.  
> If `handlesRelaunch` is `false` (default), the system brings the app to foreground immediately — you still receive the event but activation is automatic.

### `visibilitychange`

Fired when the app is hidden (another app comes to foreground) or shown again.

```js
// Standard + webkit fallback pattern
var hidden, visibilityChange;
if (typeof document.hidden !== 'undefined') {
  hidden = 'hidden';
  visibilityChange = 'visibilitychange';
} else if (typeof document.webkitHidden !== 'undefined') {
  hidden = 'webkitHidden';
  visibilityChange = 'webkitvisibilitychange';
}

document.addEventListener(visibilityChange, function() {
  if (document[hidden]) {
    // App suspended — pause video, stop polling, release resources
    pausePlayback();
  } else {
    // App resumed — restore UI state
    resumePlayback();
  }
}, true);
```

---

## Launch parameters

Parameters passed via `ares-launch --params` or `Application Manager launch()` arrive in `event.detail`:

```bash
ares-launch --device myTV com.domain.app --params "{'url':'https://example.com'}"
```

```js
document.addEventListener('webOSLaunch', function(event) {
  const { url } = event.detail;
  if (url) loadContent(url);
}, true);
```

---

## Termination

Apps are terminated by:
- User clicks X (close) button in system UI (apps must NOT implement their own close button)
- `ares-launch --close com.domain.app`
- System resource pressure

There is no explicit "before terminate" event — use `visibilitychange` (hidden) as the last reliable hook to save state.

---

## What launches an app

The `com.webos.applicationManager` service handles all launches. Triggers:
- Launcher (user clicks icon)
- Another app calls `applicationManager.launch()`
- A JS service calls the Application Manager
- CLI: `ares-launch`
- Emulator: App Manager UI
