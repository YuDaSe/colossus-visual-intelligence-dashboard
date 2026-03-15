import { OhlcData } from "lightweight-charts";
import GridSetupAdvice from "../schemas/grid-setup-advice";

export interface TradeSetupAdvice {
  hightBoundaryPrice: number;
  lowBoundaryPrice: number;
  startTime: number;
  endTime: number;
  sentiment: string;
  numGrids: number;
}

export interface TradeSetupAdviceCorridor extends TradeSetupAdvice {
  open: boolean;
  candles: OhlcData[];
}

class GridSetupAdviceService {
  async fetchSetupAggregations(pair: string, days: number) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    return GridSetupAdvice.find({ pair, createdAt: { $gte: sinceDate } }).sort({
      createdAt: 1,
    });
  }
}

export default GridSetupAdviceService;
