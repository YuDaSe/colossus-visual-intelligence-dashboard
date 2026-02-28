import dotenv from 'dotenv';
dotenv.config();

const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',

  mongo: {
    uri: process.env.MONGO_CONNECTION_STRING,
  },
} as const;
  
export default config;