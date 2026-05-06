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
| `apps/app1/` | Packaged | Hello World — dev environment baseline |
| `apps/stt-openrouter/` | Packaged | Mic → OpenRouter STT (`/api/v1/audio/transcriptions`) test |
| `apps/voice-fx/` | Packaged | Real-time microphone voice distortion (8 effects) |

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
npx ares-package ./apps/app1
npx ares-install --device myTV ./com.tgtv.app1_0.0.1_all.ipk
npx ares-launch --device myTV com.tgtv.app1

# STT test app (after `npx ares-package ./apps/stt-openrouter`)
npx ares-install --device myTV ./com.tgtv.sttopenrouter_0.0.1_all.ipk
npx ares-launch --device myTV com.tgtv.sttopenrouter

# Voice FX app (after `npx ares-package ./apps/voice-fx`)
npx ares-install --device myTV ./com.tgtv.voicefx_0.0.1_all.ipk
npx ares-launch --device myTV com.tgtv.voicefx
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
