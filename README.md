# tgtv

webOS TV app development workspace.

## Setup

```bash
nvm use
npm install
```

## Apps

| App | Type | Description |
|-----|------|-------------|
| `app1/` | Packaged | Hello World — dev environment baseline |
| `skyshowtime/` | Hosted | Redirects to skyshowtime.com |

## Dev workflow

**Simulator** — open manually, then File → Launch App → select app directory:

```bash
npm run simulator   # opens webOS TV 6.0 Simulator
```

**Log relay** — forwards `console.*` from the simulator to `debug.log`:

```bash
npm run log         # start server on localhost:9999
```

**Deploy to real TV** — requires Developer Mode app installed on the TV:

```bash
npx ares-novacom --device myTV --getkey
npx ares-package ./app1
npx ares-install --device myTV ./com.tgtv.app1_0.0.1_all.ipk
npx ares-launch --device myTV com.tgtv.app1
```

## Cursor skills

Project-scoped AI knowledge base in `.cursor/skills/`:

| Skill | Contents |
|-------|----------|
| `webostv-app-config` | App types, project structure, `appinfo.json` / `services.json` reference |
| `webostv-cli-workflow` | All `ares-*` commands, local CLI setup, simulator usage, log relay |
| `webostv-lifecycle-events` | App states, `webOSLaunch` / `webOSRelaunch` / `visibilitychange` patterns |
| `webostv-luna-services` | Luna Service API, `webOSTV.js`, writing JS background services |

## Notes

- webOS TV 6.0 simulator uses an old Chromium engine — modern SPAs using optional chaining (`?.`) will crash it. Use simulator 22+ for those.
- webOS TV 3.x (Chrome 38) cannot run modern streaming services due to DRM and JS compatibility limits.
- Most Luna Service APIs (system time, DRM, etc.) don't work in the simulator — test those on a real device.
