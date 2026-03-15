"use client";

const ChartProfitOverlay = ({
  totalLongProfit,
  totalShortProfit,
  showLongProfit,
  showShortProfit,
  initialLongInvestment,
  initialShortInvestment,
}: {
  totalLongProfit: number;
  totalShortProfit: number;
  showLongProfit: boolean;
  showShortProfit: boolean;
  initialLongInvestment: number;
  initialShortInvestment: number;
}) => {
  if (!showLongProfit && !showShortProfit) return null;

  const longDiff = totalLongProfit - initialLongInvestment;
  const shortDiff = totalShortProfit - initialShortInvestment;
  const totalInitial = (showLongProfit ? initialLongInvestment : 0) + (showShortProfit ? initialShortInvestment : 0);
  const totalResult = (showLongProfit ? totalLongProfit : 0) + (showShortProfit ? totalShortProfit : 0);
  const totalDiff = totalResult - totalInitial;
  const roi = totalInitial !== 0 ? (totalDiff / totalInitial) * 100 : 0;

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 250,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        color: "#ccc",
        fontSize: 24,
        pointerEvents: "none",
      }}
    >
      {showLongProfit && (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ color: "#999" }}>Long Profit:</span>
          <span
            style={{
              color: longDiff >= 0 ? "#64ff96" : "#ff6464",
              fontWeight: 600,
            }}
          >
            {longDiff.toFixed(2)}
          </span>
        </div>
      )}
      {showShortProfit && (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ color: "#999" }}>Short Profit:</span>
          <span
            style={{
              color: shortDiff >= 0 ? "#64ff96" : "#ff6464",
              fontWeight: 600,
            }}
          >
            {shortDiff.toFixed(2)}
          </span>
        </div>
      )}
      <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 34 }}>
        <span style={{ color: "#999" }}>Total Profit:</span>
        <span
          style={{
            color: totalDiff >= 0 ? "#64ff96" : "#ff6464",
            fontWeight: 700,
          }}
        >
          {totalDiff.toFixed(2)}
        </span>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 34 }}>
        <span style={{ color: "#999" }}>ROI:</span>
        <span
          style={{
            color: roi >= 0 ? "#64ff96" : "#ff6464",
            fontWeight: 600,
          }}
        >
          {roi.toFixed(2)}%
        </span>
      </div>
    </div>
  );
};

export default ChartProfitOverlay;
