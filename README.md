# tgtv

webOS TV apps targeting LG webOS 3.x (Chrome 38). ES5 only.

## Setup

```bash
nvm use && npm install
```

## Apps

| App | ID | Description |
|-----|----|-------------|
| `apps/app1` | `com.tgtv.app1` | Hello World baseline |
| `apps/stt-openrouter` | `com.tgtv.sttopenrouter` | Speech-to-text via OpenRouter API |
| `apps/voice-fx` | `com.tgtv.voicefx` | Real-time voice distortion (8 effects) |
| `apps/netscout` | `com.tgtv.netscout` | Internet speed test + LAN device discovery |

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run deploy -- ./apps/<name>` | Package + install + launch on TV |
| `npm run deploy -- ./apps/<name> --inspect` | Same + attach Web Inspector |
| `npm run simulator` | Open webOS TV 6.0 simulator |
| `npm run log` | Start console log relay (`localhost:9999` → `debug.log`) |
| `npm run devices` | List registered TV devices |

## TV setup (first time)

```bash
# Register TV (IP from Developer Mode app on TV)
./node_modules/.bin/ares-setup-device --add myTV \
  --info "host=TV_IP" --info "port=9922" --info "username=prisoner"

# Get SSH key (enter passphrase from Developer Mode app)
./node_modules/.bin/ares-novacom --device myTV --getkey

# Copy key to CLI config dir
cp ~/.ssh/myTV_webos ~/.webos/tv/myTV_webos

# Verify
./node_modules/.bin/ares-device --device myTV --system-info
```

After `--getkey`, check that `~/.webos/tv/novacom-devices.json` has the correct `privateKey.openSsh` (relative filename) and `passphrase` fields.

## Key constraints

- **CLI**: Use `@webos-tools/cli`, not `@webosose/ares-cli` (OSE version fails on real TVs)
- **JS**: ES5 only — no `let`/`const`, arrow functions, template literals, destructuring
- **getUserMedia / WebRTC**: Blocked on all webOS TV versions for non-partner apps
- **Web Audio**: Works but ~500ms latency, no `createMediaElementSource()`
- **Simulator**: webOS 6.0 only — doesn't catch Chrome 38 issues or Luna service failures

## Cursor AI context

Skills (`.cursor/skills/`) and commands (`.cursor/commands/`) encode platform knowledge and workflows. Use `/new-app` command to scaffold a new app with the full deploy+debug loop.
