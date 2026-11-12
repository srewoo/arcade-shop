import { gamePath } from './catalogue';

export interface LaunchEnv {
  readonly chrome?: ChromeApi | undefined;
  readonly open: (url: string) => void;
}

/** Opens a game in a new browser tab. Uses chrome.tabs (no permission needed) and falls back to window.open. */
export async function openGame(id: string, env: LaunchEnv): Promise<void> {
  const path = gamePath(id);
  const tabs = env.chrome?.tabs;
  const runtime = env.chrome?.runtime;
  if (tabs && runtime) {
    await tabs.create({ url: runtime.getURL(path), active: true });
    return;
  }
  env.open(path);
}

export async function openArcade(env: LaunchEnv): Promise<void> {
  const tabs = env.chrome?.tabs;
  const runtime = env.chrome?.runtime;
  if (tabs && runtime) await tabs.create({ url: runtime.getURL('arcade.html'), active: true });
  else env.open('arcade.html');
}
