// Static checks that a page will run under the extension CSP (script-src 'self'): MV3 silently refuses
// inline <script>, inline event handlers, javascript: URLs and remote scripts, so the build fails on them instead.

const SCRIPT_TAG = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
const EVENT_ATTR = /<[a-z][^>]*\s(on[a-z]+)\s*=/gi;
const JS_URL = /\s(?:href|src|action)\s*=\s*["']?\s*javascript:/i;
const REMOTE = /<(?:script|link)\b[^>]*\s(?:src|href)\s*=\s*["']?(?:https?:)?\/\//i;

/**
 * @param {string} html
 * @returns {string[]} problems (empty when the page is CSP-safe)
 */
export function findCspProblems(html) {
  const problems = [];
  for (const m of html.matchAll(SCRIPT_TAG)) {
    const attrs = m[1] ?? '';
    const body = (m[2] ?? '').trim();
    const isData = /\stype\s*=\s*["']?(application\/(ld\+)?json|importmap)/i.test(attrs);
    if (!/\ssrc\s*=/.test(attrs) && body && !isData) problems.push('inline <script>');
  }
  for (const m of html.matchAll(EVENT_ATTR)) problems.push(`inline handler ${m[1]}=`);
  if (JS_URL.test(html)) problems.push('javascript: URL');
  if (REMOTE.test(html)) problems.push('remote script or stylesheet');
  return problems;
}
