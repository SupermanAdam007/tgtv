---
name: webostv-app-config
description: webOS TV app structure and configuration — packaged vs hosted app types, project directory layout, appinfo.json, services.json, packageinfo.json, and app icon requirements. Use when starting a new webOS TV app, choosing between packaged and hosted apps, configuring app metadata, setting up a JS service, defining relaunch behavior, or checking required fields for packaging.
---

# webOS TV App Structure & Configuration

Sources:
- https://webostv.developer.lge.com/develop/references/appinfo-json
- https://webostv.developer.lge.com/develop/getting-started/app-template
- https://webostv.developer.lge.com/develop/getting-started/web-app-types

---

## App types

| Type | How it works | Best when |
|------|-------------|-----------|
| **Basic (packaged)** | All resources bundled in `.ipk`, installed on device | Stable apps, offline-capable, no external dependency |
| **Hosted** | Local stub app redirects to remote URL at launch | Frequent content updates without pushing new installs |

### Packaged app structure
```
myApp/
  webOSTVjs-x.x.x/   # webOSTV.js library (Luna service calls)
  appinfo.json        # Required metadata
  icon.png            # 80×80 px
  largeicon.png       # 130×130 px
  index.html          # Main entry point
```

### Hosted app structure
```
myApp/
  appinfo.json
  icon.png
  largeicon.png
  index.html          # Contains only the redirect to the remote server
```

Hosted redirect options:
```js
// JavaScript redirect
location.href = 'https://www.example.com/index.html';
```
```html
<!-- Meta refresh redirect -->
<meta http-equiv="refresh" content="0;url=https://www.example.com/index.html" />
```

Create either type: `ares-generate -t basic ./myApp` or `ares-generate -t hosted_webapp ./myApp`

---

## appinfo.json

Required in every app. Must exist at app root. Used by the system to identify, install, and launch the app.

### Minimal example

```json
{
  "id": "com.domain.app",
  "version": "0.0.1",
  "vendor": "My Company",
  "type": "web",
  "main": "index.html",
  "title": "My App",
  "icon": "icon.png",
  "largeIcon": "largeIcon.png"
}
```

### Key fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | App ID in reverse-domain format (`com.domain.app`). Latin chars only. |
| `version` | string | Yes | Semantic version string (`"0.0.1"`). |
| `type` | string | Yes | Always `"web"` for web apps. |
| `main` | string | Yes | Relative path to the app's main HTML file (default: `"index.html"`). |
| `title` | string | Yes | Display name shown in the launcher. |
| `icon` | string | Yes | Path to small icon (80×80 px PNG). |
| `largeIcon` | string | Yes | Path to large icon (130×130 px PNG). |
| `vendor` | string | No | Developer/company name. |
| `handlesRelaunch` | boolean | No | See lifecycle section below. Default: `false`. |
| `bgColor` | string | No | Background color while app loads (e.g. `"#000000"`). |
| `splashBackground` | string | No | Path to splash screen image. |
| `resolution` | string | No | App resolution. Defaults to `"1920x1080"`. |
| `transparent` | boolean | No | Allow transparent background. Default: `false`. |
| `requiredPermissions` | string[] | No | Luna service permissions. See section below. |
| `trustLevel` | string | No | Runtime mode. See section below. Default: `"default"`. |
| `inspectable` | boolean | No | Allow Chrome DevTools debugging. Default: `true` for Developer Mode apps, `false` otherwise. |

### `requiredPermissions`

Declares which Luna service ACG (Access Control Group) permissions the app needs. These are **Luna service permissions only** — there is no permission for browser APIs like `getUserMedia`, WebRTC, or camera/microphone capture.

Common values:

| Permission | Grants access to |
|------------|-----------------|
| `time.query` | System time service |
| `activity.operation` | Activity manager |
| `applications.operation` | Application manager (launch/close other apps) |
| `settings.read` | Read system settings |
| `deviceid.query` | Device unique ID |

There is **no** `media.capture`, `audiocapture`, `microphone`, or similar permission. Microphone/camera access via `getUserMedia` is blocked at the platform level for non-partner apps regardless of permissions. See the `webostv-browser-capabilities` skill for details.

### `trustLevel`

Determines the application runtime mode. For user-installed apps, only two values are supported:

| Value | Effect |
|-------|--------|
| `"default"` | Normal mode. Full API access including `window.PalmServiceBridge`. |
| `"netcast"` | **Restricted** mode. `window.PalmServiceBridge` is missing. `window.launchParams` replaces `window.PalmSystem.launchParams`. Custom User-Agent and CORS whitelist options become available via `vendorExtensions`. |

`"netcast"` **limits** API access — it does not grant additional permissions. Use `"default"` unless you specifically need netcast-mode features (custom User-Agent, cross-domain CORS bypass).

### `handlesRelaunch` behavior

| Value | Effect |
|-------|--------|
| `false` (default) | webOS brings app to foreground immediately on relaunch |
| `true` | App receives `webOSRelaunch` event in background, must call `webOSSystem.activate()` to become visible |

> Use `webOSSystem.activate()` on webOS TV 5.0+. `PalmSystem.activate()` works on 4.x and lower (still supported for compatibility but deprecated).

### Icon requirements

| File | Size | Notes |
|------|------|-------|
| `icon.png` | 80×80 px | Used in launcher list view |
| `largeIcon.png` | 130×130 px | Used in launcher grid/featured view |

---

## services.json

Defines the JS services a package exposes on the webOS bus.

```json
{
  "id": "com.domain.app.service",
  "description": "My JS Service",
  "services": [
    {
      "name": "com.domain.app.service"
    }
  ]
}
```

- Service ID must be a sub-domain of the app ID
- Lives in the service directory alongside `package.json` and the service JS file

---

## package.json (for JS services)

Standard Node.js `package.json`. The `main` field points to the service entry point.

```json
{
  "name": "com.domain.app.service",
  "version": "1.0.0",
  "description": "My service",
  "main": "helloworld_service.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "BSD"
}
```

---

## packageinfo.json

Used when packaging an app with one or more JS services. Usually auto-generated from `appinfo.json` if not provided.

```json
{
  "id": "com.domain",
  "version": "0.0.1"
}
```

Generate from template: `ares-generate -t packageinfo ./myApp`

---

## Naming rules

- App IDs: reverse-domain, lowercase, Latin alphanumeric + hyphens + dots (e.g. `com.company.appname`)
- Service IDs: must be a sub-domain of the app ID (e.g. `com.company.appname.myservice`)
- File names: Latin letters only — no non-ASCII characters

## Samples

- https://github.com/webOS-TV-app-samples
