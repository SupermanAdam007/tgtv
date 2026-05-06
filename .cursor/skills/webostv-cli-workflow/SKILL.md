---
name: webostv-cli-workflow
description: Complete webOS TV CLI (ares-*) command reference for creating, packaging, installing, launching, debugging, and monitoring apps on real TV devices and the simulator. Use when running ares commands, setting up a TV device, deploying an IPK, debugging with Web Inspector, or monitoring resource usage.
---

# webOS TV CLI Workflow

Source: https://webostv.developer.lge.com/develop/tools/cli-dev-guide

## Project setup (do this once per repo)

Install the CLI as a local devDependency — **do not install globally**. Cursor's bundled Node hijacks the PATH and global installs end up in the wrong prefix.

```bash
# .nvmrc
echo "22" > .nvmrc

# package.json — add to devDependencies
npm install --save-dev @webosose/ares-cli
```

Then run via `npx ares-*` or `./node_modules/.bin/ares-*`. Anyone who clones the repo just needs `nvm use && npm install`.

Verified working: `@webosose/ares-cli` **v2.4.0** on Node 22.

## Quick reference

| Command | Purpose |
|---------|---------|
| `ares-generate` | Scaffold app/service from template |
| `ares-package` | Build `.ipk` package |
| `ares-setup-device` | Register/manage target TV devices |
| `ares-install` | Install/remove `.ipk` on device |
| `ares-launch` | Launch/close app on device or simulator |
| `ares-inspect` | Open Web Inspector or Node Inspector |
| `ares-server` | Local web server for quick testing |
| `ares-novacom` | Get SSH key from TV (Developer Mode) |
| `ares-device` | Device info + CPU/memory monitoring |

---

## Create

```bash
# List templates
ares-generate --list

# Basic (packaged) app — note: template is "webapp" in v2.x, not "basic"
ares-generate -t webapp ./myApp

# Hosted web app
ares-generate -t hosted_webapp ./myApp

# JS service
ares-generate -t js_service -s com.domain.app.myservice ./myService

# Generate appinfo.json only
ares-generate -t webappinfo ./myApp
```

> v2.x template names differ from docs (which still show old CLI): use `webapp` not `basic`, `js_service` unchanged.

---

## Package

```bash
# Package app only
ares-package ./myApp

# Package app + JS service into one .ipk
ares-package ./myApp ./myService

# Package without minifying (for debugging)
ares-package --no-minify ./myApp

# Custom output directory
ares-package -o ./dist ./myApp

# Exclude directories/files
ares-package -e "tests" -e "*.md" ./myApp

# Inspect a package
ares-package -i ./com.domain.app_0.0.1_all.ipk
ares-package -I ./com.domain.app_0.0.1_all.ipk  # detailed
```

> App and JS service IDs must share the same domain prefix:
> - App: `com.domain.app`
> - Service: `com.domain.app.myservice`

---

## Device setup

Requires Developer Mode app installed on TV. See: https://webostv.developer.lge.com/develop/getting-started/developer-mode-app

```bash
# List known devices
ares-setup-device --list

# Add a TV (interactive)
ares-setup-device

# Add a TV (non-interactive)
ares-setup-device --add myTV --info "host=10.0.0.5" --info "port=9922" --info "username=prisoner"

# Modify device
ares-setup-device --modify myTV --info "host=10.0.0.10"

# Set default device
ares-setup-device --default myTV

# Search for webOS devices on LAN (SSDP)
ares-setup-device --search

# Get SSH private key from TV (run once after enabling Developer Mode)
ares-novacom --device myTV --getkey
```

Username conventions:
- `prisoner` — real TV device
- `developer` — emulator

---

## Install & manage

```bash
# Install IPK
ares-install --device myTV ./com.domain.app_0.0.1_all.ipk

# List installed apps
ares-install --device myTV --list

# Remove app
ares-install --device myTV --remove com.domain.app
```

---

## Launch & run

```bash
# Launch on device
ares-launch --device myTV com.domain.app

# Launch with parameters (received as webOSLaunch event detail)
ares-launch --device myTV com.domain.app --params "{'url':'https://example.com'}"

# Close app
ares-launch --device myTV --close com.domain.app

# List running apps
ares-launch --device myTV --running

# Quick test without packaging/installing (auto-reload on save)
ares-launch --device myTV --hosted ./myApp

# Local web server test
ares-server ./myApp
ares-server ./myApp --open    # opens browser
```

> `--hosted` does not support JS services. Use `.reloadignore` to exclude files from auto-reload.

### Simulator (v2.x CLI — no `-s` flag)

The `-s/--simulator` flag was **removed in v2.x**. Launch the simulator app directly:

```bash
open ~/Downloads/webOS_TV_6.0_Simulator_1.4.1/webOS_TV_6.0_Simulator_1.4.1.app
```

Then in the simulator: **File → Launch App** → select the app directory (where `appinfo.json` is).

- Auto-reload is built in — save any file and the app reloads immediately
- Click **Inspect** on the RCU panel to open Web Inspector (Chrome DevTools) for the running app
- Simulator versions available: **6.0, 22, 23, 24, 25, 26** — nothing older
- For webOS TV 3.x/4.x/5.x TVs: no simulator exists, test on the real device

---

## Debug

```bash
# Web Inspector for app (use Chromium-based browser)
ares-inspect --device myTV --app com.domain.app --open

# Node Inspector for JS service
ares-inspect --device myTV --service com.domain.app.myservice --open
```

Package without minify before debugging:
```bash
ares-package --no-minify ./myApp
ares-install --device myTV ./com.domain.app_0.0.1_all.ipk
```

### Log relay (simulator + AI-readable logs)

The simulator's Web Inspector opens in its own Chromium window (not Chrome with extensions), so external tooling can't attach to it. Instead, run a local log server and override `console` in the app to POST to it.

`scripts/log-server.js` — receives POSTs at `http://127.0.0.1:9999/log`, appends to `debug.log`:

```bash
node scripts/log-server.js   # or: npm run log
```

Console override to add at the top of the app's `<script>`:

```js
(function() {
  var LOG_URL = 'http://127.0.0.1:9999/log';
  ['log', 'warn', 'error', 'info'].forEach(function(level) {
    var orig = console[level].bind(console);
    console[level] = function() {
      orig.apply(console, arguments);
      var args = Array.prototype.slice.call(arguments).map(function(a) {
        return typeof a === 'object' ? JSON.stringify(a) : String(a);
      });
      var xhr = new XMLHttpRequest();
      xhr.open('POST', LOG_URL, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({ level: level, args: args, ts: new Date().toISOString() }));
    };
  });
})();
```

Safe to leave in production: silently fails if server is not running. Clear the log via `POST /clear`.

---

## Resource monitoring

```bash
# System-level CPU/memory snapshot
ares-device --device myTV --resource-monitor

# Periodic (every 1s) + save to CSV
ares-device --device myTV --resource-monitor --time-interval 1 --save resource.csv

# Process-level: all running apps
ares-device --device myTV --resource-monitor --list

# Process-level: specific app
ares-device --device myTV --resource-monitor --id-filter com.domain.app

# Device system info
ares-device --device myTV --system-info
```

---

## `.reloadignore` (for `--hosted` mode)

Create in app root to exclude files from auto-reload:
```
appinfo.json
tests
**/tmp
**/*.png
```
