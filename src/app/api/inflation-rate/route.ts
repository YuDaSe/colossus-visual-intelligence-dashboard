import { NextRequest, NextResponse } from "next/server";
import { connectToDb } from "@/app/data/database/utils/with-db";
import UsInflationRateService from "@/app/data/database/db-services/us-inflation-rate.service";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, rate } = body;

  if (!date || rate === undefined || rate === null) {
    return NextResponse.json(
      { error: "date and rate are required" },
      { status: 400 },
    );
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }
  parsedDate.setUTCHours(0, 0, 0, 0);

  const parsedRate = Number(rate);
  if (isNaN(parsedRate)) {
    return NextResponse.json({ error: "rate must be a number" }, { status: 400 });
  }

  await connectToDb();

  const service = new UsInflationRateService();
  const saved = await service.saveRate(parsedDate, parsedRate);

  return NextResponse.json(saved, { status: 201 });
}
