#!/usr/bin/env node
// Usage: npm run deploy -- ./apps/voice-fx
//        npm run deploy -- ./apps/voice-fx --inspect

var fs = require('fs');
var path = require('path');
var child = require('child_process');

var args = process.argv.slice(2);
var appDir = args.find(function(a) { return !a.startsWith('--'); });
var doInspect = args.includes('--inspect');

if (!appDir) {
  console.error('Usage: npm run deploy -- ./apps/<app-name> [--inspect]');
  process.exit(1);
}

appDir = path.resolve(appDir);
var infoPath = path.join(appDir, 'appinfo.json');

if (!fs.existsSync(infoPath)) {
  console.error('No appinfo.json found in ' + appDir);
  process.exit(1);
}

var info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
var id = info.id;
var version = info.version;
var ipk = id + '_' + version + '_all.ipk';
var bin = path.join(__dirname, '..', 'node_modules', '.bin');

function run(cmd, args) {
  console.log('\n> ' + cmd + ' ' + args.join(' '));
  var result = child.spawnSync(path.join(bin, cmd), args, { stdio: 'inherit' });
  if (result.status !== 0) {
    console.error('\n' + cmd + ' failed (exit ' + result.status + ')');
    process.exit(result.status || 1);
  }
}

run('ares-package', [appDir]);
run('ares-install', ['--device', 'myTV', './' + ipk]);
run('ares-launch', ['--device', 'myTV', id]);

console.log('\nDeployed ' + id + ' v' + version);

if (doInspect) {
  console.log('Attaching inspector...\n');
  child.spawn(path.join(bin, 'ares-inspect'), ['--device', 'myTV', '--app', id], { stdio: 'inherit' });
}
