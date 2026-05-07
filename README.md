# tgtv

webOS TV app development workspace.

## Setup

```bash
nvm use
npm install
```

Uses `@webos-tools/cli` (not `@webosose/ares-cli` — the OSE version fails on real LG TVs).

## Apps

| App | Type | Description |
|-----|------|-------------|
| `apps/app1/` | Packaged | Hello World — dev environment baseline |
| `apps/stt-openrouter/` | Packaged | Mic → OpenRouter STT (`/api/v1/audio/transcriptions`) test |
| `apps/voice-fx/` | Packaged | Real-time microphone voice distortion (8 effects) |

## Dev workflow

### Simulator

Open manually, then File → Launch App → select app directory:

```bash
npm run simulator   # opens webOS TV 6.0 Simulator
```

### Log relay

Forwards `console.*` from the simulator to `debug.log`:

```bash
npm run log         # start server on localhost:9999
```

### Deploy to real TV

Requires Developer Mode app installed on the TV with **Dev Mode Status** and **Key Server** both ON.

**First time — register the TV and get the SSH key:**

```bash
# Add the TV (use IP from Developer Mode app)
./node_modules/.bin/ares-setup-device --add myTV \
  --info "host=TV_IP_ADDRESS" --info "port=9922" --info "username=prisoner"

# Download SSH key (enter passphrase from Developer Mode app when prompted)
./node_modules/.bin/ares-novacom --device myTV --getkey

# Copy key to CLI config dir (getkey saves to ~/.ssh/ but CLI looks in ~/.webos/tv/)
cp ~/.ssh/myTV_webos ~/.webos/tv/myTV_webos

# Verify connection
./node_modules/.bin/ares-device --device myTV --system-info
```

After `--getkey`, verify `~/.webos/tv/novacom-devices.json` has the correct `privateKey` and `passphrase` fields — see the CLI skill for the exact format.

**Package, install, launch:**

```bash
# Voice FX
./node_modules/.bin/ares-package ./apps/voice-fx
./node_modules/.bin/ares-install --device myTV ./com.tgtv.voicefx_0.0.1_all.ipk
./node_modules/.bin/ares-launch --device myTV com.tgtv.voicefx

# STT OpenRouter
./node_modules/.bin/ares-package ./apps/stt-openrouter
./node_modules/.bin/ares-install --device myTV ./com.tgtv.sttopenrouter_0.0.1_all.ipk
./node_modules/.bin/ares-launch --device myTV com.tgtv.sttopenrouter

# Hello World
./node_modules/.bin/ares-package ./apps/app1
./node_modules/.bin/ares-install --device myTV ./com.tgtv.app1_0.0.1_all.ipk
./node_modules/.bin/ares-launch --device myTV com.tgtv.app1
```

## Cursor skills

Project-scoped AI knowledge base in `.cursor/skills/`:

| Skill | Contents |
|-------|----------|
| `webostv-app-config` | App types, project structure, `appinfo.json` / `services.json` reference |
| `webostv-cli-workflow` | CLI setup, real TV deployment (SSH key gotchas), simulator usage, log relay |
| `webostv-lifecycle-events` | App states, `webOSLaunch` / `webOSRelaunch` / `visibilitychange` patterns |
| `webostv-luna-services` | Luna Service API, `webOSTV.js`, writing JS background services |

## Notes

- **CLI package**: Use `@webos-tools/cli`, not `@webosose/ares-cli`. The OSE version uses wrong filesystem paths and fails with `Permission denied` on real LG TVs.
- **SSH key setup**: `ares-novacom --getkey` downloads the key to `~/.ssh/` but the CLI looks in `~/.webos/tv/`. Copy the key and ensure `novacom-devices.json` uses a relative filename (not absolute path).
- **Target TV**: webOS TV 3.x (Chrome 38). All apps must use ES5 syntax — no optional chaining, no `const`/`let`, no arrow functions, no template literals.
- **Simulator**: webOS TV 6.0 simulator uses an old Chromium engine — optional chaining (`?.`) crashes it. Use simulator 22+ for modern syntax. Inline SVGs need `xmlns` attribute to render.
- **Simulator limits**: No microphone input, most Luna Service APIs fail silently. Test audio/mic features on the real TV.
