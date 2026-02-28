import { OhlcData, UTCTimestamp } from "lightweight-charts";
import { TCandleStick } from "../app/data/database/schemas/candle-stick";
import { TGridSetupAdvice } from "../app/data/database/schemas/grid-setup-advice";
import { SENTIMENTS } from "../app/constants";

export function mapCandlesToOhlc(candles: TCandleStick[]): OhlcData[] {
  return candles.map((candle: TCandleStick, index: number) => {
    const nextCandle = candles[index + 1];

    return {
      time: (candle.openTime.getTime() / 1000) as UTCTimestamp,
      open: parseFloat(candle.openPrice),
      high: parseFloat(candle.highPrice),
      low: parseFloat(candle.lowPrice),
      close: nextCandle
        ? parseFloat(nextCandle.openPrice)
        : parseFloat(candle.closePrice),
    };
  });
}

export function mapGridSetupAdvicesToChart(
  gridSetupAdvices: TGridSetupAdvice[],
) {
  return gridSetupAdvices.map((advice, index) => {
    const nextAdvice = gridSetupAdvices[index + 1];

    return {
      hightBoundaryPrice:
        Number(advice.longGridSettings?.hightBoundaryPrice) || 0,
      lowBoundaryPrice: Number(advice.longGridSettings?.lowBoundaryPrice) || 0,
      startTime: advice.createdAt.getTime() / 1000,
      endTime: nextAdvice
        ? nextAdvice.createdAt.getTime() / 1000
        : advice.createdAt.getTime() / 1000 + 4 * 60 * 60,
      sentiment:
        advice.shouldCloseOpenLongGridsRecommendationFrom1to10 > 7
          ? SENTIMENTS.BEARISH
          : advice.canGoLongRecommendationFrom1to10 > 7
            ? SENTIMENTS.BULLISH
            : SENTIMENTS.NEUTRAL,
    };
  });
}
