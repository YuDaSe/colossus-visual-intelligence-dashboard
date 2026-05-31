"use client";

import { useState, useMemo } from "react";
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

const ColossusChartContainer = ({
  candles,
  newsSentiments,
  gridSetupAdvices,
  inflationRates,
}: {
  candles: OhlcData[];
  newsSentiments: NewsSentiment[];
  gridSetupAdvices: TradeSetupAdvice[];
  inflationRates: InflationRate[];
}) => {
  const [settings, setSettings] = useState<ChartSettingsState>({
    initialLongBudget: 1000,
    initialShortBudget: 1000,
    leverage: 1,
    showShortCorridors: true,
    showLongCorridors: true,
  });

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

  return (
    <div style={{ position: "relative", height: "100vh", width: "100vw" }}>
      <ColossusChart
        candles={candles}
        newsSentiments={newsSentiments}
        gridSetupAdvices={gridSetupAdvices}
        gridSetups={gridSetups}
        gridSetupsColors={{
          bullish: "rgba(100, 255, 150, 0.1)",
          bearish: "rgba(240, 117, 174, 0.2)",
        }}
        inflationRates={inflationRates}
        chartColors={CHART_COLORS}
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
