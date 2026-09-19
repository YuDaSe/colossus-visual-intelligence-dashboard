"use client";

import { useEffect, useMemo, useState } from "react";
import {
  EMA,
  SMA,
  hasCrossedOver,
  hasCrossedUnder,
  ATR,
  TradingSignal,
} from "trading-signals";
import { LineWidth, OhlcData, UTCTimestamp } from "lightweight-charts";
import { compact, reduce } from "lodash";
import { CHART_COLORS, SENTIMENTS } from "@/constants";
import { NewsSentiment } from "../data/database/db-services/news-aggregation-service";
import { TradeSetupAdvice } from "../data/database/db-services/grid-setup-advice.service";
import { InflationRate } from "../data/database/db-services/us-inflation-rate.service";
import { runHardcoreBackTest } from "@/utils/grid-backtest";
import { adviceCorridorReducer } from "@/utils/advice-corridor-reducer";
import ChartSettings, { ChartSettingsState } from "../components/ChartSettings";
import ChartProfitOverlay from "../components/ChartProfitOverlay";
import AddInflationRateForm from "../components/AddInflationRateForm";
import ColossusChart, {
  CharIndicator,
} from "../components/ColossusChart/ColossusChart";
import {
  CrossOverPoint,
  findConsolidationZones,
  hasTurnedDown,
  TimePoint,
} from "@/utils/consolidation-zones";
import { mapCandlesToOhlc } from "@/utils/mappers";
import TradingMarketBar, {
  TradingMarket,
} from "../components/TradingMarketBar";

