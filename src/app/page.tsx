import ColossusChartContainer from "./containers/ColossusChartContainer";
import { connectToDb } from "./data/database/utils/with-db";
import CandlesDataService from "./data/database/db-services/candles-data-service";
import { OhlcData } from "lightweight-charts";
import NewsAggregationService, {
} from "./data/database/db-services/news-aggregation-service";
import GridSetupAdviceService from "./data/database/db-services/grid-setup-advice.service";
import UsInflationRateService from "./data/database/db-services/us-inflation-rate.service";
import {
  DEFAULT_CANDLE_INTERVAL,
  DEFAULT_CANDLES_DAYS,
  PAIR,
} from "../constants";
import {
  mapCandlesToOhlc,
  mapGridSetupAdvicesToChart,
} from "../utils/mappers";

export default async function Home() {
  await connectToDb();

  // DB services
  const candlesDataService = new CandlesDataService();
  const newsAggregationService = new NewsAggregationService();
  const gridSetupAdviceService = new GridSetupAdviceService();
  const usInflationRateService = new UsInflationRateService();

  // Fetch data from DB
  const candles = await candlesDataService.fetchPairCandles(
    PAIR,
    DEFAULT_CANDLES_DAYS,
    DEFAULT_CANDLE_INTERVAL,
  );
  const newsAggregations =
    await newsAggregationService.fetchRecentAggregationsNarrative(DEFAULT_CANDLES_DAYS);
  const gridSetupAdvices = await gridSetupAdviceService.fetchSetupAggregations(
    PAIR,
    DEFAULT_CANDLES_DAYS,
  );
  const inflationRates = await usInflationRateService.fetchByDays(DEFAULT_CANDLES_DAYS);

  // Map data for chart
  const chartCandles: OhlcData[] = mapCandlesToOhlc(candles);
  const chartGridSetupAdvices = mapGridSetupAdvicesToChart(gridSetupAdvices);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <ColossusChartContainer
        pair={PAIR}
        interval={DEFAULT_CANDLE_INTERVAL}
        candles={chartCandles}
        newsSentiments={newsAggregations}
        gridSetupAdvices={chartGridSetupAdvices}
        inflationRates={inflationRates}
      />
    </div>
  );
}
