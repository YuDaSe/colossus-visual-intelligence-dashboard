import mongoose, { InferSchemaType } from "mongoose";

const gridSetupAdviceSchema = new mongoose.Schema({
  // Trading pair information
  pair: {
    type: String,
    required: true,
    index: true,
  },

  // AI-generated recommendation
  shortRecommendationExplanation: {
    type: String,
    required: true,
  },

  // Long recommendation score (1-10)
  canGoLongRecommendationFrom1to10: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },

  // Long grid settings
  longGridSettings: {
    entryPrice: {
      type: String,
      required: true,
    },
    hightBoundaryPrice: {
      type: String,
      required: true,
    },
    lowBoundaryPrice: {
      type: String,
      required: true,
    },
    gridStepPercent: {
      type: Number,
      required: true,
    },
    numberOfGridLevels: {
      type: Number,
      required: true,
    },
  },

  // Close recommendation score (1-10)
  shouldCloseOpenLongGridsRecommendationFrom1to10: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

export type TGridSetupAdvice = InferSchemaType<typeof gridSetupAdviceSchema>;

const GridSetupAdvice =
  mongoose.models.GridSetupAdvice ||
  mongoose.model("GridSetupAdvice", gridSetupAdviceSchema);

export default GridSetupAdvice;
