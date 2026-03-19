import { TradeSetupAdviceCorridor } from "@/app/data/database/db-services/grid-setup-advice.service";
import { SENTIMENTS } from "@/constants";

export function runHardcoreBackTest(
  corridor: TradeSetupAdviceCorridor,
  initialCapital: number,
  leverage: number = 1,
) {
  const {
    candles,
    hightBoundaryPrice: upper,
    lowBoundaryPrice: lower,
    numGrids,
    sentiment,
  } = corridor;
  const gridSize = (upper - lower) / numGrids;
  const capitalPerGrid = initialCapital / numGrids;
  let realizedProfit = 0;
  let trades = 0;

  const clampLevel = (level: number) =>
    Math.max(0, Math.min(numGrids, level));

  const startPrice = candles[0].close;
  const startLevel = clampLevel(
    Math.floor((startPrice - lower) / gridSize),
  );
  let lastGridLevel = startLevel;

  // Track open positions by entry price.
  // Initial positions are bought/shorted at market (startPrice).
  const openLongs: number[] = [];
  const openShorts: number[] = [];

  if (sentiment !== SENTIMENTS.BEARISH) {
    for (let i = 0; i < startLevel; i++) {
      openLongs.push(startPrice);
    }
  }
  if (sentiment !== SENTIMENTS.BULLISH) {
    for (let i = startLevel; i < numGrids; i++) {
      openShorts.push(startPrice);
    }
  }

  candles.forEach((candle) => {
    const closeLevel = clampLevel(
      Math.floor((candle.close - lower) / gridSize),
    );
    if (closeLevel === lastGridLevel) return;

    const isUpward = closeLevel > lastGridLevel;
    const levelsCrossed = Math.abs(closeLevel - lastGridLevel);

    if (isUpward) {
      // BULLISH/NEUTRAL: sell longs — each completed grid trade earns ~gridSize
      if (sentiment !== SENTIMENTS.BEARISH) {
        const sellable = Math.min(levelsCrossed, openLongs.length);
        for (let i = 0; i < sellable; i++) {
          openLongs.pop();
          realizedProfit +=
            (gridSize / candle.close) * capitalPerGrid * leverage;
          trades++;
        }
      }
      // BEARISH/NEUTRAL: open new shorts at grid level prices
      if (sentiment !== SENTIMENTS.BULLISH) {
        for (let i = 0; i < levelsCrossed; i++) {
          const level = lastGridLevel + i + 1;
          if (level <= numGrids) {
            openShorts.push(lower + level * gridSize);
          }
        }
      }
    } else {
      // BULLISH/NEUTRAL: open new longs at grid level prices
      if (sentiment !== SENTIMENTS.BEARISH) {
        for (let i = 0; i < levelsCrossed; i++) {
          const level = lastGridLevel - i - 1;
          if (level >= 0) {
            openLongs.push(lower + level * gridSize);
          }
        }
      }
      // BEARISH/NEUTRAL: cover shorts — each completed grid trade earns ~gridSize
      if (sentiment !== SENTIMENTS.BULLISH) {
        const coverable = Math.min(levelsCrossed, openShorts.length);
        for (let i = 0; i < coverable; i++) {
          openShorts.pop();
          realizedProfit +=
            (gridSize / candle.close) * capitalPerGrid * leverage;
          trades++;
        }
      }
    }

    lastGridLevel = closeLevel;
  });

  // Unrealized P&L: mark open positions to last price
  const lastPrice = candles[candles.length - 1].close;
  let unrealizedPnL = 0;

  for (const entryPrice of openLongs) {
    unrealizedPnL +=
      ((lastPrice - entryPrice) / entryPrice) * capitalPerGrid * leverage;
  }
  for (const entryPrice of openShorts) {
    unrealizedPnL +=
      ((entryPrice - lastPrice) / entryPrice) * capitalPerGrid * leverage;
  }

  const totalProfit = realizedProfit + unrealizedPnL;

  const result = {
    finalProfit: totalProfit,
    totalTrades: trades,
    ROI: ((totalProfit / initialCapital) * 100).toFixed(2) + "%",
    efficiency: (totalProfit / candles.length).toFixed(4) + " profit/candle",
  };

  // console.log(
  //   `%c${sentiment} Backtest Result:`,
  //   sentiment === SENTIMENTS.BULLISH 
  //     ? "color: white; background: #28a745; padding: 4px 8px; border-radius: 4px;" 
  //     : "color: white; background: red; padding: 4px 8px; border-radius: 4px;",
  //   new Date(corridor.startTime * 1000),
  //   result
  // );

  return result;
}
