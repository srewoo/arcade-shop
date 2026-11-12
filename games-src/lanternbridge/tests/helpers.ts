import { buildBridge } from '../src/levels/build';

export const classic = (slack = 0) => buildBridge({ id: 'test', title: 't', blurb: '', times: [1, 2, 5, 10], slack });
