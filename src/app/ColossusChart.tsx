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
import { forEach, last, reduce } from "lodash";
import {
  TradeSetupAdvice,
  TradeSetupAdviceCorridor,
} from "./data/database/db-services/grid-setup-advice.service";
import { runHardcoreBacktest } from "@/utils/grid-backtest";

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

    const corridors = gridSetupAdvices.reduce((acc, advice) => {
      const lastCorridor = last(acc);

      if (advice.sentiment === SENTIMENTS.BULLISH) {
        const advicePriceRange =
          advice.hightBoundaryPrice - advice.lowBoundaryPrice;
        if (lastCorridor?.open) {
          const lastCorridorPriceRange =
            lastCorridor.hightBoundaryPrice - lastCorridor.lowBoundaryPrice;

          if (advicePriceRange < lastCorridorPriceRange) {
            lastCorridor.open = false;
            lastCorridor.endTime = advice.startTime;
            acc.push({
              ...advice,
              open: true,
              candles: [],
            });
          } else {
            lastCorridor.endTime = advice.endTime;
          }
        } else {
          acc.push({
            ...advice,
            open: true,
            candles: [],
          });
        }
      }

      if (advice.sentiment === SENTIMENTS.BEARISH) {
        if (lastCorridor?.open) {
          lastCorridor.endTime = advice.startTime;
          lastCorridor.open = false;
        }
      }

      return acc;
    }, [] as TradeSetupAdviceCorridor[]);

    forEach(corridors, (corridor) => {
      corridor.candles = candles.filter(
        (candle) =>
          (candle.time as UTCTimestamp) >= corridor.startTime &&
          (candle.time as UTCTimestamp) <= corridor.endTime,
      );
    });

    const totalProfit = reduce(
      corridors,
      (acc, corridor) => {
        const { finalProfit } = runHardcoreBacktest(
          corridor.candles,
          corridor.hightBoundaryPrice,
          corridor.lowBoundaryPrice,
          corridor.numGrids,
          acc,
        );

        return acc + finalProfit;
      },
      1000,
    );

    console.log("Total Backtest Profit:", totalProfit.toFixed(2));

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
        [SENTIMENTS.BULLISH]: "rgba(100, 255, 150, 0.2)",
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
