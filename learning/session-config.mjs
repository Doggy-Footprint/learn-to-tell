const idPattern = /^[a-z][a-z0-9-]{0,63}$/;
const fields = ['profileId', 'resultId', 'baseMapRevision', 'sequence', 'previousResultId'];

export function validateSessionConfig(value) {
  const errors = [];
  const add = (code, path) => errors.push({code, path});
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return {ok: false, errors: [{code: 'TYPE', path: ''}]};
  }
  for (const key of Object.keys(value)) if (!fields.includes(key)) add('UNKNOWN_FIELD', `/${key}`);
  for (const key of fields) {
    const path = `/${key}`;
    const item = value[key];
    if (!Object.hasOwn(value, key)) add('REQUIRED', path);
    else if (key === 'baseMapRevision' || key === 'sequence') {
      if (typeof item !== 'number') add('TYPE', path);
      else if (!Number.isSafeInteger(item)) add('VALUE', path);
      else if (item < 1) add('RANGE', path);
    } else if (key === 'previousResultId' && item === null) continue;
    else if (typeof item !== 'string') add('TYPE', path);
    else if (!idPattern.test(item)) add('VALUE', path);
  }
  if (!errors.some(error => error.path === '/sequence' || error.path === '/previousResultId') && (value.sequence === 1) !== (value.previousResultId === null)) add('STATE', '/previousResultId');
  errors.sort((a, b) => a.code < b.code ? -1 : a.code > b.code ? 1 : a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  if (errors.length) return {ok: false, errors};
  return {ok: true, value: Object.fromEntries(fields.map(key => [key, value[key]]))};
}
