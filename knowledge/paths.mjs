import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export const validProfileId = value => typeof value === 'string' && /^[a-z][a-z0-9-]{0,63}$/.test(value);

export const context = opts => ({fs: opts?.fs ?? fsp, home: opts?.home ?? process.env.LEARN_TO_TELL_HOME ?? os.homedir()});

// Returns null for an invalid id so callers report PROFILE before any fs call.
export const profileDir = (profileId, opts) => validProfileId(profileId)
  ? path.join(context(opts).home, '.learn-to-tell', 'profiles', profileId)
  : null;
