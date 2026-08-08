import { UTCTimestamp } from "lightweight-charts";

const WEEK_IN_SECONDS = 7 * 24 * 60 * 60;
const MAX_PRICE_RANGE_PERCENT = 0.03;
const PIVOT_LOOKBACK = 3;

export type SmaPoint = { time: UTCTimestamp; value: number };

export enum PivotType {
  HIGH = "high",
  LOW = "low",
}

export type Pivot = {
  type: PivotType;
  time: UTCTimestamp;
  value: number;
  index: number;
};

export type ConsolidationZone = {
  startTime: UTCTimestamp;
  endTime: UTCTimestamp;
  high: number;
  low: number;
  pivots: Pivot[];
  closed: boolean;
};

function findPivots(smaData: SmaPoint[]): Pivot[] {
  const pivots: Pivot[] = [];

  for (let i = PIVOT_LOOKBACK; i < smaData.length; i++) {
    const current = smaData[i].value;

    const leftSlice = smaData.slice(i - PIVOT_LOOKBACK, i);
    const rightSlice = smaData.slice(i + 1, i + PIVOT_LOOKBACK + 1);

    // Need at least one candle to the right to confirm a pivot
    if (rightSlice.length === 0) continue;

    const isHigh =
      leftSlice.every((p) => p.value <= current) &&
      rightSlice.every((p) => p.value <= current);

    const isLow =
      leftSlice.every((p) => p.value >= current) &&
      rightSlice.every((p) => p.value >= current);

    if (isHigh) {
      pivots.push({ type: PivotType.HIGH, time: smaData[i].time, value: current, index: i });
    } else if (isLow) {
      pivots.push({ type: PivotType.LOW, time: smaData[i].time, value: current, index: i });
    }
  }

  return pivots;
}

function buildZone(pivots: Pivot[]): ConsolidationZone {
  const prices = pivots.map((p) => p.value);
  return {
    startTime: pivots[0].time,
    endTime: pivots[pivots.length - 1].time,
    high: Math.max(...prices),
    low: Math.min(...prices),
    pivots,
    closed: false,
  };
}

export function findConsolidationZones(smaData: SmaPoint[]): ConsolidationZone[] {
  const rawPivots = findPivots(smaData);

  // Enforce strict alternation: skip consecutive same-type pivots, keeping the more extreme one
  const pivots: Pivot[] = [];
  for (const pivot of rawPivots) {
    const last = pivots[pivots.length - 1];
    if (!last || last.type !== pivot.type) {
      pivots.push(pivot);
    } else {
      // Replace with the more extreme pivot (higher high, lower low)
      const keepCurrent =
        pivot.type === PivotType.HIGH
          ? pivot.value > last.value
          : pivot.value < last.value;
      if (keepCurrent) pivots[pivots.length - 1] = pivot;
    }
  }

  const zones: ConsolidationZone[] = [];
  let group: Pivot[] = [];

  for (const pivot of pivots) {
    if (group.length === 0) {
      group = [pivot];
      continue;
    }

    const prev = group[group.length - 1];
    const timeDiff = Number(pivot.time) - Number(prev.time);
    const refPrice = group[0].value;
    const priceDiff = Math.abs(pivot.value - refPrice) / refPrice;

    if (timeDiff <= WEEK_IN_SECONDS && priceDiff <= MAX_PRICE_RANGE_PERCENT) {
      group.push(pivot);
    } else {
      if (group.length > 2) {
        zones.push(buildZone(group));
      }
      group = [pivot];
    }
  }

  if (group.length > 2) {
    zones.push(buildZone(group));
  }

  const latestTime = smaData[smaData.length - 1].time;
  for (const zone of zones) {
    const lastPivotIndex = zone.pivots[zone.pivots.length - 1].index;
    let closedAt: UTCTimestamp | undefined;
    for (let i = lastPivotIndex + 1; i < smaData.length; i++) {
      if (smaData[i].value < zone.low || smaData[i].value > zone.high) {
        closedAt = smaData[i].time;
        break;
      }
    }
    if (closedAt !== undefined) {
      zone.closed = true;
      zone.endTime = closedAt;
    } else {
      zone.endTime = latestTime;
    }
  }

  return zones;
}
