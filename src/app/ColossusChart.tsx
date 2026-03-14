"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  ColorType,
  createChart,
  CandlestickSeries,
  IChartApi,
  OhlcData,
  UTCTimestamp,
} from "lightweight-charts";
import { SENTIMENTS, CHART_COLORS } from "../constants";
import {
  mapNewsSentimentsToRectangleMarkers,
  mapTradeAdviceToRectangleMarkers,
  normalizeChartRectangles,
} from "@/utils/mappers";
import { RectangleSeriesPrimitive } from "./primitives/RectangleSeriesPrimitive";
import { NewsSentiment } from "./data/database/db-services/news-aggregation-service";
import { reduce } from "lodash";
import { TradeSetupAdvice } from "./data/database/db-services/grid-setup-advice.service";
import { runHardcoreBackTest } from "@/utils/grid-backtest";
import { adviceCorridorReducer } from "@/utils/advice-corridor-reducer";
import ChartSettings, { ChartSettingsState } from "./ChartSettings";
import ChartProfitOverlay from "./ChartProfitOverlay";

const ColossusChart = ({
  candles,
  newsSentiments,
  gridSetupAdvices,
}: {
  candles: OhlcData[];
  newsSentiments: NewsSentiment[];
  gridSetupAdvices: TradeSetupAdvice[];
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const [settings, setSettings] = useState<ChartSettingsState>({
    initialLongBudget: 1000,
    initialShortBudget: 1000,
    leverage: 10,
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
            corridor.candles,
            corridor.hightBoundaryPrice,
            corridor.lowBoundaryPrice,
            corridor.numGrids,
            acc,
            settings.leverage,
            corridor.sentiment,
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
            corridor.candles,
            corridor.hightBoundaryPrice,
            corridor.lowBoundaryPrice,
            corridor.numGrids,
            acc,
            settings.leverage,
            corridor.sentiment,
          );
          return acc + finalProfit;
        },
        settings.initialShortBudget,
      ),
    [shortCorridors, settings.initialShortBudget, settings.leverage],
  );

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.resize(
          chartContainerRef.current.clientWidth,
          chartContainerRef.current.clientHeight,
        );
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Create and manage chart
  useEffect(() => {
    const chartContainer = chartContainerRef.current;
    if (!chartContainer) return;

    const lowestPrice = Math.min(...candles.map((c) => c.low)) * 0.9;
    const highestPrice = Math.max(...candles.map((c) => c.high)) * 1.1;
    const timeGrid = candles.map((c) => c.time) as UTCTimestamp[];

    const chart = createChart(chartContainer, {
      width: chartContainer.clientWidth,
      height: chartContainer.clientHeight,
      grid: {
        vertLines: { color: "transparent" },
        horzLines: { color: "transparent" },
      },
      layout: {
        textColor: "white",
        background: {
          type: ColorType.Solid,
          color: CHART_COLORS.layout.backgroundColor,
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: CHART_COLORS.timeScale.borderColor,
      },
    }) as IChartApi;

    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: `#${CHART_COLORS.candlestickSeries[SENTIMENTS.BULLISH]}`,
      downColor: `#${CHART_COLORS.candlestickSeries[SENTIMENTS.BEARISH]}`,
      borderVisible: true,
      wickUpColor: `#${CHART_COLORS.candlestickSeries[SENTIMENTS.BULLISH]}`,
      wickDownColor: `#${CHART_COLORS.candlestickSeries[SENTIMENTS.BEARISH]}`,
    });

    candlestickSeries.setData(candles);

    // Sentiment markers
    const sentimentMarkers = mapNewsSentimentsToRectangleMarkers(
      newsSentiments,
      { lowestPrice, highestPrice },
    );
    const normalizedSentimentMarkers = normalizeChartRectangles(
      sentimentMarkers,
      timeGrid,
    );
    candlestickSeries.attachPrimitive(
      new RectangleSeriesPrimitive(normalizedSentimentMarkers),
    );

    // Trade advice markers
    const tradeAdviceMarkers =
      mapTradeAdviceToRectangleMarkers(gridSetupAdvices);
    const normalizedTradeAdviceMarkers = normalizeChartRectangles(
      tradeAdviceMarkers,
      timeGrid,
    );
    candlestickSeries.attachPrimitive(
      new RectangleSeriesPrimitive(normalizedTradeAdviceMarkers, {
        drawBorderLines: true,
      }),
    );

    // Long corridors
    if (settings.showLongCorridors) {
      const tradeAdviceCorridorsMarkers = mapTradeAdviceToRectangleMarkers(
        corridors,
        { [SENTIMENTS.BULLISH]: "rgba(100, 255, 150, 0.1)" },
      );
      const normalizedTradeAdviceCorridorsMarkers = normalizeChartRectangles(
        tradeAdviceCorridorsMarkers,
        timeGrid,
      );
      candlestickSeries.attachPrimitive(
        new RectangleSeriesPrimitive(normalizedTradeAdviceCorridorsMarkers, {
          drawBorderLines: true,
        }),
      );
    }

    // Short corridors
    if (settings.showShortCorridors) {
      const tradeAdviceShortCorridorsMarkers = mapTradeAdviceToRectangleMarkers(
        shortCorridors,
        { [SENTIMENTS.BEARISH]: "rgba(255, 100, 100, 0.1)" },
      );
      const normalizedShortCorridorsMarkers = normalizeChartRectangles(
        tradeAdviceShortCorridorsMarkers,
        timeGrid,
      );
      candlestickSeries.attachPrimitive(
        new RectangleSeriesPrimitive(normalizedShortCorridorsMarkers, {
          drawBorderLines: true,
        }),
      );
    }

    chart.timeScale().fitContent();

    return () => {
      chartRef.current = null;
      chart.remove();
    };
  }, [
    candles,
    newsSentiments,
    gridSetupAdvices,
    corridors,
    shortCorridors,
    settings.showLongCorridors,
    settings.showShortCorridors,
  ]);

  return (
    <div style={{ position: "relative", height: "100vh", width: "100vw" }}>
      <div
        ref={chartContainerRef}
        style={{ height: "100%", width: "100%" }}
      />
      <ChartSettings settings={settings} onChange={setSettings} />
      <ChartProfitOverlay
        totalLongProfit={totalLongProfit}
        totalShortProfit={totalShortProfit}
        showLongProfit={settings.showShortCorridors}
        showShortProfit={settings.showLongCorridors}
      />
    </div>
  );
};

export default ColossusChart;