const ColossusChartContainer = ({
  pair,
  interval,
  candles: initialCandles,
  newsSentiments,
  gridSetupAdvices,
  inflationRates,
}: {
  pair: string;
  interval: string;
  candles: OhlcData[];
  newsSentiments: NewsSentiment[];
  gridSetupAdvices: TradeSetupAdvice[];
  inflationRates: InflationRate[];
}) => {
  const [market, setMarket] = useState<TradingMarket>({ pair, interval });
  const [candles, setCandles] = useState(initialCandles);
  const [settings, setSettings] = useState<ChartSettingsState>({
    initialLongBudget: 1000,
    initialShortBudget: 1000,
    leverage: 1,
    showShortCorridors: true,
    showLongCorridors: true,
  });

  useEffect(() => {
    const loadCandles = async () => {
      const params = new URLSearchParams({
        pair: market.pair,
        interval: market.interval,
      });
      const response = await fetch(`/api/candles?${params.toString()}`);

      if (!response.ok) {
        return;
      }

      const rawCandles = await response.json();

      setCandles(
        mapCandlesToOhlc(
          rawCandles.map((candle: { openTime: string }) => ({
            ...candle,
            openTime: new Date(candle.openTime),
          })),
        ),
      );
    };

    loadCandles();
  }, [market]);

  const corridors = useMemo(
    () => adviceCorridorReducer(candles, gridSetupAdvices),
    [candles, gridSetupAdvices],
  );

  const shortCorridors = useMemo(
    () => adviceCorridorReducer(candles, gridSetupAdvices, SENTIMENTS.BEARISH),
    [candles, gridSetupAdvices],
  );

  const totalLongProfit = useMemo(
    () =>
      reduce(
        [...corridors],
        (acc, corridor) => {
          const { finalProfit } = runHardcoreBackTest(
            corridor,
            acc,
            settings.leverage,
          );
          return acc + finalProfit;
        },
        settings.initialLongBudget,
      ),
    [corridors, settings.initialLongBudget, settings.leverage],
  );

  const totalShortProfit = useMemo(
    () =>
      reduce(
        [...shortCorridors.filter((c) => c.candles.length > 0)],
        (acc, corridor) => {
          const { finalProfit } = runHardcoreBackTest(
            corridor,
            acc,
            settings.leverage,
          );
          return acc + finalProfit;
        },
        settings.initialShortBudget,
      ),
    [shortCorridors, settings.initialShortBudget, settings.leverage],
  );

  const gridSetups = useMemo(
    () => [
      ...(settings.showLongCorridors ? corridors : []),
      ...(settings.showShortCorridors
        ? shortCorridors.filter((c) => c.candles.length > 0)
        : []),
    ],
    [
      corridors,
      shortCorridors,
      settings.showLongCorridors,
      settings.showShortCorridors,
    ],
  );

  const { sma10, sma50, ema9, crossOvers, turnDowns, atr14 } = useMemo(() => {
    const sma10 = new SMA(10);
    const sma50 = new SMA(50);
    const ema9 = new EMA(9);
    const atr14 = new ATR(14);

    const sma10Sequence: TimePoint[] = [];
    const sma50Sequence: TimePoint[] = [];
    const ema9Sequence: TimePoint[] = [];
    const atr14Sequence: TimePoint[] = [];

    const crossOvers: CrossOverPoint[] = [];
    const turnDowns: TimePoint[] = [];

    candles.forEach((candle, index) => {
      sma10.add(Number(candle.close));
      sma50.add(Number(candle.close));
      ema9.add(Number(candle.close));
      atr14.add({
        close: Number(candle.close),
        high: Number(candle.high),
        low: Number(candle.low),
      });

      if (
        sma10.getResult() !== null &&
        sma50.getResult() !== null &&
        ema9.getResult() !== null
      ) {
        sma10Sequence[index] = {
          time: candle.time as UTCTimestamp,
          value: sma10.getResult(),
        };
        sma50Sequence[index] = {
          time: candle.time as UTCTimestamp,
          value: sma50.getResult(),
        };
        ema9Sequence[index] = {
          time: candle.time as UTCTimestamp,
          value: ema9.getResult(),
        };
        atr14Sequence[index] = {
          time: candle.time as UTCTimestamp,
          value: atr14.getResult(),
        };
      }

      if (
        index > 0 &&
        sma50Sequence[index - 1] &&
        sma50Sequence[index - 1].value
      ) {
        const crossedOver = hasCrossedOver(
          ema9Sequence[index - 1].value,
          sma50Sequence[index - 1].value,
          ema9Sequence[index].value,
          sma50Sequence[index].value,
        );
        const crossedUnder = hasCrossedUnder(
          ema9Sequence[index - 1].value,
          sma50Sequence[index - 1].value,
          ema9Sequence[index].value,
          sma50Sequence[index].value,
        );

        const turnedDown = hasTurnedDown(ema9Sequence);

        if (turnedDown) {
          turnDowns.push({
            time: candle.time as UTCTimestamp,
            value: ema9Sequence[index].value,
          });
        }

        if (crossedOver) {
          crossOvers.push({
            time: candle.time as UTCTimestamp,
            value: ema9Sequence[index].value,
            type: TradingSignal.BULLISH,
          });
        }
        if (crossedUnder) {
          crossOvers.push({
            time: candle.time as UTCTimestamp,
            value: ema9Sequence[index].value,
            type: TradingSignal.BEARISH,
          });
        }
      }
    });

    return {
      sma10: sma10Sequence,
      sma50: sma50Sequence,
      ema9: ema9Sequence,
      atr14: atr14Sequence,
      crossOvers,
      turnDowns,
    };
  }, [candles]);

  ////
  const { inflationEma9, inflationSma20 } = useMemo(() => {
    const sma20 = new SMA(18);
    const ema9 = new EMA(9);

    const ema9Sequence: TimePoint[] = [];
    const sma20Sequence: TimePoint[] = [];

    inflationRates.forEach((inflationRecord) => {
      ema9.add(Number(inflationRecord.inflationIndex));
      sma20.add(Number(inflationRecord.inflationIndex));

      if (ema9.getResult() && sma20.getResult()) {
        ema9Sequence.push({
          time: inflationRecord.date as unknown as UTCTimestamp,
          value: ema9.getResult(),
        });
        sma20Sequence.push({
          time: inflationRecord.date as unknown as UTCTimestamp,
          value: sma20.getResult(),
        });
      }
    });

    return {
      inflationEma9: ema9Sequence,
      inflationSma20: sma20Sequence,
    };
  }, [inflationRates]);

  ////

  const chartIndicators = useMemo(() => {
    const indicators = [];

    indicators.push({
      color: "#f59e42",
      lineWidth: 2 as LineWidth,
      points: compact(sma10),
    });

    indicators.push({
      color: "#42f59e",
      lineWidth: 3 as LineWidth,
      points: compact(sma50),
    });

    indicators.push({
      color: "#9e42f5",
      lineWidth: 3 as LineWidth,
      points: compact(ema9),
    });

    return indicators;
  }, [sma10, sma50, ema9]);

  const inflationIndicators: CharIndicator[] = useMemo(() => {
    const indicators = [];

    indicators.push({
      color: "#42f59e",
      lineWidth: 2 as LineWidth,
      points: compact(inflationSma20),
    });

    indicators.push({
      color: "#9e42f5",
      lineWidth: 3 as LineWidth,
      points: compact(inflationEma9),
    });

    return indicators;
  }, [inflationEma9, inflationSma20]);

  const consolidationZones = useMemo(
    () => findConsolidationZones(compact(sma10)),
    [sma10],
  );

  const consolidationZoneAdvices = useMemo<TradeSetupAdvice[]>(
    () =>
      consolidationZones.map((zone) => ({
        hightBoundaryPrice: zone.high,
        lowBoundaryPrice: zone.low,
        startTime: zone.startTime,
        endTime: zone.endTime,
        sentiment: SENTIMENTS.BULLISH,
        numGrids: zone.pivots.length,
      })),
    [consolidationZones],
  );

  const mergedGridSetupAdvices = useMemo(
    () => [...gridSetupAdvices, ...consolidationZoneAdvices],
    [gridSetupAdvices, consolidationZoneAdvices],
  );

  return (
    <div style={{ position: "relative", height: "100vh", width: "100vw" }}>
      <TradingMarketBar market={market} onChange={setMarket} />
      <ColossusChart
        candles={candles}
        newsSentiments={newsSentiments}
        gridSetupAdvices={mergedGridSetupAdvices}
        gridSetups={gridSetups}
        gridSetupsColors={{
          bullish: "rgba(100, 255, 150, 0.1)",
          bearish: "rgba(240, 117, 174, 0.2)",
        }}
        inflationRates={inflationRates}
        inflationIndicators={inflationIndicators}
        chartColors={CHART_COLORS}
        chartIndicators={chartIndicators}
      />
      <ChartSettings settings={settings} onChange={setSettings} />
      <ChartProfitOverlay
        totalLongProfit={totalLongProfit}
        totalShortProfit={totalShortProfit}
        showLongProfit={settings.showLongCorridors}
        showShortProfit={settings.showShortCorridors}
        initialLongInvestment={settings.initialLongBudget}
        initialShortInvestment={settings.initialShortBudget}
      />
      <AddInflationRateForm />
    </div>
  );
};

export default ColossusChartContainer;
