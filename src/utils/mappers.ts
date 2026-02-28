import { OhlcData, UTCTimestamp } from "lightweight-charts";
import { TCandleStick } from "../app/data/database/schemas/candle-stick";
import { TGridSetupAdvice } from "../app/data/database/schemas/grid-setup-advice";
import {
  CANDLE_INTERVALS,
  CANDLE_INTERVALS_SECONDS,
  SENTIMENTS,
} from "../constants";

export function mapCandlesToOhlc(candles: TCandleStick[]): OhlcData[] {
  return candles.map((candle: TCandleStick, index: number) => {
    const nextCandle = candles[index + 1];

    return {
      time: getChartTime(candle.openTime),
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
      startTime: getChartTime(advice.createdAt),
      endTime: nextAdvice
        ? getChartTime(nextAdvice.createdAt)
        : getChartTime(
            new Date(
              advice.createdAt.getTime() +
                CANDLE_INTERVALS_SECONDS[CANDLE_INTERVALS.FOUR_HOURS] * 1000,
            ),
          ),
      sentiment:
        advice.shouldCloseOpenLongGridsRecommendationFrom1to10 > 7
          ? SENTIMENTS.BEARISH
          : advice.canGoLongRecommendationFrom1to10 > 7
            ? SENTIMENTS.BULLISH
            : SENTIMENTS.NEUTRAL,
    };
  });
}

export const getChartTime = (time: Date | number): UTCTimestamp => {
  const date = new Date(time);
  date.setMinutes(0, 0, 0);

  return (date.getTime() / 1000) as UTCTimestamp;
};
