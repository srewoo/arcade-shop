// arcadeShop service worker: only handles the keyboard shortcut. No permissions, no network.
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-arcade') void chrome.tabs.create({ url: chrome.runtime.getURL('arcade.html') });
});
