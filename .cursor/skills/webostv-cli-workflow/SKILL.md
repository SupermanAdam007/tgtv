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
npm install --save-dev @webos-tools/cli
```

Then run via `./node_modules/.bin/ares-*`. Anyone who clones the repo just needs `nvm use && npm install`.

### Which CLI package to use

| Package | Works with | Notes |
|---------|-----------|-------|
| **`@webos-tools/cli`** | Real LG TVs + simulators | **Use this one.** Official LG package, `tv` profile, has `ares-novacom`. |
| `@webosose/ares-cli` | webOS OSE devices only | **Do NOT use for real LG TVs.** Uses `ose` profile, missing `ares-novacom`, install/launch fails with `/media/developer/temp: Permission denied` on real TVs because it uses OSE filesystem paths. |

Verified working: `@webos-tools/cli` **v3.2.3** on Node 22.

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

# Basic (packaged) app
ares-generate -t webapp ./myApp

# Hosted web app
ares-generate -t hosted_webapp ./myApp

# JS service
ares-generate -t js_service -s com.domain.app.myservice ./myService

# Generate appinfo.json only
ares-generate -t webappinfo ./myApp
```

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

## Device setup — real LG TV

Requires Developer Mode app installed on TV. See: https://webostv.developer.lge.com/develop/getting-started/developer-mode-app

### Step 1: Add the device

```bash
ares-setup-device --add myTV --info "host=TV_IP_ADDRESS" --info "port=9922" --info "username=prisoner"
```

- `host` — TV's IP address (shown in the Developer Mode app)
- `port` — always `9922` for real TVs
- `username` — always `prisoner` for real TVs (`developer` for emulator only)

### Step 2: Get the SSH key

On the TV's Developer Mode app, make sure **Key Server** is toggled **ON**. Note the **Passphrase** shown (e.g. `A1B2C3`).

```bash
ares-novacom --device myTV --getkey
# Enter the passphrase from the TV when prompted
```

This downloads the private key to `~/.ssh/myTV_webos`.

### Step 3: Fix the device config (required — getkey doesn't always update it)

The key file must be referenced in `~/.webos/tv/novacom-devices.json`. After `--getkey`, verify the myTV entry has:

```json
{
    "name": "myTV",
    "host": "TV_IP_ADDRESS",
    "port": 9922,
    "username": "prisoner",
    "profile": "tv",
    "type": "starfish",
    "files": "stream",
    "default": false,
    "privateKey": {
        "openSsh": "myTV_webos"
    },
    "passphrase": "PASSPHRASE_FROM_TV"
}
```

Key points:
- `privateKey.openSsh` must be a **relative filename** (not an absolute path) — the CLI resolves it from `~/.webos/tv/`
- Copy the key file into the config directory: `cp ~/.ssh/myTV_webos ~/.webos/tv/myTV_webos`
- `passphrase` must match the value shown on the TV's Developer Mode app
- `profile` must be `"tv"` and `type` must be `"starfish"` for real LG TVs

### Step 4: Verify connection

```bash
ares-device --device myTV --system-info
```

Expected output (varies by model):
```
modelName : OLED55C3PUA
sdkVersion : 8.3.0
firmwareVersion : 04.30.60
boardType : O22O
```

### Other device commands

```bash
# List known devices
ares-setup-device --list

# Modify device
ares-setup-device --modify myTV --info "host=10.0.0.10"

# Set default device
ares-setup-device --default myTV

# Search for webOS devices on LAN (SSDP)
ares-setup-device --search
```

### Troubleshooting SSH connection

| Error | Cause | Fix |
|-------|-------|-----|
| `Private key file or password does not exist` | Key not in `~/.webos/tv/` or wrong path in config | Copy key file to `~/.webos/tv/` and use relative filename in `openSsh` |
| `All configured authentication methods failed` | Key not downloaded or passphrase wrong | Re-run `ares-novacom --getkey`, check passphrase matches TV |
| `/media/developer/temp: Permission denied` | Using `@webosose/ares-cli` instead of `@webos-tools/cli` | Switch to `@webos-tools/cli` |
| `no matching host key type found. Their offer: ssh-rsa` | macOS SSH rejects old key type | Only affects raw `ssh` command — the ares-cli uses Node ssh2 library which handles `ssh-rsa` fine |

### Developer Mode session expiry

- Sessions expire (default 50 hours). Click **Extend Session Time** in the Developer Mode app.
- When a session expires, the TV rejects SSH connections. Re-enable Developer Mode and re-run `ares-novacom --getkey`.

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

### Full deploy cycle (package → install → launch)

```bash
ares-package ./apps/myApp && \
ares-install --device myTV ./com.domain.app_0.0.1_all.ipk && \
ares-launch --device myTV com.domain.app
```

### Simulator

Launch the simulator app directly:

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

### ares-inspect session behavior

`ares-inspect` opens a long-running WebSocket proxy to the TV. Each invocation allocates a **new local port** and returns a unique DevTools URL:

```
Application Debugging - http://localhost:65465/devtools/devtools.html?experiments=true&ws=localhost:65465/devtools/page/E7FA5EE3-...
```

Key behaviors:
- **Session dies on app relaunch** — when you `ares-install` + `ares-launch` a new version, the old inspector session terminates with `target_closed`. You must re-run `ares-inspect` to get a new URL.
- **Port changes every time** — don't bookmark inspector URLs; always use the URL printed by the latest `ares-inspect` invocation.
- **The command blocks** — `ares-inspect` runs until the session ends. Run it in the background or a separate terminal.
- **Typical deploy+debug cycle:**
  ```bash
  # Terminal 1: deploy
  ares-package ./apps/myApp && \
  ares-install --device myTV ./com.domain.app_0.0.1_all.ipk && \
  ares-launch --device myTV com.domain.app

  # Terminal 2: attach inspector (re-run after each deploy)
  ares-inspect --device myTV --app com.domain.app
  ```

### Remote debugging with browser-control

When the `browser-control` skill is available, you can automate Web Inspector interaction:

1. Navigate to the DevTools URL with `tiny-browser navigate`
2. DevTools uses shadow DOM — standard `detect_boxes` returns empty; use screenshot coordinates or keyboard shortcuts instead
3. Press `Escape` to toggle the console drawer (most useful for reading logs)
4. Type JS expressions in the console prompt to evaluate code on the TV
5. Old DevTools UI (webOS 3.x) is harder to automate — prefer the console log relay approach for ongoing debugging

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
