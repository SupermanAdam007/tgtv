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
- Camera Service: deprecated since webOS TV 4.x (see details below)
- Magic Remote: full support on webOS TV 24+; partial on older versions
- Emulator does not support DRM, BLE GATT, Keymanager3, or Magic Remote

---

## Camera Service (microphone/camera enumeration)

**URI:** `luna://com.webos.service.camera`
**Status:** Deprecated from webOS TV 4.0 onwards

This service enumerates connected camera and microphone devices. It provides device **information only** — not audio/video streaming.

### List connected devices

```js
webOS.service.request('luna://com.webos.service.camera', {
  method: 'getList',
  onSuccess: function(res) {
    // res.uriList = [
    //   { uri: 'camera://com.webos.service.camera/camera1', type: 'camera' },
    //   { uri: 'camera://com.webos.service.camera/mic1', type: 'microphone' }
    // ]
    console.log('Devices:', JSON.stringify(res.uriList));
  },
  onFailure: function(err) {
    console.error(err.errorCode, err.errorText);
  }
});
```

### Get device details

```js
webOS.service.request('luna://com.webos.service.camera', {
  method: 'getInfo',
  parameters: { uri: 'camera://com.webos.service.camera/mic1' },
  onSuccess: function(res) {
    // res.info = { name: 'BC600 Camera', type: 'microphone', builtin: true,
    //              details: { samplingRate: 'WB', codec: 'PCM' } }
    console.log('Mic info:', JSON.stringify(res.info));
  },
  onFailure: function(err) {
    console.error(err.errorCode, err.errorText);
  }
});
```

### Important limitation

The Camera Service only provides device enumeration and metadata. It does **not** provide audio capture or streaming. For actual microphone audio capture, see the `webostv-browser-capabilities` skill — `getUserMedia` is blocked for non-partner apps, and there is no Luna service alternative for real-time audio streaming in web apps.

---

## getUserMedia / WebRTC — not available

`getUserMedia()` and WebRTC are **blocked for standard web apps** on all webOS TV versions. This is a platform-level restriction, not a permission issue. No Luna service call or `appinfo.json` configuration can unlock it.

The Magic Remote microphone is handled by the OS voice recognition system and returns text only — there is no API to access raw audio from it.

For workaround architectures (streaming mic audio from a phone), see the `webostv-browser-capabilities` skill.

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
