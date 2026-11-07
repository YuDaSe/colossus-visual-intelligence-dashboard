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
  LineStyle,
  LineWidth,
} from "lightweight-charts";
import {
  getChartTime,
  mapTradeAdviceToRectangleMarkers,
} from "@/utils/mappers";
import {
  RectangleMarker,
  RectangleSeriesPrimitive,
} from "./primitives/RectangleSeriesPrimitive";
import { normalizeChartRectangles } from "./utils/normalizeChartRectangles";
import {
  Sentiment,
  ChartColors,
  ChartNewsSentiment,
  ChartTradeSetupAdvice,
  ChartInflationRate,
  ChartCorridorColors,
} from "./types";
import { forEach } from "lodash";
import type { ChartSettingsState } from "../ChartSettings";

export type {
  ChartNewsSentiment,
  ChartTradeSetupAdvice,
  ChartInflationRate,
  ChartCorridorColors,
  ChartColors,
};

export interface CharIndicator {
  points: { time: UTCTimestamp; value: number }[];
  color: string;
  lineWidth: LineWidth;
}

const ColossusChart = ({
  candles,
  newsSentiments,
  gridSetupAdvices,
  gridSetups,
  gridSetupsColors,
  inflationRates,
  inflationIndicators,
  chartColors,
  // smaData,
  chartIndicators,
  macd,
  balanceDynamic,
  settings,
}: {
  candles: OhlcData[];
  newsSentiments: ChartNewsSentiment[];
  gridSetupAdvices: ChartTradeSetupAdvice[];
  gridSetups: ChartTradeSetupAdvice[];
  gridSetupsColors?: ChartCorridorColors;
  inflationRates: ChartInflationRate[];
  inflationIndicators: CharIndicator[];
  chartColors: ChartColors;
  // smaData?: { time: UTCTimestamp; value: number }[];
  chartIndicators?: CharIndicator[];
  macd?: {
    macd: CharIndicator[];
    signal: CharIndicator[];
  };
  balanceDynamic?: { time: UTCTimestamp; value: number }[];
  settings: ChartSettingsState;
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const hasInflationPaneData = settings.showInflationRatesPanel;
  const hasMacdPaneData = settings.showMacdPanel;
  const hasBalancePaneData = settings.showBalanceDynamicPanel;
  const secondaryPaneCount =
    Number(hasInflationPaneData) +
    Number(hasMacdPaneData) +
    Number(hasBalancePaneData);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.resize(
          chartContainerRef.current.clientWidth,
          chartContainerRef.current.clientHeight,
        );

        const mainPane = chartRef.current?.panes()[0];
        if (mainPane) {
          mainPane.setHeight(
            Math.max(
              chartContainerRef.current!.clientHeight -
                secondaryPaneCount * 160 -
                24,
              320,
            ),
          );
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [secondaryPaneCount]);

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
        vertLines: {
          color: "#555",
          style: LineStyle.Dashed,
        },
        horzLines: {
          color: "#555",
          style: LineStyle.Dashed,
        },
      },
      layout: {
        textColor: "white",
        background: {
          type: ColorType.Solid,
          color: chartColors.layout.backgroundColor,
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
        borderColor: chartColors.timeScale.borderColor,
      },
    }) as IChartApi;

    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: `#${chartColors.candlestickSeries[Sentiment.BULLISH]}`,
      downColor: `#${chartColors.candlestickSeries[Sentiment.BEARISH]}`,
      borderVisible: true,
      wickUpColor: `#${chartColors.candlestickSeries[Sentiment.BULLISH]}`,
      wickDownColor: `#${chartColors.candlestickSeries[Sentiment.BEARISH]}`,
    });

    candlestickSeries.setData(candles);

    // Sentiment markers
    const sentimentMarkers: RectangleMarker[] = newsSentiments.map((s) => ({
      p1: { time: getChartTime(s.timeRange.start), price: lowestPrice },
      p2: { time: getChartTime(s.timeRange.end), price: highestPrice },
      color:
        chartColors.sentimentMarkers[s.sentiment] ||
        chartColors.sentimentMarkers[Sentiment.NEUTRAL],
    }));
    const normalizedSentimentMarkers = normalizeChartRectangles(
      sentimentMarkers,
      timeGrid,
    );
    candlestickSeries.attachPrimitive(
      new RectangleSeriesPrimitive(normalizedSentimentMarkers),
    );

    // Trade advice markers (raw setup boxes)
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

    // Grid setup corridors (long + short, pre-filtered by container)
    if (gridSetups.length > 0) {
      const corridorColorOverrides: Record<string, string> = {};
      if (gridSetupsColors?.bullish)
        corridorColorOverrides[Sentiment.BULLISH] = gridSetupsColors.bullish;
      if (gridSetupsColors?.bearish)
        corridorColorOverrides[Sentiment.BEARISH] = gridSetupsColors.bearish;
      if (gridSetupsColors?.neutral)
        corridorColorOverrides[Sentiment.NEUTRAL] = gridSetupsColors.neutral;

      const gridSetupsMarkers = mapTradeAdviceToRectangleMarkers(
        gridSetups,
        Object.keys(corridorColorOverrides).length > 0
          ? corridorColorOverrides
          : undefined,
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

    let nextPaneIndex = 1;
    const inflationPaneIndex = hasInflationPaneData ? nextPaneIndex++ : undefined;
    const macdPaneIndex = hasMacdPaneData ? nextPaneIndex++ : undefined;
    const balancePaneIndex = hasBalancePaneData ? nextPaneIndex : undefined;

    if (hasInflationPaneData && inflationPaneIndex !== undefined) {
      const lineSeries = chart.addSeries(
        LineSeries,
        {
          color: "#f5c542",
          lineWidth: 2,
          title: "Inflation",
        },
        inflationPaneIndex,
      );

      const inflationPane = chart.panes()[inflationPaneIndex];
      if (inflationPane) {
        inflationPane.setHeight(160);
      }

      const inflationData = inflationRates.map((r) => ({
        time: getChartTime(r.date),
        value: r.inflationIndex,
      }));

      lineSeries.setData(inflationData);

      forEach(inflationIndicators, (indicator) => {
        const inflationIndicatorData = indicator.points.map((r) => ({
          time: getChartTime(r.time),
          value: r.value,
        }));

        const inflationIndicatorSeries = chart.addSeries(
          LineSeries,
          {
            color: indicator.color,
            lineWidth: indicator.lineWidth,
            priceLineVisible: false,
            lastValueVisible: false,
            title:
              indicator.color === "#42f59e" ? "Inflation SMA" : "Inflation EMA",
          },
          inflationPaneIndex,
        );
        inflationIndicatorSeries.setData(inflationIndicatorData);
      });
    }

    if (hasMacdPaneData && macdPaneIndex !== undefined) {
      const zeroLineSeries = chart.addSeries(
        LineSeries,
        {
          color: "#ffffff",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          priceLineVisible: false,
          lastValueVisible: false,
          title: "Zero",
        },
        macdPaneIndex,
      );

      zeroLineSeries.setData(
        candles.map((candle) => ({
          time: candle.time as UTCTimestamp,
          value: 0,
        })),
      );

      forEach(macd?.macd ?? [], (indicator) => {
        const macdSeries = chart.addSeries(
          LineSeries,
          {
            color: indicator.color,
            lineWidth: indicator.lineWidth,
            priceLineVisible: false,
            lastValueVisible: false,
            title: "MACD",
          },
          macdPaneIndex,
        );
        macdSeries.setData(indicator.points);
      });

      forEach(macd?.signal ?? [], (indicator) => {
        const signalSeries = chart.addSeries(
          LineSeries,
          {
            color: indicator.color,
            lineWidth: indicator.lineWidth,
            priceLineVisible: false,
            lastValueVisible: false,
            title: "Signal",
          },
          macdPaneIndex,
        );
        signalSeries.setData(indicator.points);
      });

      const macdPane = chart.panes()[macdPaneIndex];
      if (macdPane) {
        macdPane.setHeight(160);
      }
    }

    if (hasBalancePaneData && balancePaneIndex !== undefined) {
      const balanceSeries = chart.addSeries(
        LineSeries,
        {
          color: "#00d9ff",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          title: "Balance",
        },
        balancePaneIndex,
      );

      balanceSeries.setData(balanceDynamic ?? []);

      const balancePane = chart.panes()[balancePaneIndex];
      if (balancePane) {
        balancePane.setHeight(160);
      }
    }

    forEach(chartIndicators, (indicator) => {
      const lineSeries = chart.addSeries(LineSeries, {
        color: indicator.color,
        lineWidth: indicator.lineWidth,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      lineSeries.setData(indicator.points);
    });

    const initialBars = 200;
    const rightPadding = Math.floor(initialBars / 3);
    chart.timeScale().setVisibleLogicalRange({
      from: candles.length - initialBars,
      to: candles.length - 1 + rightPadding,
    });

    return () => {
      chartRef.current = null;
      chart.remove();
    };
  }, [
    candles,
    newsSentiments,
    gridSetupAdvices,
    gridSetups,
    gridSetupsColors,
    inflationRates,
    chartColors,
    chartIndicators,
    inflationIndicators,
    macd,
    balanceDynamic,
    settings,
    hasInflationPaneData,
    hasMacdPaneData,
    hasBalancePaneData,
  ]);

  return (
    <div ref={chartContainerRef} style={{ height: "100%", width: "100%" }} />
  );
};

export default ColossusChart;
