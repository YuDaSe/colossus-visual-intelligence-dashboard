import mongoose, { InferSchemaType } from "mongoose";
import { CANDLE_INTERVALS } from "../../../constants";

const candleStickSchema = new mongoose.Schema(
  {
    openTime: {
      type: Date,
      required: true,
      index: true,
      // Example: 1765612800000
    },
    openPrice: {
      type: String,
      required: true,
      // Example: '90329.98000000'
    },
    highPrice: {
      type: String,
      required: true,
      // Example: '90575.28000000'
    },
    lowPrice: {
      type: String,
      required: true,
      // Example: '90318.67000000'
    },
    closePrice: {
      type: String,
      required: true,
      // Example: '90507.59000000'
    },
    volume: {
      type: String,
      required: true,
      // Example: '558.83465000'
    },
    closeTime: {
      type: Date,
      required: true,
      // Example: 1765627199999
    },
    quoteAssetVolume: {
      type: String,
      required: true,
      // Example: '50552788.28022700'
    },
    numberOfTrades: {
      type: Number,
      required: true,
      // Example: 143844
    },
    takerBuyBaseAssetVolume: {
      type: String,
      required: true,
      // Example: '285.11751000'
    },
    takerBuyQuoteAssetVolume: {
      type: String,
      required: true,
      // Example: '25792716.90043390'
    },
    pair: {
      type: String,
      required: true,
      index: true,
    },
    interval: {
      type: String,
      enum: Object.values(CANDLE_INTERVALS),
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export type TCandleStick = InferSchemaType<typeof candleStickSchema>;

export default mongoose.models.CandleStick ||
  mongoose.model("CandleStick", candleStickSchema);
