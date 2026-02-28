import mongoose from "mongoose";
import config from "../../../config";

/**
 * Since the mongoose module exports a singleton object,
 * you don't have to connect in your test.js to check the state of the connection:
 *
 * https://stackoverflow.com/questions/19599543/check-mongoose-connection-state-without-creating-new-connection
 *
 * @returns boolean
 */
const isConnected = (): boolean => {
  const state = mongoose.connection.readyState;

  return state === 1;
};

export const connectToDb = async (): Promise<void> => {
  try {
    if (isConnected()) {
      console.log("MongoDB is already connected");
    } else {
      await mongoose.connect(config.mongo.uri!);
      console.log("Connected to DB");
    }
  } catch (error) {
    console.error(error);
  }
};
