import * as real from 'node:fs/promises';
import path from 'node:path';

const ioError = name => Object.assign(new Error(`injected ${name} failure`), {code: 'EIO'});

// fs object behaving like node:fs/promises except at one injected fault point, applied only to paths inside `home`.
// fail: mkdir | open | write | sync | rename-model | rename-lesson | rename-diagnostic.
//  open / write: a write-mode fs.open (or fs.writeFile) fails / its handle write fails.
//  sync: handle.sync / datasync of a write-mode handle fails.
//  rename-model / rename-lesson: fs.rename whose destination is the placed model (.mjs in models/) / lesson (lessons/).
export function placementFs(home, {fail} = {}) {
  const root = path.resolve(home) + path.sep;
  const inside = file => typeof file === 'string' && (path.resolve(file) + path.sep).startsWith(root);
  const writeMode = flags => typeof flags === 'string' && /[wax+]/.test(flags);
  const events = [];
  const trip = name => { events.push(name); throw ioError(name); };
  const fs = {...real};
  fs.mkdir = async (...args) => {
    if (fail === 'mkdir' && inside(args[0])) trip('mkdir');
    return real.mkdir(...args);
  };
  fs.writeFile = async (file, ...rest) => {
    if (inside(file) && (fail === 'open' || fail === 'write')) trip(fail);
    return real.writeFile(file, ...rest);
  };
  fs.rename = async (from, to) => {
    if (inside(to)) {
      const parent = path.basename(path.dirname(path.resolve(to)));
      if (fail === 'rename-model' && parent === 'models' && to.endsWith('.mjs')) trip('rename-model');
      if (fail === 'rename-lesson' && parent === 'lessons') trip('rename-lesson');
      if (fail === 'rename-diagnostic' && parent === 'diagnostics') trip('rename-diagnostic');
    }
    return real.rename(from, to);
  };
  fs.open = async (file, flags, ...rest) => {
    const writing = inside(file) && writeMode(flags);
    if (writing && fail === 'open') trip('open');
    const handle = await real.open(file, flags, ...rest);
    if (!writing) return handle;
    return new Proxy(handle, {
      get(target, key) {
        const value = Reflect.get(target, key);
        if (typeof value !== 'function') return value;
        if (typeof key === 'symbol') return value.bind(target);
        return async (...args) => {
          if (['write', 'writeFile', 'appendFile'].includes(key) && fail === 'write') trip('write');
          if (['sync', 'datasync'].includes(key) && fail === 'sync') trip('sync');
          return value.apply(target, args);
        };
      },
    });
  };
  return {fs, events};
}

// fs object that records the destination of every successful rename inside `home`, in call order.
export function renameRecordingFs(home) {
  const root = path.resolve(home) + path.sep;
  const renames = [];
  const fs = {...real};
  fs.rename = async (from, to) => {
    await real.rename(from, to);
    if ((path.resolve(to) + path.sep).startsWith(root)) renames.push(path.resolve(to));
  };
  return {fs, renames};
}
