---
name: webostv-luna-services
description: webOS TV Luna Service API and webOSTV.js — calling system services (audio, connection, database, application manager, settings, DRM, etc.), writing JS background services, and using webOS.service.request. Use when interacting with TV system APIs, checking network status, storing persistent data, controlling volume, launching other apps, or writing a background JS service.
---

# webOS TV Luna Service API & webOSTV.js

Sources:
- https://webostv.developer.lge.com/develop/references/luna-service-introduction
- https://webostv.developer.lge.com/develop/references/webostvjs-introduction

---

## webOSTV.js — calling services from the web app

Include the library (provided in the `webOSTVjs-x.x.x/` directory of any template):

```html
<script src="webOSTVjs-1.1.1/webOSTV.js"></script>
```

### Making a service call

```js
// Always assign to a variable — implicit objects may be GC'd before callback fires
var req = webOS.service.request("luna://com.webos.service.connectionmanager", {
  method: "getStatus",
  parameters: { subscribe: true },

  onSuccess: function(res) {
    console.log("Connected:", res.isInternetConnectionAvailable);
  },

  onFailure: function(err) {
    console.error("Error:", err.errorCode, err.errorText);
  },

  onComplete: function(res) {
    // Called on both success and failure
  },

  subscribe: true,      // Keep subscription alive; callback fires on changes
  resubscribe: true     // Auto-resubscribe after failure
});

// Cancel subscription when done
req.cancel();
```

### webOS API surface

| Namespace | Description |
|-----------|-------------|
| `webOS.service.request()` | Make Luna service calls |
| `webOS.deviceInfo()` | Device model info |
| `webOS.fetchAppInfo()` | Read own appinfo.json at runtime |
| `webOS.fetchAppRootPath()` | Get app's root path |
| `webOSDev.KEYS` | Key code constants (remote control) |
| `webOSDev.DRM` | DRM management |

---

## Available Luna Service APIs

URI pattern: `luna://service.name/methodName`

| API | URI | Key uses |
|-----|-----|---------|
| Application Manager | `luna://com.webos.applicationManager` | Launch/close apps, list installed apps |
| Activity Manager | `luna://com.webos.service.activitymanager` | Schedule background work |
| Audio | `luna://com.webos.audio` | Volume get/set, mute |
| Connection Manager | `luna://com.webos.service.connectionmanager` | Network status (Wi-Fi, wired, internet) |
| Database | `luna://com.webos.mediadb` | Persistent JSON storage |
| Device Unique ID | `luna://com.webos.service.sm` | Device fingerprint |
| DRM | `luna://com.webos.service.drm` | DRM client lifecycle |
| Magic Remote | `luna://com.webos.service.mrcu` | Pointer/sensor info |
| Settings Service | `luna://com.webos.settingsservice` | Read system settings |
| System Service | `luna://com.webos.service.systemservice` | System time |
| TV Device Info | `luna://com.webos.service.tv.systemproperty` | Model, firmware, OTA ID |
| BLE GATT | `luna://com.webos.service.blegatt` | Bluetooth LE (webOS TV 24+) |

### API availability notes

- BLE GATT: webOS TV 24+ only
- Keymanager3: webOS TV 24+ only
- Camera: deprecated since webOS TV 4.x
- Magic Remote: full support on webOS TV 24+; partial on older versions
- Emulator does not support DRM, BLE GATT, Keymanager3, or Magic Remote

### Simulator support

**Most Luna APIs do not work in the simulator** — calls fail silently or return errors. Confirmed non-functional in simulator:
- `luna://com.webos.service.systemservice/clock/getTime` → `"Unknown method"`
- DRM, Magic Remote, Camera

Always guard with `onFailure` and test Luna-dependent features on a real device. The simulator is only reliable for UI layout, key handling, and lifecycle events.

---

## Common service call examples

### Check internet connection

```js
webOS.service.request("luna://com.webos.service.connectionmanager", {
  method: "getStatus",
  parameters: {},
  onSuccess: function(res) {
    if (res.isInternetConnectionAvailable) {
      // online
    }
  },
  onFailure: function(err) { console.error(err); }
});
```

### Launch another app

```js
webOS.service.request("luna://com.webos.applicationManager", {
  method: "launch",
  parameters: {
    id: "com.domain.otherapp",
    params: { someKey: "someValue" }
  },
  onSuccess: function(res) { console.log("Launched", res); },
  onFailure: function(err) { console.error(err); }
});
```

### Get system setting

```js
webOS.service.request("luna://com.webos.settingsservice", {
  method: "getSystemSettings",
  parameters: { keys: ["country"] },
  onSuccess: function(res) {
    console.log("Country:", res.settings.country);
  },
  onFailure: function(err) { console.error(err); }
});
```

---

## Writing a JS background service

A JS service runs as a Node.js process in the background, accessible via Luna bus. It can run even when the app UI is not active.

### Minimal service (`helloworld_service.js`)

```js
var Service = require('webos-service');
var service = new Service('com.domain.app.myservice');

service.register('hello', function(message) {
  var input = message.payload.input || 'world';
  message.respond({
    returnValue: true,
    greeting: 'Hello, ' + input + '!'
  });
});
```

### Call the JS service from the web app

```js
webOS.service.request("luna://com.domain.app.myservice", {
  method: "hello",
  parameters: { input: "TV" },
  onSuccess: function(res) {
    console.log(res.greeting); // "Hello, TV!"
  },
  onFailure: function(err) { console.error(err); }
});
```

### services.json (required)

```json
{
  "id": "com.domain.app.myservice",
  "description": "My background service",
  "services": [{ "name": "com.domain.app.myservice" }]
}
```

Package together: `ares-package ./myApp ./myService`

---

## Key rules

- Always hold a reference to `webOS.service.request()` results — the GC can destroy anonymous request objects before callbacks fire.
- Use `subscribe: true` + `resubscribe: true` for subscriptions that must stay alive (e.g. network status, audio level).
- Cancel subscriptions with `req.cancel()` when the app is hidden (use `visibilitychange` hook).
- Service IDs must be sub-domains of the app ID.
