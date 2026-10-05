import * as real from 'node:fs/promises';
import path from 'node:path';
import {layout, PROFILE} from './world.mjs';

const ioError = name => Object.assign(new Error(`injected ${name} failure`), {code: 'EIO'});

// fs object that behaves like node:fs/promises and records every call (name, first argument).
export function recordingFs() {
  const calls = [];
  const fs = {};
  for (const [key, value] of Object.entries(real)) {
    fs[key] = typeof value === 'function' ? (...args) => { calls.push({name: key, arg: args[0]}); return value(...args); } : value;
  }
  return {fs, calls};
}

// fail: mkdir | copy | open | write | sync | close | rename | prune.
// "copy" fails the backup write whichever way it is made (copyFile or an open) inside backups/.
// "open" fails only the map temp (a file beside map.json that is not map.json / map.json.corrupt-*).
// fail 'corrupt-copy': fails copyFile/open whose destination is map.json.corrupt-*.
// rmFail(absolutePath): rm/unlink of matching paths fails.
// readFail(absolutePath): EACCES (not ENOENT) on readFile/open/readdir of matching paths.
// afterSync(): runs once, right after the first fsync of a map temp finished (before the generation re-check).
export function faultFs(home, {fail, afterSync, readFail, rmFail, profileId = PROFILE} = {}) {
  const l = layout(home, profileId);
  const isMapTemp = p => typeof p === 'string' && path.dirname(path.resolve(p)) === l.dir && path.basename(p) !== 'map.json' && !path.basename(p).startsWith('map.json.corrupt-');
  const inBackups = p => typeof p === 'string' && path.dirname(path.resolve(p)) === l.backups;
  const isFinalBackup = p => inBackups(p) && /^map\.\d+\.json$/.test(path.basename(p));
  let synced = false;
  const events = [];
  const fs = {...real};
  const guard = (name, when, original) => async (...args) => {
    if (when(args)) { events.push(name === 'copy' && fail === 'corrupt-copy' ? 'corrupt-copy' : name); throw ioError(name); }
    return original(...args);
  };
  fs.mkdir = guard('mkdir', () => fail === 'mkdir', real.mkdir);
  const isCorrupt = p => typeof p === 'string' && path.dirname(path.resolve(p)) === l.dir && path.basename(p).startsWith('map.json.corrupt-');
  fs.copyFile = guard('copy', ([, dest]) => (fail === 'copy' && inBackups(dest)) || (fail === 'corrupt-copy' && isCorrupt(dest)), real.copyFile);
  fs.writeFile = guard('write', ([file]) => fail === 'write' && isMapTemp(file), real.writeFile);
  fs.rename = guard('rename', ([, dest]) => (fail === 'rename' && path.resolve(dest) === l.map) || (fail === 'copy' && isFinalBackup(path.resolve(dest))), real.rename);
  for (const name of ['rm', 'unlink']) fs[name] = guard('prune', ([file]) => (fail === 'prune' && isFinalBackup(file)) || (rmFail && typeof file === 'string' && rmFail(path.resolve(file))), real[name]);
  const readError = file => Object.assign(new Error('injected EACCES'), {code: 'EACCES', path: file});
  if (readFail) {
    fs.readFile = async (file, ...rest) => {
      if (typeof file === 'string' && readFail(path.resolve(file))) { events.push('read'); throw readError(file); }
      return real.readFile(file, ...rest);
    };
    fs.readdir = async (dir, ...rest) => {
      if (typeof dir === 'string' && readFail(path.resolve(dir))) { events.push('read'); throw readError(dir); }
      return real.readdir(dir, ...rest);
    };
  }
  fs.open = async (file, ...rest) => {
    if (readFail && typeof file === 'string' && readFail(path.resolve(file))) { events.push('read'); throw readError(file); }
    const tempFile = isMapTemp(file);
    if (fail === 'corrupt-copy' && isCorrupt(file)) { events.push('corrupt-copy'); throw ioError('corrupt-copy'); }
    if (fail === 'open' && tempFile) { events.push('open'); throw ioError('open'); }
    if (fail === 'copy' && inBackups(file)) { events.push('copy'); throw ioError('copy'); }
    const handle = await real.open(file, ...rest);
    if (!tempFile) return handle;
    return new Proxy(handle, {
      get(target, key) {
        const value = Reflect.get(target, key);
        if (typeof value !== 'function') return value;
        if (typeof key === 'symbol') return value.bind(target);
        return async (...args) => {
          if ((key === 'write' || key === 'writeFile' || key === 'appendFile') && fail === 'write') { events.push('write'); throw ioError('write'); }
          if ((key === 'sync' || key === 'datasync') && fail === 'sync') { events.push('sync'); throw ioError('sync'); }
          const out = await value.apply(target, args);
          if ((key === 'sync' || key === 'datasync') && afterSync && !synced) { synced = true; await afterSync(); }
          if (key === 'close' && fail === 'close') { events.push('close'); throw ioError('close'); }
          return out;
        };
      }
    });
  };
  return {fs, events};
}
