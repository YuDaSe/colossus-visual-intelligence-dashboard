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

  async saveRate(date: Date, inflationIndex: number): Promise<InflationRate> {
    const doc = await UsInflationRate.create({ date, inflationIndex });
    return { date: doc.date, inflationIndex: doc.inflationIndex };
  }
}

export default UsInflationRateService;
