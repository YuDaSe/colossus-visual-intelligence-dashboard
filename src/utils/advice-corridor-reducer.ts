import {
  TradeSetupAdvice,
  TradeSetupAdviceCorridor,
} from "@/app/data/database/db-services/grid-setup-advice.service";
import { SENTIMENTS } from "@/constants";
import { OhlcData, UTCTimestamp } from "lightweight-charts";
import { forEach, last } from "lodash";

export const adviceCorridorReducer = (
  candles: OhlcData[],
  gridSetupAdvices: TradeSetupAdvice[],
  sentiment = SENTIMENTS.BULLISH,
): TradeSetupAdviceCorridor[] => {
  const corridors = gridSetupAdvices.reduce((acc, advice) => {
    const lastCorridor = last(acc);
    const advicePriceRange =
      advice.hightBoundaryPrice - advice.lowBoundaryPrice;

    if (
      // TODO: filter out broken advices with very wide corridors and low number of grids
      !advicePriceRange
      || !advice.lowBoundaryPrice
      || !advice.hightBoundaryPrice
    
    ) {
      return acc;
    }

    if (advice.sentiment === SENTIMENTS.NEUTRAL && lastCorridor?.open) {
      lastCorridor.endTime = advice.endTime;
      return acc;
    }

    if (lastCorridor?.open) {
      // check if there are any candles that broke the corridor while it was open, if yes - close it at the time of the first broken candle
      const brokenCandle = candles.find(
        (candle) =>
          (candle.time as UTCTimestamp) > lastCorridor.startTime &&
          (candle.time as UTCTimestamp) < lastCorridor.endTime &&
          ((candle.low < lastCorridor.lowBoundaryPrice || candle.high > lastCorridor.hightBoundaryPrice))
      );

      if (brokenCandle) {
        lastCorridor.endTime = brokenCandle.time as UTCTimestamp;
        lastCorridor.open = false;

        return acc;
      } 
    }

    if (advice.sentiment === sentiment) {
      const advicePriceRange =
        advice.hightBoundaryPrice - advice.lowBoundaryPrice;

      if (lastCorridor?.open) {
        const lastCorridorPriceRange =
          lastCorridor.hightBoundaryPrice - lastCorridor.lowBoundaryPrice;

        if (
          advicePriceRange < lastCorridorPriceRange
        ) {
          lastCorridor.open = false;
          lastCorridor.endTime = advice.startTime;
          acc.push({
            ...advice,
            open: true,
            candles: [],
          });
        } else {
          lastCorridor.endTime = advice.endTime;
        }
      } else {
        acc.push({
          ...advice,
          open: true,
          candles: [],
        });
      }
    } else {
      if (lastCorridor?.open) {
        lastCorridor.endTime = advice.startTime;
        lastCorridor.open = false;
      }
    }

    return acc;
  }, [] as TradeSetupAdviceCorridor[]);

  forEach(corridors, (corridor) => {
    corridor.candles = candles.filter(
      (candle) =>
        (candle.time as UTCTimestamp) >= corridor.startTime &&
        (candle.time as UTCTimestamp) <= corridor.endTime,
    );
  });

  return corridors;
};
