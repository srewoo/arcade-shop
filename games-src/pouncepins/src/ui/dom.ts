// Typed element lookups, resolved once at boot (fails loudly if the HTML drifts).
function byId<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`missing #${id}`);
  return node as T;
}

export interface Els {
  readonly app: HTMLElement; readonly board: HTMLElement; readonly play: HTMLElement; readonly title: HTMLElement;
  readonly scene: HTMLCanvasElement; readonly sceneWrap: HTMLElement; readonly chip: HTMLElement; readonly banner: HTMLElement;
  readonly hint: HTMLElement; readonly hintText: HTMLElement; readonly hintClose: HTMLButtonElement;
  readonly meter: HTMLElement; readonly meterFill: HTMLElement; readonly sweet: HTMLElement; readonly meterLabel: HTMLElement;
  readonly curveL: HTMLButtonElement; readonly curveR: HTMLButtonElement; readonly curveOut: HTMLElement; readonly bowl: HTMLButtonElement;
  readonly mute: HTMLButtonElement; readonly openSettings: HTMLButtonElement; readonly pause: HTMLButtonElement;
  readonly playBtn: HTMLButtonElement; readonly stats: HTMLElement; readonly howList: HTMLElement; readonly tagline: HTMLElement; readonly keys: HTMLElement;
  readonly pauseOv: HTMLElement; readonly pauseResume: HTMLButtonElement; readonly pauseSettings: HTMLButtonElement;
  readonly pauseRestart: HTMLButtonElement; readonly pauseQuit: HTMLButtonElement; readonly pauseConfirm: HTMLElement;
  readonly confirmText: HTMLElement; readonly confirmYes: HTMLButtonElement; readonly confirmNo: HTMLButtonElement;
  readonly settingsOv: HTMLElement; readonly settingsClose: HTMLButtonElement; readonly volume: HTMLInputElement; readonly volumeOut: HTMLOutputElement;
  readonly overOv: HTMLElement; readonly overRank: HTMLElement; readonly overScore: HTMLElement; readonly overLines: HTMLElement;
  readonly down: HTMLElement; readonly overBest: HTMLElement; readonly overTip: HTMLElement; readonly titleArt: HTMLCanvasElement;
  readonly overAgain: HTMLButtonElement; readonly overTitle: HTMLButtonElement; readonly live: HTMLElement;
}

export function resolveEls(): Els {
  return {
    app: byId('app'), board: byId('board'), play: byId('play'), title: byId('title'),
    scene: byId('scene'), sceneWrap: byId('scene-wrap'), chip: byId('chip'), banner: byId('banner'),
    hint: byId('hint'), hintText: byId('hint-text'), hintClose: byId('hint-close'),
    meter: byId('meter'), meterFill: byId('meter-fill'), sweet: byId('sweet'), meterLabel: byId('meter-label'),
    curveL: byId('curve-l'), curveR: byId('curve-r'), curveOut: byId('curve-out'), bowl: byId('bowl'),
    mute: byId('mute'), openSettings: byId('open-settings'), pause: byId('pause'),
    playBtn: byId('play-btn'), stats: byId('stats'), howList: byId('how-list'), tagline: byId('tagline'), keys: byId('keys'),
    pauseOv: byId('pause-overlay'), pauseResume: byId('pause-resume'), pauseSettings: byId('pause-settings'),
    pauseRestart: byId('pause-restart'), pauseQuit: byId('pause-quit'), pauseConfirm: byId('pause-confirm'),
    confirmText: byId('confirm-text'), confirmYes: byId('confirm-yes'), confirmNo: byId('confirm-no'),
    settingsOv: byId('settings-overlay'), settingsClose: byId('settings-close'), volume: byId('volume'), volumeOut: byId('volume-out'),
    overOv: byId('over-overlay'), overRank: byId('over-rank'), overScore: byId('over-score'), overLines: byId('over-lines'),
    down: byId('down'), overBest: byId('over-best'), overTip: byId('over-tip'), titleArt: byId('title-art'),
    overAgain: byId('over-again'), overTitle: byId('over-title-btn'), live: byId('live'),
  };
}
