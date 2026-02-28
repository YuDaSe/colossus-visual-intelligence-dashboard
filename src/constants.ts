export const SENTIMENTS = {
  BULLISH: 'bullish',
  BEARISH: 'bearish',
  NEUTRAL: 'neutral',
};

export const CHART_COLORS = {
  layout: {
    backgroundColor: "#131722",
  },
  timeScale: {
    borderColor: "rgba(42, 46, 57, 0.5)",
  },
  candlestickSeries: {
    [SENTIMENTS.BULLISH]: '22cc66',
    [SENTIMENTS.BEARISH]: 'ff4444',
  },
  sentimentMarkers: {
    [SENTIMENTS.BULLISH]: 'rgba(100, 255, 150, 0.2)',
    [SENTIMENTS.BEARISH]: "rgba(255, 80, 80, 0.2)",
    [SENTIMENTS.NEUTRAL]: "rgba(200, 200, 200, 0.0)",
  },
  tradeAdviceMarkers: {
    [SENTIMENTS.BULLISH]: 'rgba(0, 150, 255, 0.2)',
    [SENTIMENTS.BEARISH]: 'rgba(255, 100, 0, 0.2)',
    [SENTIMENTS.NEUTRAL]: "rgba(100, 100, 100, 0.2)",
  },
};

export const CANDLE_INTERVALS = {
  ONE_MINUTE: '1m',
  FIVE_MINUTES: '5m',
  FIFTEEN_MINUTES: '15m',
  THIRTY_MINUTES: '30m',
  ONE_HOUR: '1h',
  FOUR_HOURS: '4h',
  ONE_DAY: '1d',
  ONE_WEEK: '1w',
  ONE_MONTH: '1M',
};

export const PAIR = 'BTCUSDT';

export const CANDLE_INTERVALS_SECONDS: Record<string, number> = {
  [CANDLE_INTERVALS.ONE_MINUTE]: 60,
  [CANDLE_INTERVALS.FIVE_MINUTES]: 5 * 60,
  [CANDLE_INTERVALS.FIFTEEN_MINUTES]: 15 * 60,
  [CANDLE_INTERVALS.THIRTY_MINUTES]: 30 * 60,
  [CANDLE_INTERVALS.ONE_HOUR]: 60 * 60,
  [CANDLE_INTERVALS.FOUR_HOURS]: 4 * 60 * 60,
  [CANDLE_INTERVALS.ONE_DAY]: 24 * 60 * 60,
  [CANDLE_INTERVALS.ONE_WEEK]: 7 * 24 * 60 * 60,
  [CANDLE_INTERVALS.ONE_MONTH]: 30 * 24 * 60 * 60, // Approximation
};