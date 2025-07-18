export type RawSignal = { timestamp: number | string; is_bullish: boolean };

export const mapSignals = (signals: RawSignal[]) =>
  signals
    .filter(s => s.timestamp !== undefined)
    .map(s => ({
      time:  typeof s.timestamp === 'number'
               ? s.timestamp
               : Math.floor(new Date(s.timestamp).getTime() / 1000), // ms → s
      position: s.is_bullish ? 'belowBar' : 'aboveBar',
      color:    s.is_bullish ? '#26a69a' : '#ef5350',
      shape:    s.is_bullish ? 'arrowUp'  : 'arrowDown',
      text:     s.is_bullish ? 'B'        : 'S',
    }));