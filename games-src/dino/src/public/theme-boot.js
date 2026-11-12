/* Apply the saved theme and text size before first paint (no cream flash in dark mode). */
try {
  var saved = JSON.parse(localStorage.getItem('dino-run-locked-in:settings') || '{}');
  if (saved.theme === 'dark' || saved.theme === 'light') document.documentElement.dataset.theme = saved.theme;
  if (saved.weather === 'night') document.documentElement.dataset.boot = 'night';
  if (saved.textScale === 1.25 || saved.textScale === 1.5) document.documentElement.style.setProperty('--ui-scale', String(saved.textScale));
} catch (e) {}
