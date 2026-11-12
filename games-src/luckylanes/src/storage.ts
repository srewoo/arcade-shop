// Shared localStorage helpers. Every access is wrapped in try/catch; failures never throw.

export function readJson(key: string): unknown {
  try {
    const text = localStorage.getItem(key);
    return text ? (JSON.parse(text) as unknown) : null;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[luckylanes] could not save ${key}`, err);
  }
}
