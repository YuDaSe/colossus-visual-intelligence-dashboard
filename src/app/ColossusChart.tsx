"use client";

import { useEffect, useRef } from "react";
import {
  ColorType,
  createChart,
  CandlestickSeries,
  LineSeries,
  IChartApi,
  OhlcData,
  UTCTimestamp,
} from "lightweight-charts";
import { SENTIMENTS, CHART_COLORS } from "../constants";
import {
  getChartTime,
  mapTradeAdviceToRectangleMarkers,
  normalizeChartRectangles,
} from "@/utils/mappers";
import {
  RectangleMarker,
  RectangleSeriesPrimitive,
} from "./primitives/RectangleSeriesPrimitive";

export interface ChartNewsSentiment {
  sentiment: string;
  timeRange: { start: Date; end: Date };
}

export interface ChartTradeSetupAdvice {
  hightBoundaryPrice: number;
  lowBoundaryPrice: number;
  startTime: number;
  endTime: number;
  sentiment: string;
  numGrids: number;
}

export interface ChartInflationRate {
  date: Date;
  inflationIndex: number;
}

export interface ChartCorridorColors {
  bullish?: string;
  bearish?: string;
  neutral?: string;
}

const ColossusChart = ({
  candles,
  newsSentiments,
  gridSetupAdvices,
  gridSetups,
  gridSetupsColors,
  inflationRates,
}: {
  candles: OhlcData[];
  newsSentiments: ChartNewsSentiment[];
  gridSetupAdvices: ChartTradeSetupAdvice[];
  gridSetups: ChartTradeSetupAdvice[];
  gridSetupsColors?: ChartCorridorColors;
  inflationRates: ChartInflationRate[];
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

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
        panes: {
          // separatorColor: "#f22c3d",
          separatorHoverColor: "rgba(255, 0, 0, 0.1)",
          // setting this to false will disable the resize of the panes by the user
          enableResize: false,
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
    const sentimentMarkers: RectangleMarker[] = newsSentiments.map((s) => ({
      p1: { time: getChartTime(s.timeRange.start), price: lowestPrice },
      p2: { time: getChartTime(s.timeRange.end), price: highestPrice },
      color:
        CHART_COLORS.sentimentMarkers[s.sentiment] ||
        CHART_COLORS.sentimentMarkers[SENTIMENTS.NEUTRAL],
    }));
    const normalizedSentimentMarkers = normalizeChartRectangles(
      sentimentMarkers,
      timeGrid,
    );
    candlestickSeries.attachPrimitive(
      new RectangleSeriesPrimitive(normalizedSentimentMarkers),
    );

    // Trade advice markers (raw setup boxes)
    const tradeAdviceMarkers = mapTradeAdviceToRectangleMarkers(gridSetupAdvices);
    const normalizedTradeAdviceMarkers = normalizeChartRectangles(
      tradeAdviceMarkers,
      timeGrid,
    );
    candlestickSeries.attachPrimitive(
      new RectangleSeriesPrimitive(normalizedTradeAdviceMarkers, {
        drawBorderLines: true,
      }),
    );

    // Grid setup corridors (long + short, pre-filtered by container)
    if (gridSetups.length > 0) {
      const corridorColorOverrides: Record<string, string> = {};
      if (gridSetupsColors?.bullish) corridorColorOverrides[SENTIMENTS.BULLISH] = gridSetupsColors.bullish;
      if (gridSetupsColors?.bearish) corridorColorOverrides[SENTIMENTS.BEARISH] = gridSetupsColors.bearish;
      if (gridSetupsColors?.neutral) corridorColorOverrides[SENTIMENTS.NEUTRAL] = gridSetupsColors.neutral;

      const gridSetupsMarkers = mapTradeAdviceToRectangleMarkers(
        gridSetups,
        Object.keys(corridorColorOverrides).length > 0 ? corridorColorOverrides : undefined,
      );
      const normalizedGridSetupsMarkers = normalizeChartRectangles(
        gridSetupsMarkers,
        timeGrid,
      );
      candlestickSeries.attachPrimitive(
        new RectangleSeriesPrimitive(normalizedGridSetupsMarkers, {
          drawBorderLines: true,
        }),
      );
    }

    // Inflation line series in a second pane
    if (inflationRates.length > 0) {
      const lineSeries = chart.addSeries(
        LineSeries,
        {
          color: "#f5c542",
          lineWidth: 2,
        },
        1,
      );

      const inflationData = inflationRates.map((r) => ({
        time: getChartTime(r.date),
        value: r.inflationIndex,
      }));

      lineSeries.setData(inflationData);

      const inflationPane = chart.panes()[1];
      // inflationPane.moveTo(0);
      inflationPane.setHeight(150);
    }

    chart.timeScale().fitContent();

    return () => {
      chartRef.current = null;
      chart.remove();
    };
  }, [candles, newsSentiments, gridSetupAdvices, gridSetups, gridSetupsColors, inflationRates]);

  return (
    <div ref={chartContainerRef} style={{ height: "100%", width: "100%" }} />
  );
};

export default ColossusChart;
