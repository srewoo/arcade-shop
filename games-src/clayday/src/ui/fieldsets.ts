// Button-group settings: <fieldset data-setting="key"> with <button data-value>.

export function syncFieldsets(root: ParentNode, get: (key: string) => string): void {
  root.querySelectorAll<HTMLFieldSetElement>('fieldset[data-setting]').forEach((fs) => {
    const current = get(fs.dataset.setting ?? '');
    fs.querySelectorAll<HTMLButtonElement>('button[data-value]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === current)));
  });
}

export function bindFieldsets(root: ParentNode, set: (key: string, value: string) => void): void {
  root.querySelectorAll<HTMLButtonElement>('fieldset[data-setting] button[data-value]').forEach((b) => {
    b.addEventListener('click', () => {
      const key = b.closest('fieldset')?.dataset.setting;
      if (key && b.dataset.value !== undefined) set(key, b.dataset.value);
    });
  });
}
