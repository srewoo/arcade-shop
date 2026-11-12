import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

/** Production builds get a strict CSP: no remote hosts, no inline script, no eval. Dev (HMR) is left alone. */
const csp: Plugin = {
  name: 'skyskirmish-csp',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: {
        'http-equiv': 'Content-Security-Policy',
        content: "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'",
      },
      injectTo: 'head-prepend',
    },
    { tag: 'meta', attrs: { name: 'referrer', content: 'no-referrer' }, injectTo: 'head-prepend' },
  ],
};

export default defineConfig({ base: './', plugins: [csp], build: { target: 'es2022' } });
