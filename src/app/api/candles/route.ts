import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_CANDLES_DAYS } from "@/constants";
import CandlesDataService from "@/app/data/database/db-services/candles-data-service";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pair = searchParams.get("pair")!;
  const interval = searchParams.get("interval")!;
  const daysParam = searchParams.get("days");
  const days = daysParam ? Number(daysParam) : DEFAULT_CANDLES_DAYS;

  const service = new CandlesDataService();
  const candles = await service.fetchPairCandles(pair, days, interval);

  return NextResponse.json(candles, { status: 200 });
}