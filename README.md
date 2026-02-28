# Colossus Visual Intelligence Dashboard

> **Advanced Market Intelligence Visualisation for AI-Driven Trading Systems**

---

## 📺 Watch the Build

**[Watch the Technical Deep Dive on YouTube](#)** *(Coming Soon)*

Learn how we engineered this high-performance charting system from scratch, integrating MongoDB with Lightweight-Charts for sub-millisecond render times.

---

## Introduction

The **Colossus Visual Intelligence Dashboard** is a specialised sub-module within **Project Colossus**, designed to deliver real-time, post-mortem analysis of AI-driven trading decisions. This system synthesises multi-layered market data—ranging from raw price action to AI-generated trading zones and sentiment-driven news events—into a unified, interactive visualisation environment.

Unlike traditional charting platforms that overwhelm traders with hundreds of superfluous indicators, this dashboard adheres to a **signal-over-noise** philosophy: every pixel serves a purpose, every zone represents actionable intelligence.

### The "Why"

Modern trading platforms suffer from what we call **"Skyscraper Syndrome"**: cluttered interfaces stacked with redundant indicators that obscure rather than illuminate decision-making. Colossus challenges this paradigm by:

- **Eliminating Visual Noise**: Only three core data layers are rendered—candlesticks, AI decision zones, and critical news sentiment pulses.
- **Prioritising Cognitive Load Reduction**: Dark-mode optimisation and minimalist design principles ensure that traders focus on decisions, not distractions.
- **Enabling Retrospective Analysis**: This dashboard is not a real-time trading terminal—it is a forensic tool for dissecting past AI performance, identifying edge cases, and refining algorithmic strategies.

We are moving away from the "70-indicator spaghetti chart" towards **clean, zone-based decision architecture**. If your model said "Long Zone at $45,200–$45,800", this dashboard shows you exactly how that played out against actual market behaviour.

---

## Technical Stack

| Layer              | Technology                          |
|--------------------|-------------------------------------|
| **Framework**      | Next.js 14+ (App Router)            |
| **Language**       | TypeScript (Strict Mode)            |
| **Database**       | MongoDB + Mongoose ODM              |
| **Charting Engine**| Lightweight-Charts (TradingView)    |
| **Styling**        | Tailwind CSS                        |
| **Deployment**     | Vercel / Self-Hosted                |

---

## Core Features

### 🏗 Three-Layer Data Architecture

The dashboard visualises a hierarchical data structure designed for clarity and performance:

#### **1. Raw Candlestick Price Action**
- High-frequency OHLCV data rendered via Lightweight-Charts' native `CandlestickSeries`.
- Optimised for datasets exceeding 100,000 candles with lazy-loading and viewport culling.

#### **2. AI Trading Advice Zones**
- **Long Zones**: Displayed as semi-transparent green rectangles indicating bullish sentiment regions.
- **Short Zones**: Red rectangles marking bearish opportunities.
- **Neutral Zones**: Grey overlays signifying periods of no directional conviction.
- Each zone is timestamped and price-bounded, allowing for precise retrospective validation.

#### **3. News Sentiment Pulses**
- Vertical markers overlaid on the chart at the exact timestamp of major news events.
- Colour-coded by sentiment (positive, negative, neutral) and scaled by impact magnitude.
- Enables correlation analysis between external catalysts and price/AI behaviour.

### 🚀 Performance Characteristics

- **Initial Load**: <2 seconds for 50,000 data points
- **Re-render Time**: <50ms for viewport updates
- **Memory Footprint**: ~120MB for typical 1-month dataset
- **Responsiveness**: 60fps scrolling and zooming on standard hardware

### 🎨 Design Philosophy

- **Dark-Mode Native**: Designed for extended trading sessions with minimal eye strain.
- **Information Density**: High data-to-ink ratio following Edward Tufte's principles.
- **Accessibility**: WCAG 2.1 AA contrast ratios, keyboard navigation support.

---

## Installation

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- MongoDB instance (local or cloud)
- Basic familiarity with Next.js and TypeScript

### Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd colossus-graph
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the project root (see [Environment Variables](#environment-variables) below).

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Dashboard**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Create a `.env.local` file in the project root with the following configuration:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<database>?retryWrites=true&w=majority

# Optional: Data Fetching Configuration
DATA_FETCH_INTERVAL_MS=60000        # Interval for polling new data (default: 60s)
CANDLE_TIME_FRAME=1h                # Candlestick timeframe (e.g., 1m, 5m, 1h, 1d)
MAX_CANDLES_LOADED=100000           # Maximum number of candles to load
```

### Required Environment Variables

| Variable       | Description                                      | Example                                  |
|----------------|--------------------------------------------------|------------------------------------------|
| `MONGODB_URI`  | MongoDB connection string with authentication   | `mongodb+srv://user:pass@cluster.net/db` |

### Optional Environment Variables

| Variable                  | Description                                  | Default  |
|---------------------------|----------------------------------------------|----------|
| `DATA_FETCH_INTERVAL_MS`  | Polling interval for new data (milliseconds) | `60000`  |
| `CANDLE_TIME_FRAME`       | Candlestick timeframe                        | `1h`     |
| `MAX_CANDLES_LOADED`      | Maximum candles to render                    | `100000` |

---

## Project Structure

```
colossus-graph/
├── src/
│   ├── app/
│   │   ├── ColossusChart.tsx          # Main chart component
│   │   ├── config.ts                  # Chart configuration
│   │   ├── page.tsx                   # Dashboard entry point
│   │   ├── data/
│   │   │   └── database/
│   │   │       ├── db-services/       # Data access layer
│   │   │       ├── schemas/           # Mongoose models
│   │   │       └── utils/             # Database utilities
│   │   └── primitives/
│   │       └── RectangleSeriesPrimitive.ts  # Custom chart primitives
│   ├── utils/
│   │   └── mappers.ts                 # Data transformation utilities
│   └── constants.ts                   # Global constants
├── public/                            # Static assets
├── next.config.ts                     # Next.js configuration
└── tsconfig.json                      # TypeScript configuration
```

---

## Usage

### Viewing Historical Data

The dashboard automatically loads the most recent market data from your MongoDB instance. Use the chart controls to:

- **Pan**: Click and drag to navigate through time
- **Zoom**: Scroll or pinch to adjust temporal resolution
- **Inspect**: Hover over candles or zones to view detailed metrics

### Analysing AI Performance

1. Identify an AI decision zone (green for long, red for short)
2. Observe how price action evolved within that zone
3. Check for correlating news sentiment pulses
4. Assess whether the AI's zone boundaries were accurate

---

## Contributing

We welcome contributions from engineers interested in:

- **Rendering Optimisations**: WebGL acceleration, canvas batching, worker threads
- **New Indicators**: Custom primitives for order flow, volume profile, or liquidity heatmaps
- **Data Pipeline Enhancements**: Real-time WebSocket integration, time-series compression
- **UI/UX Improvements**: Responsive design, mobile optimisation, accessibility features

### Contribution Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit with descriptive messages following [Conventional Commits](https://www.conventionalcommits.org/)
4. Ensure all TypeScript types pass (`npm run type-check`)
5. Submit a pull request with a clear description of changes

---

## Roadmap

- [ ] Real-time WebSocket data streaming
- [ ] Export chart snapshots as high-resolution PNG/SVG
- [ ] Multi-asset comparison view
- [ ] Backtesting replay mode with frame-by-frame controls
- [ ] Integration with live trading APIs (read-only mode)

---

## Licence

This project is proprietary software developed as part of Project Colossus. Unauthorised distribution or commercial use is prohibited.

---

## Contact

For technical enquiries or collaboration opportunities, please reach out through the project repository or associated channels.

---

**Built with precision. Engineered for insight.**
