import {
  ISeriesPrimitive,
  UTCTimestamp,
  Time,
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  SeriesAttachedParameter,
} from "lightweight-charts";
import tinycolor from "tinycolor2";

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
 * Internal representation of a rectangle with converted coordinates
 */
interface ConvertedRectangle {
  x1: number | null;
  y1: number | null;
  x2: number | null;
  y2: number | null;
  color: string;
}

export interface RectangleRendererOptions {
  drawBorderLines?: boolean;
}

/**
 * Renders multiple rectangle series on the chart canvas
 */
class RectangleRenderer implements IPrimitivePaneRenderer {
  private rectangleData: RectangleMarker[];
  private series: SeriesAttachedParameter<Time> | null = null;
  private options: RectangleRendererOptions;

  constructor(
    rectangleData: RectangleMarker[],
    options: RectangleRendererOptions,
  ) {
    this.rectangleData = rectangleData;
    this.options = options;
  }

  setSeries(series: SeriesAttachedParameter<Time>) {
    this.series = series;
  }

  draw(target: Parameters<IPrimitivePaneRenderer["draw"]>[0]) {
    if (!this.series) return;

    target.useBitmapCoordinateSpace((scope) => {
      const { context, horizontalPixelRatio, verticalPixelRatio } = scope;

      // Get fresh coordinate converters on each render
      const timeScale = this.series!.chart.timeScale();

      // Convert marker coordinates to canvas coordinates
      const convertedRectangles = this.rectangleData.map(
        (marker: RectangleMarker) => ({
          x1: timeScale.timeToCoordinate(marker.p1.time),
          y1: this.series!.series.priceToCoordinate(marker.p1.price),
          x2: timeScale.timeToCoordinate(marker.p2.time),
          y2: this.series!.series.priceToCoordinate(marker.p2.price),
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

        if (this.options.drawBorderLines) {
          this.drawBorderLine(
            (rect.x1 || 0) * horizontalPixelRatio,
            (rect.x2 || 0) * horizontalPixelRatio,
            (rect.y1 || 0) * verticalPixelRatio,
            tinycolor(rect.color).setAlpha(0.8).toRgbString(),
            context,
          );
          this.drawBorderLine(
            (rect.x1 || 0) * horizontalPixelRatio,
            (rect.x2 || 0) * horizontalPixelRatio,
            (rect.y2 || 0) * verticalPixelRatio,
            tinycolor(rect.color).setAlpha(0.8).toRgbString(),
            context,
          );
        }
      });
    });
  }

  private drawBorderLine(
    x1: number,
    x2: number,
    y1: number,
    color: string,
    context: CanvasRenderingContext2D,
  ) {
    context.beginPath(); // 1. Start a new path
    context.moveTo(x1, y1); // 2. Move pen to starting point (x, y)
    context.lineTo(x2, y1); // 3. Draw a line to the end point (x, y)

    // Styling the line
    context.strokeStyle = color; // Set the colour
    context.lineWidth = 2; // Set the thickness
    context.lineCap = "round"; // Makes the ends look "finished"

    context.stroke();
  }
}

/**
 * Pane view for rectangle rendering
 */
class RectanglePaneView implements IPrimitivePaneView {
  private _renderer: RectangleRenderer;

  constructor(
    rectangleData: RectangleMarker[],
    options: RectangleRendererOptions,
  ) {
    this._renderer = new RectangleRenderer(rectangleData, options);
  }

  update(series: SeriesAttachedParameter<Time>) {
    this._renderer.setSeries(series);
  }

  zOrder(): "bottom" | "normal" | "top" {
    return "bottom";
  }

  renderer(): IPrimitivePaneRenderer {
    return this._renderer;
  }
}

/**
 * Primitive that renders a series of rectangles on the chart
 * Implements the ISeriesPrimitive interface for lightweight-charts
 */
export class RectangleSeriesPrimitive implements ISeriesPrimitive<Time> {
  private paneView: RectanglePaneView;
  private options: RectangleRendererOptions;
  private attachedSeries: SeriesAttachedParameter<Time> | null = null;

  constructor(
    rectangleData: RectangleMarker[],
    options: RectangleRendererOptions = { drawBorderLines: false },
  ) {
    this.paneView = new RectanglePaneView(rectangleData, options);
    this.options = options;
  }

  /**
   * Called when the primitive is attached to a series
   */
  attached(param: SeriesAttachedParameter<Time>): void {
    this.attachedSeries = param;
    this.paneView.update(param);
  }

  /**
   * Called when the primitive is detached from a series
   */
  detached(): void {
    this.attachedSeries = null;
  }

  /**
   * Update data for the rectangle markers
   */
  updateData(rectangleData: RectangleMarker[]) {
    this.paneView = new RectanglePaneView(rectangleData, this.options);
    if (this.attachedSeries) {
      this.paneView.update(this.attachedSeries);
    }
  }

  /**
   * Update all views - triggers a re-render
   */
  updateAllViews() {
    if (this.attachedSeries) {
      this.paneView.update(this.attachedSeries);
    }
  }

  /**
   * Returns the pane views for rendering
   */
  paneViews() {
    return [this.paneView];
  }
}
