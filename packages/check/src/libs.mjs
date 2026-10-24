import { issue } from './issue.mjs';

const PACKAGES = ['vega', 'vega-lite'];
const VEGA_SEGMENT = /^(vega|vega-lite)([@.].*)?$/;

function splitPkg(segment) {
  const at = segment.indexOf('@');
  return at === -1 ? { pkg: segment, version: '' } : { pkg: segment.slice(0, at), version: segment.slice(at + 1) };
}

export function classifySrc(src) {
  let url;
  try {
    url = new URL(src);
  } catch {
    url = null;
  }
  if (url && url.protocol === 'https:') {
    const segs = url.pathname.split('/').slice(1);
    if (url.host === 'cdnjs.cloudflare.com' && segs.length >= 5 && segs[0] === 'ajax' && segs[1] === 'libs') {
      if (PACKAGES.includes(segs[2]) && segs[3] !== '' && segs.slice(4).join('/') !== '') {
        return { kind: 'recognized', pkg: segs[2], version: segs[3] };
      }
    }
    if ((url.host === 'cdn.jsdelivr.net' && segs[0] === 'npm') || url.host === 'unpkg.com') {
      const first = url.host === 'unpkg.com' ? segs[0] : segs[1];
      if (first !== undefined) {
        const { pkg, version } = splitPkg(first);
        if (PACKAGES.includes(pkg)) return { kind: 'recognized', pkg, version };
      }
    }
  }
  const path = url ? url.pathname : src.split(/[?#]/)[0];
  if (path.split('/').some((s) => VEGA_SEGMENT.test(s))) return { kind: 'unrecognized' };
  return { kind: 'ignored' };
}

export function checkLibraries(scripts, chartCount, pinned) {
  const errors = [];
  const present = new Set();
  for (const src of scripts) {
    const c = classifySrc(src);
    if (c.kind === 'recognized') {
      present.add(c.pkg);
      if (c.version !== pinned[c.pkg]) {
        errors.push(
          issue('lib-version', `${c.pkg} must be loaded at version ${pinned[c.pkg]}, found "${c.version}"`, {
            src,
            expected: pinned[c.pkg],
            actual: c.version,
          }),
        );
      }
    } else if (c.kind === 'unrecognized') {
      errors.push(
        issue('lib-source', 'Vega script must come from cdnjs, jsDelivr or unpkg in a recognized form', { src }),
      );
    }
  }
  if (chartCount >= 1) {
    for (const pkg of PACKAGES) {
      if (!present.has(pkg)) {
        errors.push(
          issue('lib-missing', `page has a chart but no recognized <script src> for ${pkg}@${pinned[pkg]}`, {
            actual: pkg,
          }),
        );
      }
    }
  }
  return errors;
}
