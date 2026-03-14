"use client";

import { useEffect } from "react";
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

const ColossusChart = ({
  candles,
  newsSentiments,
  gridSetupAdvices,
}: {
  candles: OhlcData[];
  newsSentiments: NewsSentiment[];
  gridSetupAdvices: TradeSetupAdvice[];
}) => {
  useEffect(() => {
    const lowestPrice = Math.min(...candles.map((c) => c.low)) * 0.9;
    const highestPrice = Math.max(...candles.map((c) => c.high)) * 1.1;
    const timeGrid = candles.map((c) => c.time) as UTCTimestamp[];

    // advice-corridor-reducer

    const corridors = adviceCorridorReducer(candles, gridSetupAdvices);
    const shortCorridors = adviceCorridorReducer(
      candles,
      gridSetupAdvices,
      SENTIMENTS.BEARISH,
    );
    // .slice(3, 4);

    const initialLongBudget = 1000;
    const leverage = 10;
    const totalLongProfit = reduce(
      [...corridors],
      (acc, corridor) => {
        const { finalProfit } = runHardcoreBackTest(
          corridor.candles,
          corridor.hightBoundaryPrice,
          corridor.lowBoundaryPrice,
          corridor.numGrids,
          acc,
          leverage,
          corridor.sentiment,
        );

        return acc + finalProfit;
      },
      initialLongBudget,
    );

    const initialShortBudget = 1000;
    const totalShortProfit = reduce(
      [...shortCorridors.filter((corridor) => corridor.candles.length > 0)],
      (acc, corridor) => {
        const { finalProfit } = runHardcoreBackTest(
          corridor.candles,
          corridor.hightBoundaryPrice,
          corridor.lowBoundaryPrice,
          corridor.numGrids,
          acc,
          leverage,
          corridor.sentiment,
        );

        return acc + finalProfit;
      },
      initialShortBudget,
    );

    console.log("Total Long Backtest Performance:", totalLongProfit.toFixed(2));
    console.log(
      "Total Short Backtest Performance:",
      totalShortProfit.toFixed(2),
    );
    const totalCombinedProfit =
      totalLongProfit +
      totalShortProfit -
      initialLongBudget -
      initialShortBudget;
    console.log(
      "Total Combined Backtest Profit:",
      totalCombinedProfit.toFixed(2),
      "ROI: " +
        (
          (totalCombinedProfit / (initialLongBudget + initialShortBudget)) *
          100
        ).toFixed(2) +
        "%",
      "Leverage: " + leverage,
    );

    const chartContainer = document.getElementById("colossus-chart");

    const chartOptions = {
      grid: {
        vertLines: {
          color: "transparent",
        },
        horzLines: {
          color: "transparent",
        },
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
    };

    if (!chartContainer) {
      console.error("Chart container not found");
      return;
    }

    const chart = createChart(chartContainer, chartOptions) as IChartApi;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: `#${CHART_COLORS.candlestickSeries[SENTIMENTS.BULLISH]}`,
      downColor: `#${CHART_COLORS.candlestickSeries[SENTIMENTS.BEARISH]}`,
      borderVisible: true,
      wickUpColor: `#${CHART_COLORS.candlestickSeries[SENTIMENTS.BULLISH]}`,
      wickDownColor: `#${CHART_COLORS.candlestickSeries[SENTIMENTS.BEARISH]}`,
    });

    candlestickSeries.setData(candles);

    // Map sentiment data to rectangle markers
    const sentimentMarkers = mapNewsSentimentsToRectangleMarkers(
      newsSentiments,
      { lowestPrice, highestPrice },
    );

    // Map trade advice data to rectangle markers
    const tradeAdviceMarkers =
      mapTradeAdviceToRectangleMarkers(gridSetupAdvices);

    const normalizedSentimentMarkers = normalizeChartRectangles(
      sentimentMarkers,
      timeGrid,
    );

    // Create and attach sentiment markers primitive
    const sentimentMarkersSeriesPrimitive = new RectangleSeriesPrimitive(
      normalizedSentimentMarkers,
    );

    const normalizedTradeAdviceMarkers = normalizeChartRectangles(
      tradeAdviceMarkers,
      timeGrid,
    );

    // Create and attach trade advice markers primitive
    const tradeAdviceSeriesPrimitive = new RectangleSeriesPrimitive(
      normalizedTradeAdviceMarkers,
      {
        drawBorderLines: true,
      },
    );

    candlestickSeries.attachPrimitive(sentimentMarkersSeriesPrimitive);
    candlestickSeries.attachPrimitive(tradeAdviceSeriesPrimitive);

    ///

    const tradeAdviceCorridorsMarkers = mapTradeAdviceToRectangleMarkers(
      corridors,
      {
        [SENTIMENTS.BULLISH]: "rgba(100, 255, 150, 0.1)",
      },
    );

    const normalizedTradeAdviceCorridorsMarkers = normalizeChartRectangles(
      tradeAdviceCorridorsMarkers,
      timeGrid,
    );

    const tradeAdviceCorridorsSeriesPrimitive = new RectangleSeriesPrimitive(
      normalizedTradeAdviceCorridorsMarkers,
      {
        drawBorderLines: true,
      },
    );

    candlestickSeries.attachPrimitive(tradeAdviceCorridorsSeriesPrimitive);

    ///

    const tradeAdviceShortCorridorsMarkers = mapTradeAdviceToRectangleMarkers(
      shortCorridors,
      {
        [SENTIMENTS.BEARISH]: "rgba(255, 100, 100, 0.1)",
      },
    );

    const normalizedTradeAdviceShortCorridorsMarkers = normalizeChartRectangles(
      tradeAdviceShortCorridorsMarkers,
      timeGrid,
    );

    const tradeAdviceShortCorridorsSeriesPrimitive =
      new RectangleSeriesPrimitive(normalizedTradeAdviceShortCorridorsMarkers, {
        drawBorderLines: true,
      });

    candlestickSeries.attachPrimitive(tradeAdviceShortCorridorsSeriesPrimitive);

    ///

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [candles, newsSentiments, gridSetupAdvices]);

  return (
    <div
      id="colossus-chart"
      style={{
        height: "100vh",
        width: "100vw",
      }}
    ></div>
  );
};

export default ColossusChart;
