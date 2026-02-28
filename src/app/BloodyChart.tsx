"use client";

import { useEffect } from "react";
import {
  ColorType,
  createChart,
  CandlestickSeries,
  ISeriesPrimitive,
  IChartApi,
  LineSeries,
  OhlcData,
} from "lightweight-charts";
import { NewsSentiment } from "./data/database/db-services/news-aggregation-service";
import { SENTIMENTS, CHART_COLORS } from "./constants";

// 1. The Renderer: This handles the actual Canvas drawing
class RectangleRenderer {
  constructor(data) {
    this._data = data;
  }

  draw(target, converter) {
    // console.log("Drawing rectangles with data:", target);


    target.useBitmapCoordinateSpace((scope) => {
      const { context, horizontalPixelRatio, verticalPixelRatio } = scope;

      // const ctx = scope.context;

      const mappedRects = this._data.rects.map((rectData) => {
        return {
          x1: this._data.timeToCoordinate(rectData.p1.time),
          y1: this._data.priceToCoordinate(rectData.p1.price),
          x2: this._data.timeToCoordinate(rectData.p2.time),
          y2: this._data.priceToCoordinate(rectData.p2.price),
          color: rectData.color,
        };
      });

      const fixedRects = mappedRects.map((rect, index) => {
        const prevRect = mappedRects[index - 1];
        const nextRect = mappedRects[index + 1];
        
        if (rect.x1 === null) {
          rect.x1 = prevRect && prevRect.x2 ? prevRect.x2 : nextRect.x1;
        }

        if (rect.x2 === null) {
          rect.x2 = nextRect && nextRect.x1 ? nextRect.x1 : prevRect.x2 + 20;
        }

        return rect;
      });

      fixedRects.forEach((rect) => {
        context.fillStyle = rect.color; //this._fillColor;
        context.fillRect(
          rect.x1 * horizontalPixelRatio,
          rect.y1 * verticalPixelRatio,
          (rect.x2 - rect.x1) * horizontalPixelRatio,
          (rect.y2 - rect.y1) * verticalPixelRatio,
        );
      });
    });
  }
}

// 2. The Primitive: The bridge between the Chart and the Renderer
class RectanglePrimitive {
  constructor(rects, { priceToCoordinate, timeToCoordinate }) {
    this._rects = rects;
    this._priceToCoordinate = priceToCoordinate;
    this._timeToCoordinate = timeToCoordinate;
  }

  // This method is required by the ISeriesPrimitive interface
  updateAllViews() {}

  paneViews() {
    return [
      {
        zOrder: () => "bottom",
        renderer: () =>
          new RectangleRenderer({
            rects: this._rects,
            priceToCoordinate: this._priceToCoordinate,
            timeToCoordinate: this._timeToCoordinate,
          }),
      },
    ];
  }
}

export interface TradeSetupAdvice {
  hightBoundaryPrice: number;
  lowBoundaryPrice: number;
  startTime: number;
  endTime: number;
  sentiment: string;
}

const BloodyChart = ({
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
            color: 'transparent', // Example: a dark gray color
        },
        horzLines: {
            color: 'transparent', // Example: a dark gray color
        },
    },
      layout: {
        textColor: "white",
        background: { type: ColorType.Solid, color: CHART_COLORS.layout.backgroundColor },
      },
      timeScale: {
        timeVisible: true, // Essential: Shows the HH:mm:ss
        secondsVisible: false, // Keeps it tidy for 4h intervals
        borderColor: "rgba(42, 46, 57, 0.5)",
      },
    };

    if (!chartContainer) {
      console.error("Chart container not found");
      return;
    }

    const chart = createChart(chartContainer, chartOptions) as IChartApi;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      // upColor: "#1DCED8",
      upColor: `#${CHART_COLORS.candlestickSeries[SENTIMENTS.BULLISH]}`,
      downColor: `#${CHART_COLORS.candlestickSeries[SENTIMENTS.BEARISH]}`,
      borderVisible: true,
      wickUpColor: `#${CHART_COLORS.candlestickSeries[SENTIMENTS.BULLISH]}`,
      wickDownColor: `#${CHART_COLORS.candlestickSeries[SENTIMENTS.BEARISH]}`,
    });

    candlestickSeries.setData(candles);

    const lineSeries = chart.addSeries(LineSeries);

    const timeScale = chart.timeScale();

    const sentimentMarkers = newsSentiments.map((sentiment) => {
      const color =
        CHART_COLORS.sentimentMarkers[sentiment.sentiment] ||
        CHART_COLORS.sentimentMarkers[SENTIMENTS.NEUTRAL];

      const p1Time = new Date(sentiment.timeRange.start)
      p1Time.setMinutes(0, 0, 0);
      const p2Time = new Date(sentiment.timeRange.end)
      p2Time.setMinutes(0, 0, 0);

      return {
        p1: { 
          // time: Math.ceil(sentiment.timeRange.start.getTime() / 1000), 
          time: p1Time.getTime() / 1000, // Align to the hour
          price: lowestPrice },
        p2: { 
          // time: Math.ceil(sentiment.timeRange.end.getTime() / 1000), 
          time: p2Time.getTime() / 1000, // Align to the hour
          price: highestPrice 
        },
        color,
      };
    });

    const tradeAdviceMarkers = gridSetupAdvices.map((advice) => {
      const color =
        CHART_COLORS.tradeAdviceMarkers[advice.sentiment] ||
        CHART_COLORS.tradeAdviceMarkers[SENTIMENTS.NEUTRAL];

      const p1Time = new Date(advice.startTime * 1000)
      p1Time.setMinutes(0, 0, 0);
      const p2Time = new Date(advice.endTime * 1000)
      p2Time.setMinutes(0, 0, 0);

      return {
        p1: { 
          // time: advice.startTime,
          // time: (new Date(advice.startTime * 1000)).toISOString().split('T')[0],
          time: p1Time.getTime() / 1000, // Align to the hour
          price: advice.lowBoundaryPrice },
        p2: { 
          // time: advice.endTime,
          // time: (new Date(advice.endTime * 1000)).toISOString().split('T')[0],
          time: p2Time.getTime() / 1000, // Align to the hour
          price: advice.hightBoundaryPrice 
        },
        color,
      };
    });
          
    const myRect = new RectanglePrimitive(
      sentimentMarkers,
      {
        priceToCoordinate:
          candlestickSeries.priceToCoordinate.bind(candlestickSeries),
        timeToCoordinate: timeScale.timeToCoordinate.bind(timeScale),
      },
    );

    const myRect2 = new RectanglePrimitive(
      tradeAdviceMarkers,
      {
        priceToCoordinate:
          candlestickSeries.priceToCoordinate.bind(candlestickSeries),
        timeToCoordinate: timeScale.timeToCoordinate.bind(timeScale),
      },
    );

    lineSeries.attachPrimitive(myRect);
    lineSeries.attachPrimitive(myRect2);

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

export default BloodyChart;
