"use client";

import { useEffect } from "react";
import {
  ColorType,
  createChart,
  CandlestickSeries,
  IChartApi,
  OhlcData,
} from "lightweight-charts";
import { SENTIMENTS, CHART_COLORS } from "../constants";
import {
  mapNewsSentimentsToRectangleMarkers,
  mapTradeAdviceToRectangleMarkers,
} from "@/utils/mappers";
import { RectangleSeriesPrimitive } from "./primitives/RectangleSeriesPrimitive";
import { NewsSentiment } from "./data/database/db-services/news-aggregation-service";

export interface TradeSetupAdvice {
  hightBoundaryPrice: number;
  lowBoundaryPrice: number;
  startTime: number;
  endTime: number;
  sentiment: string;
}

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

    const chartContainer = document.getElementById("chart-test");

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

    // Create and attach sentiment markers primitive
    const sentimentMarkersSeriesPrimitive = new RectangleSeriesPrimitive(
      sentimentMarkers,
    );

    // Create and attach trade advice markers primitive
    const tradeAdviceSeriesPrimitive = new RectangleSeriesPrimitive(
      tradeAdviceMarkers,
      {
        drawBorderLines: true,
      }
    );

    candlestickSeries.attachPrimitive(sentimentMarkersSeriesPrimitive);
    candlestickSeries.attachPrimitive(tradeAdviceSeriesPrimitive);

    chart.timeScale().fitContent();
  });

  return (
    <div className="bloody-chart">
      <div
        id="chart-test"
        style={{
          height: "100vh",
          width: "100vw",
        }}
      ></div>
    </div>
  );
};

export default ColossusChart;
