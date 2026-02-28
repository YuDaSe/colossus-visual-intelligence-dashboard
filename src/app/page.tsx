import ColossusChart from "./ColossusChart";
import { connectToDb } from "./data/database/utils/with-db";
import CandlesDataService from "./data/database/db-services/candles-data-service";
import { OhlcData } from "lightweight-charts";
import NewsAggregationService, {
} from "./data/database/db-services/news-aggregation-service";
import GridSetupAdviceService from "./data/database/db-services/grid-setup-advice.service";
import { PAIR } from "../constants";
import {
  mapCandlesToOhlc,
  mapGridSetupAdvicesToChart,
} from "../utils/mappers";

const daysToFetch = 80;

export default async function Home() {
  await connectToDb();

  // DB services
  const candlesDataService = new CandlesDataService();
  const newsAggregationService = new NewsAggregationService();
  const gridSetupAdviceService = new GridSetupAdviceService();

  // Fetch data from DB
  const candles = await candlesDataService.fetchPairCandles(PAIR, daysToFetch);
  const newsAggregations =
    await newsAggregationService.fetchRecentAggregationsNarrative(daysToFetch);
  const gridSetupAdvices = await gridSetupAdviceService.fetchSetupAggregations(
    PAIR,
    daysToFetch,
  );

  // Map data for chart
  const chartCandles: OhlcData[] = mapCandlesToOhlc(candles);
  const chartGridSetupAdvices = mapGridSetupAdvicesToChart(gridSetupAdvices);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <ColossusChart
        candles={chartCandles}
        newsSentiments={newsAggregations}
        gridSetupAdvices={chartGridSetupAdvices}
      />
    </div>
  );
}
