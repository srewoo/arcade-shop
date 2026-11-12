// Bridge pack: 3 to 7 travellers, one lantern, at most two on the bridge.
import type { Level } from '../puzzle/types';
import { buildBridge, type BridgeSpec } from './build';

const SPECS: readonly BridgeSpec[] = [
  { id: 'b01', title: 'First Night', blurb: 'Three travellers and a long dark bridge.', times: [1, 2, 5], slack: 4 },
  { id: 'b02', title: 'Rope and Rail', blurb: 'Someone has to bring the lantern back.', times: [1, 3, 6], slack: 3 },
  { id: 'b03', title: 'Late Courier', blurb: 'The slowest walker sets the pace.', times: [2, 4, 9], slack: 2 },
  { id: 'b04', title: 'Four at Dusk', blurb: 'Now there are four, and the oil is limited.', times: [1, 2, 5, 10], slack: 4 },
  { id: 'b05', title: 'Market Run', blurb: 'Two different plans reach the same total.', times: [1, 3, 4, 9], slack: 3 },
  { id: 'b06', title: 'Two Tortoises', blurb: 'Two slow walkers, two fast ones.', times: [2, 3, 8, 9], slack: 3 },
  { id: 'b07', title: 'Narrow Margin', blurb: 'The spare time is thin.', times: [1, 2, 7, 12], slack: 2 },
  { id: 'b08', title: 'Tight Oil', blurb: 'Just one minute to spare.', times: [1, 4, 5, 8], slack: 1 },
  { id: 'b09', title: 'The Classic Four', blurb: 'No slack at all. Find the best order.', times: [1, 2, 5, 10], slack: 0 },
  { id: 'b10', title: 'Five Lanterns Lit', blurb: 'Five travellers cross before the oil runs out.', times: [1, 2, 3, 6, 11], slack: 4 },
  { id: 'b11', title: 'Wet Boots', blurb: 'More walkers, more shuttling.', times: [1, 3, 4, 7, 10], slack: 3 },
  { id: 'b12', title: 'Quill Takes His Time', blurb: 'One very slow elder.', times: [1, 2, 4, 8, 15], slack: 2 },
  { id: 'b13', title: 'Pairs and Escorts', blurb: 'Decide who escorts and who waits.', times: [2, 3, 5, 9, 13], slack: 1 },
  { id: 'b14', title: 'Five, No Slack', blurb: 'Every minute counts.', times: [1, 2, 5, 8, 12], slack: 0 },
  { id: 'b15', title: 'Six at the Gate', blurb: 'A crowd gathers at the bridge.', times: [1, 2, 3, 5, 8, 13], slack: 4 },
  { id: 'b16', title: 'Fog Bank', blurb: 'Six travellers, a modest margin.', times: [1, 2, 4, 6, 9, 14], slack: 3 },
  { id: 'b17', title: 'Slow Procession', blurb: 'Three slow walkers have to share trips.', times: [1, 3, 5, 8, 9, 12], slack: 2 },
  { id: 'b18', title: 'Six, No Slack', blurb: 'Plan every trip before you walk.', times: [1, 2, 4, 7, 10, 15], slack: 0 },
  { id: 'b19', title: 'The Full Company', blurb: 'All seven travellers cross together.', times: [1, 2, 3, 5, 8, 11, 16], slack: 3 },
  { id: 'b20', title: 'Midnight Crossing', blurb: 'Seven travellers and a single spare minute.', times: [1, 2, 4, 6, 9, 13, 18], slack: 1 },
  { id: 'b21', title: 'Last Lantern', blurb: 'Seven travellers, zero spare time.', times: [1, 2, 3, 6, 10, 14, 19], slack: 0 },
];

export const BRIDGE_LEVELS: readonly Level[] = SPECS.map(buildBridge);
