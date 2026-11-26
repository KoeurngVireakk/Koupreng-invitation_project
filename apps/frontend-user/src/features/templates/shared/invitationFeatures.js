export const COUPLE_LAYOUTS = ['template-default', 'groom-left', 'bride-left', 'stacked', 'centered'];
export function invitationFeatureFields(source = {}) {
  return Object.fromEntries(['groomHonorific', 'brideHonorific', 'coupleLayout', 'familyGroupsV1', 'coupleMonogram', 'illustratedMap', 'cinematicIntro', 'informationScene', 'venueMapMode'].filter(key => Object.hasOwn(source, key)).map(key => [key, source[key]]));
}
export const usesFamilyLayout = content => Boolean(content.familyGroupsV1?.length || content.coupleMonogram?.enabled || (content.coupleLayout && content.coupleLayout !== 'template-default'));
export function safeDirections(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && ['google.com', 'www.google.com', 'maps.google.com', 'google.com.kh', 'www.google.com.kh', 'maps.google.com.kh', 'goo.gl', 'maps.app.goo.gl'].includes(url.hostname) && !url.username && !url.password ? url.href : ''; } catch { return ''; }
}
const ALLOWED_IMAGE_HOSTS = ['images.unsplash.com', 'plus.unsplash.com', 'koupreng.com', 'www.koupreng.com', 'cdn.koupreng.com'];
export function safeImageUrl(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes('\\') || [...trimmed].some((ch) => ch.charCodeAt(0) < 32)) return '';
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const dataMatch = /^data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=]+)$/i.exec(trimmed);
  if (dataMatch) return `data:image/${dataMatch[1].toLowerCase()};base64,${dataMatch[2]}`;
  const blobMatch = /^blob:(https?:\/\/[^/\s]+)\/([A-Za-z0-9-]+)$/.exec(trimmed);
  if (blobMatch && currentOrigin && blobMatch[1] === currentOrigin) return `blob:${currentOrigin}/${blobMatch[2]}`;
  if (/^\/(?![\\/])/.test(trimmed) && !trimmed.includes(':')) {
    try {
      const rel = new URL(trimmed, 'https://localhost.invalid');
      return rel.hostname === 'localhost.invalid' ? `${rel.pathname}${rel.search}` : '';
    } catch { return ''; }
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.username || parsed.password) return '';
    if (currentOrigin && parsed.origin === currentOrigin) return `${currentOrigin}${parsed.pathname}${parsed.search}`;
    const safeHost = parsed.protocol === 'https:' ? ALLOWED_IMAGE_HOSTS.find((host) => host === parsed.hostname) : undefined;
    return safeHost ? `https://${safeHost}${parsed.pathname}${parsed.search}` : '';
  } catch { return ''; }
}
