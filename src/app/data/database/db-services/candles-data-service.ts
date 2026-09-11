import lodash from "lodash";
import CandleStick, { TCandleStick } from "../schemas/candle-stick";

class CandlesDataService {
  async fetchPairCandles(
    pair: string,
    days: number,
    interval: string,
  ): Promise<TCandleStick[]> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const query: Record<string, unknown> = {
      pair,
      interval,
      openTime: { $gte: sinceDate },
    };

    const candles = await CandleStick.find(query).sort({ openTime: 1 });

    const candlesUnique = lodash.uniqBy(candles, (candle: TCandleStick) =>
      candle.openTime.getTime(),
    );

    return candlesUnique;
  }
}

export default CandlesDataService;
