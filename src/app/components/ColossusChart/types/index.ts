export enum Sentiment {
  BULLISH = 'bullish',
  BEARISH = 'bearish',
  NEUTRAL = 'neutral',
}

export interface ChartColors {
  layout: {
    backgroundColor: string;
  };
  timeScale: {
    borderColor: string;
  };
  candlestickSeries: Record<string, string>;
  sentimentMarkers: Record<string, string>;
  tradeAdviceMarkers: Record<string, string>;
}

export interface ChartNewsSentiment {
  sentiment: string;
  timeRange: { start: Date; end: Date };
}

export interface ChartTradeSetupAdvice {
  hightBoundaryPrice: number;
  lowBoundaryPrice: number;
  startTime: number;
  endTime: number;
  sentiment: string;
  numGrids: number;
}

export interface ChartInflationRate {
  date: Date;
  inflationIndex: number;
}

export interface ChartCorridorColors {
  bullish?: string;
  bearish?: string;
  neutral?: string;
}
