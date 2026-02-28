import {
  ISeriesPrimitive,
  UTCTimestamp,
  Time,
  IPrimitivePaneRenderer,
} from "lightweight-charts";

/**
 * Represents a single rectangle marker with two points and a color
 */
export interface RectangleMarker {
  p1: {
    time: UTCTimestamp;
    price: number;
  };
  p2: {
    time: UTCTimestamp;
    price: number;
  };
  color: string;
}

/**
 * Coordinate conversion functions provided by the chart
 */
export interface CoordinateConverters {
  priceToCoordinate: (price: number) => number | null;
  timeToCoordinate: (time: UTCTimestamp) => number | null;
}

/**
 * Internal representation of a rectangle with converted coordinates
 */
interface ConvertedRectangle {
  x1: number | null;
  y1: number | null;
  x2: number | null;
  y2: number | null;
  color: string;
}

/**
 * Renders multiple rectangle series on the chart canvas
 */
class RectangleRenderer implements IPrimitivePaneRenderer {
  private rectangleData: RectangleMarker[];
  private converters: CoordinateConverters;

  constructor(
    rectangleData: RectangleMarker[],
    converters: CoordinateConverters,
  ) {
    this.rectangleData = rectangleData;
    this.converters = converters;
  }

  draw(target: Parameters<IPrimitivePaneRenderer["draw"]>[0]) {
    target.useBitmapCoordinateSpace((scope) => {
      const { context, horizontalPixelRatio, verticalPixelRatio } = scope;

      // Convert marker coordinates to canvas coordinates
      const convertedRectangles = this.rectangleData.map(
        (marker: RectangleMarker) => ({
          x1: this.converters.timeToCoordinate(marker.p1.time),
          y1: this.converters.priceToCoordinate(marker.p1.price),
          x2: this.converters.timeToCoordinate(marker.p2.time),
          y2: this.converters.priceToCoordinate(marker.p2.price),
          color: marker.color,
        }),
      );

      // Handle null coordinates by interpolating with adjacent rectangles
      const fixedRectangles = convertedRectangles.map(
        (rect: ConvertedRectangle, index: number) => {
          const prevRect = convertedRectangles[index - 1];
          const nextRect = convertedRectangles[index + 1];

          if (rect.x1 === null) {
            rect.x1 = prevRect && prevRect.x2 ? prevRect.x2 : nextRect?.x1 || 0;
          }

          if (rect.x2 === null) {
            rect.x2 =
              nextRect && nextRect.x1 ? nextRect.x1 : (prevRect?.x2 || 0) + 20;
          }

          return rect;
        },
      );

      // Draw rectangles on canvas
      fixedRectangles.forEach((rect: ConvertedRectangle) => {
        context.fillStyle = rect.color;
        context.fillRect(
          (rect.x1 || 0) * horizontalPixelRatio,
          (rect.y1 || 0) * verticalPixelRatio,
          ((rect.x2 || 0) - (rect.x1 || 0)) * horizontalPixelRatio,
          ((rect.y2 || 0) - (rect.y1 || 0)) * verticalPixelRatio,
        );
      });
    });
  }
}

/**
 * Primitive that renders a series of rectangles on the chart
 * Implements the ISeriesPrimitive interface for lightweight-charts
 */
export class RectangleSeriesPrimitive implements ISeriesPrimitive<Time> {
  private rectangleData: RectangleMarker[];
  private converters: CoordinateConverters;

  constructor(
    rectangleData: RectangleMarker[],
    converters: CoordinateConverters,
  ) {
    this.rectangleData = rectangleData;
    this.converters = converters;
  }

  /**
   * Update all views - required by ISeriesPrimitive interface
   */
  updateAllViews() {
    // Implementation required by interface but no-op for static rectangles
  }

  /**
   * Returns the pane views for rendering
   */
  paneViews() {
    return [
      {
        zOrder: () => "bottom" as const,
        renderer: () =>
          new RectangleRenderer(this.rectangleData, this.converters),
      },
    ];
  }
}
