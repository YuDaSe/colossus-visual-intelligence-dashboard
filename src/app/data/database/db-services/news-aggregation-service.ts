import NewsAggregation from "../schemas/news-aggregation";

export interface NewsSentiment {
  sentiment: string;
  createdAt: Date;
  timeRange: {
    start: Date;
    end: Date;
  };
}

class NewsAggregationService {
  async fetchRecentAggregationsNarrative(
    days: number,
  ): Promise<NewsSentiment[]> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    return NewsAggregation.find({ createdAt: { $gte: sinceDate } })
      .select("sentiment createdAt timeRange -_id")
      .sort({
        createdAt: -1,
      })
      .lean();
  }
}

export default NewsAggregationService;
