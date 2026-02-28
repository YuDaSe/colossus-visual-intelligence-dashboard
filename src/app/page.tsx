import BloodyChart from "./BloodyChart";
import { connectToDb } from "./data/database/utils/with-db";
import CandlesDataService from "./data/database/db-services/candles-data-service";
import { OhlcData, UTCTimestamp } from "lightweight-charts";
import { TCandleStick } from "./data/database/schemas/candle-stick";
import NewsAggregationService, {
  NewsSentiment,
} from "./data/database/db-services/news-aggregation-service";
import GridSetupAdviceService from "./data/database/db-services/grid-setup-advice.service";
import { SENTIMENTS } from "./constants";

const daysToFetch = 80;

export default async function Home() {
  await connectToDb();

  const candlesDataService = new CandlesDataService();
  const newsAggregationService = new NewsAggregationService();
  const gridSetupAdviceService = new GridSetupAdviceService();

  const candles = await candlesDataService.fetchPairCandles(
    "BTCUSDT",
    daysToFetch,
  );
  const newsAggregations =
    await newsAggregationService.fetchRecentAggregationsNarrative(daysToFetch);
  const gridSetupAdvices = await gridSetupAdviceService.fetchSetupAggregations(
    "BTCUSDT",
    daysToFetch,
  );

  const chartCandles: OhlcData[] = candles.map(
    (candle: TCandleStick, index: number) => {
      const nextCandle = candles[index + 1];

      return {
        time: candle.openTime.getTime() / 1000 as UTCTimestamp,  // Convert to seconds
        open: parseFloat(candle.openPrice),
        high: parseFloat(candle.highPrice),
        low: parseFloat(candle.lowPrice),
        close: nextCandle
          ? parseFloat(nextCandle.openPrice)
          : parseFloat(candle.closePrice),
      };
    },
  );

  const chartNewsSentiments: NewsSentiment[] = newsAggregations.map(
    (aggregation) => {
      return {
        sentiment: aggregation.sentiment,
        createdAt: aggregation.createdAt,
        timeRange: {
          start: aggregation.timeRange.start,
          end: aggregation.timeRange.end,
        },
      };
    },
  );

  const chartGridSetupAdvices = gridSetupAdvices.map((advice, index) => {
    const nextAdvice = gridSetupAdvices[index + 1];

    return {
      hightBoundaryPrice:
        Number(advice.longGridSettings?.hightBoundaryPrice) || 0,
      lowBoundaryPrice: Number(advice.longGridSettings?.lowBoundaryPrice) || 0,
      startTime: advice.createdAt.getTime() / 1000, // Convert to seconds
      endTime: nextAdvice
        ? nextAdvice.createdAt.getTime() / 1000
        : advice.createdAt.getTime() / 1000 + 4 * 60 * 60, // Example: 4 hours later
      sentiment:
        advice.shouldCloseOpenLongGridsRecommendationFrom1to10 > 7
          ? SENTIMENTS.BEARISH
          : advice.canGoLongRecommendationFrom1to10 > 7
            ? SENTIMENTS.BULLISH
            : SENTIMENTS.NEUTRAL,
    };
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <BloodyChart
        candles={chartCandles}
        newsSentiments={chartNewsSentiments}
        gridSetupAdvices={chartGridSetupAdvices}
      />
    </div>
  );
}
