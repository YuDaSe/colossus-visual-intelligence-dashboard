import UsInflationRate from "../schemas/us-inflation-rate";

export interface InflationRate {
  date: Date;
  inflationIndex: number;
}

class UsInflationRateService {
  async fetchByDays(days: number): Promise<InflationRate[]> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    return UsInflationRate.find({ date: { $gte: sinceDate } })
      .select("date inflationIndex -_id")
      .sort({ date: 1 })
      .lean();
  }
}

export default UsInflationRateService;
