import lodash from "lodash";
import CandleStick, { TCandleStick } from "../schemas/candle-stick";

class CandlesDataService {
  async fetchPairCandles(pair: string, days: number): Promise<TCandleStick[]> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const candles = await CandleStick.find({
      pair,
      openTime: { $gte: sinceDate },
    }).sort({ openTime: 1 });

    const candlesUnique = lodash.uniqBy(candles, (candle: TCandleStick) =>
      candle.openTime.getTime(),
    );

    return candlesUnique;
  }
}

export default CandlesDataService;
