import { SENTIMENTS } from "@/constants";
import { OhlcData } from "lightweight-charts";

export function runHardcoreBackTest(
  candles: OhlcData[],
  upper: number,
  lower: number,
  numGrids: number,
  initialCapital: number,
  leverage: number = 1,
  sentiment = SENTIMENTS.BULLISH,
) {
  const gridSize = (upper - lower) / numGrids;
  let totalProfit = 0;
  let trades = 0;

  // We track the 'active' levels.
  // Simplified: If price moves through a full grid height, we booked a profit.
  let lastGridLevel = Math.floor((candles[0].close - lower) / gridSize);

  candles.forEach((candle) => {
    const closeLevel = Math.floor((candle.close - lower) / gridSize);
    const levelsCrossed = Math.abs(closeLevel - lastGridLevel);

    const direction =
      sentiment === SENTIMENTS.BULLISH
        ? closeLevel - lastGridLevel >= 0
          ? 1
          : -1
        : closeLevel - lastGridLevel >= 0
          ? -1
          : 1;
          
    if (levelsCrossed > 0) {
      // Every 'cross' is a scalp.
      // Profit per grid = (GridSize / MidPrice) * (Capital / numGrids) * Leverage
      const profitPerGrid =
        (gridSize / candle.close) * (initialCapital / numGrids) * leverage;

      // Subtract fees (0.06% avg for taker/maker mix)
      const netProfit =
        profitPerGrid *
        // FIX fee calculation
        // - candle.close * 0.0006
        levelsCrossed *
        direction;

      totalProfit += netProfit;
      trades += levelsCrossed;
      lastGridLevel = closeLevel; // Reset to the latest peak
    }
  });

  const result = {
    finalProfit: totalProfit,
    totalTrades: trades,
    ROI: ((totalProfit / initialCapital) * 100).toFixed(2) + "%",
    efficiency: (totalProfit / candles.length).toFixed(4) + " profit/candle",
  };

  return result;
}
