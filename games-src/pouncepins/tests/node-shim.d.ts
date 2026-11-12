// Minimal typing for the Node APIs the tests use (avoids adding @types/node).
declare module 'node:fs' {
  export function readFileSync(path: URL | string, encoding: 'utf8'): string;
  export function appendFileSync(path: string, data: string): void;
}
