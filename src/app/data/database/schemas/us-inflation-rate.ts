import mongoose, { InferSchemaType } from "mongoose";

const usInflationRateSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
  },
  inflationIndex: {
    type: Number,
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const UsInflationRate =
  mongoose.models.UsInflationRate ||
  mongoose.model("UsInflationRate", usInflationRateSchema);

export type TUsInflationRate = InferSchemaType<typeof usInflationRateSchema>;

export default UsInflationRate;
