import mongoose, { InferSchemaType } from "mongoose";
import { SENTIMENTS } from "../../../constants";

const newsAggregationSchema = new mongoose.Schema({
  newsAnalyzed: {
    type: Number,
    required: true,
  },
  analysis: {
    type: String,
    required: true,
  },
  mostMentionedSymbols: {
    type: [String],
    required: true,
  },
  timeRange: {
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
    },
    hoursBack: {
      type: Number,
      default: 4,
    },
  },
  sentiment: {
    type: String,
    enum: Object.values(SENTIMENTS),
    default: SENTIMENTS.NEUTRAL,
  },
  createdAt: { type: Date, default: Date.now },
});

const NewsAggregation =
  mongoose.models.NewsAggregation ||
  mongoose.model("NewsAggregation", newsAggregationSchema);

export type TNewsAggregation = InferSchemaType<typeof newsAggregationSchema>;

export default NewsAggregation;
