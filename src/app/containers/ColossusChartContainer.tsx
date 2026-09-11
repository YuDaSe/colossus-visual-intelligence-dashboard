"use client";

import { useEffect, useMemo, useState } from "react";
import { OhlcData } from "lightweight-charts";
import { reduce } from "lodash";
import { CHART_COLORS, SENTIMENTS } from "@/constants";
import { NewsSentiment } from "../data/database/db-services/news-aggregation-service";
import { TradeSetupAdvice } from "../data/database/db-services/grid-setup-advice.service";
import { InflationRate } from "../data/database/db-services/us-inflation-rate.service";
import { runHardcoreBackTest } from "@/utils/grid-backtest";
import { adviceCorridorReducer } from "@/utils/advice-corridor-reducer";
import ChartSettings, { ChartSettingsState } from "../components/ChartSettings";
import ChartProfitOverlay from "../components/ChartProfitOverlay";
import AddInflationRateForm from "../components/AddInflationRateForm";
import ColossusChart from "../components/ColossusChart/ColossusChart";
import SMA from "@/utils/indicators/SMA";
import { findConsolidationZones } from "@/utils/consolidation-zones";
import { mapCandlesToOhlc } from "@/utils/mappers";
import TradingMarketBar, { TradingMarket } from "../components/TradingMarketBar";

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
    [corridors, shortCorridors, settings.showLongCorridors, settings.showShortCorridors],
  );

  const smaData = useMemo(() => {
    const sma = new SMA(10);
    return candles
      // .slice(0, candles.length - 14)
      .map((candle) => {
        sma.update(Number(candle.close));
        return { time: candle.time as import("lightweight-charts").UTCTimestamp, value: sma.result };
      })
      .filter((d) => d.value > 0);
  }, [candles]);

  const consolidationZones = useMemo(
    () => findConsolidationZones(smaData),
    [smaData],
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
    () => [
      ...gridSetupAdvices, 
      ...consolidationZoneAdvices
    ],
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
        chartColors={CHART_COLORS}
        smaData={smaData}
      />
      <ChartSettings
        settings={settings}
        onChange={setSettings}
      />
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
