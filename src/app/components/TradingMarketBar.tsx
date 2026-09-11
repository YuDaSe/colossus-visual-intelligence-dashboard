"use client";

import { CANDLE_INTERVALS, TRADING_PAIR } from "@/constants";

export interface TradingMarket {
  pair: string;
  interval: string;
}

const intervalOptions = [
  CANDLE_INTERVALS.ONE_HOUR,
  CANDLE_INTERVALS.FOUR_HOURS,
  CANDLE_INTERVALS.ONE_DAY,
];

const TradingMarketBar = ({
  market,
  onChange,
}: {
  market: TradingMarket;
  onChange: (market: TradingMarket) => void;
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 10,
        background: "rgba(19, 23, 34, 0.92)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
        color: "#ccc",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <select
          value={market.pair}
          onChange={(event) => onChange({ ...market, pair: event.target.value })}
          style={selectStyle}
        >
          {TRADING_PAIR.map((pair) => (
            <option key={pair} value={pair}>
              {pair}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <select
          value={market.interval}
          onChange={(event) =>
            onChange({ ...market, interval: event.target.value })
          }
          style={selectStyle}
        >
          {intervalOptions.map((interval) => (
            <option key={interval} value={interval}>
              {interval}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

const selectStyle: React.CSSProperties = {
  minWidth: 110,
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.06)",
  color: "#eee",
  fontSize: 13,
  outline: "none",
};

export default TradingMarketBar;