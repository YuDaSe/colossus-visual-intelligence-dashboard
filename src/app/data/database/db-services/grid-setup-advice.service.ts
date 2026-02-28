import GridSetupAdvice from "../schemas/grid-setup-advice";

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
