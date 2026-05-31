import { UTCTimestamp } from "lightweight-charts";
import { RectangleMarker } from "../primitives/RectangleSeriesPrimitive";

/**
 * Performs binary search to find the largest grid point that is <= the given point
 */
export const getGridPoint = (
  grid: UTCTimestamp[],
  point: number,
  pointIndex: number,
): UTCTimestamp => {
  let left = 0;
  let right = grid.length - 1;
  let result: UTCTimestamp | null = null;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (grid[mid] <= point) {
      result = grid[mid];
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  if (result === null) {
    return pointIndex === 0 ? grid[0] : grid[grid.length - 1];
  }

  return result;
};

/**
 * Normalizes rectangle markers by snapping their time coordinates to the nearest grid points
 */
export const normalizeChartRectangles = (
  rectangles: RectangleMarker[],
  timeGrid: UTCTimestamp[],
): RectangleMarker[] => {
  return rectangles.map((marker, index) => {
    return {
      ...marker,
      p1: {
        ...marker.p1,
        time: getGridPoint(timeGrid, marker.p1.time, index),
      },
      p2: {
        ...marker.p2,
        time: getGridPoint(timeGrid, marker.p2.time, index),
      },
    };
  });
};
