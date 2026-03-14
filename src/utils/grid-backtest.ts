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

    if (levelsCrossed > 0) {
      const isUpward = closeLevel > lastGridLevel;

      // In a grid bot, profit is realized only when closing a position:
      // BULLISH (long grid): sell on upward crosses → realize profit
      // BEARISH (short grid): cover on downward crosses → realize profit
      // NEUTRAL: both directions realize profit (dual-sided grid)
      let profitableCrossings: number;
      if (sentiment === SENTIMENTS.NEUTRAL) {
        profitableCrossings = levelsCrossed;
      } else if (sentiment === SENTIMENTS.BULLISH) {
        profitableCrossings = isUpward ? levelsCrossed : 0;
      } else {
        profitableCrossings = isUpward ? 0 : levelsCrossed;
      }

      // Profit per grid = (GridSize / MidPrice) * (Capital / numGrids) * Leverage
      const profitPerGrid =
        (gridSize / candle.close) * (initialCapital / numGrids) * leverage;

      const netProfit = profitPerGrid * profitableCrossings;

      totalProfit += netProfit;
      trades += profitableCrossings;
      lastGridLevel = closeLevel;
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
