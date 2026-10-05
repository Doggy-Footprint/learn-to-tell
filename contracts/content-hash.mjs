const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value !== null && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
  : JSON.stringify(value);

export const canonicalContent = result => canonical(Object.fromEntries(Object.entries(result).filter(([key]) => key !== 'resultId' && key !== 'contentHash')));

export async function computeContentHash(result) {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalContent(result)));
  return 'sha256-' + Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
