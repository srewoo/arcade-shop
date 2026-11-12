// The few extension APIs the launcher uses (avoids pulling in @types/chrome).
interface ChromeTabsApi {
  create(props: { url: string; active?: boolean }): Promise<unknown>;
}
interface ChromeRuntimeApi {
  getURL(path: string): string;
}
interface ChromeApi {
  tabs?: ChromeTabsApi;
  runtime?: ChromeRuntimeApi;
}
declare const chrome: ChromeApi | undefined;
