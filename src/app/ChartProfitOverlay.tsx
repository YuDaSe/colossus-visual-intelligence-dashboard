"use client";

const ChartProfitOverlay = ({
  totalLongProfit,
  totalShortProfit,
  showLongProfit,
  showShortProfit,
}: {
  totalLongProfit: number;
  totalShortProfit: number;
  showLongProfit: boolean;
  showShortProfit: boolean;
}) => {
  if (!showLongProfit && !showShortProfit) return null;

  const totalProfit = (showLongProfit ? totalLongProfit : 0) + (showShortProfit ? totalShortProfit : 0);

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
        fontSize: 32,
        pointerEvents: "none",
      }}
    >
      {showLongProfit && (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ color: "#999" }}>Long Profit:</span>
          <span
            style={{
              color: totalLongProfit >= 0 ? "#64ff96" : "#ff6464",
              fontWeight: 600,
            }}
          >
            {totalLongProfit.toFixed(2)}
          </span>
        </div>
      )}
      {showShortProfit && (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ color: "#999" }}>Short Profit:</span>
          <span
            style={{
              color: totalShortProfit >= 0 ? "#64ff96" : "#ff6464",
              fontWeight: 600,
            }}
          >
            {totalShortProfit.toFixed(2)}
          </span>
        </div>
      )}
      <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 46 }}>
        <span style={{ color: "#999" }}>Total Profit:</span>
        <span
          style={{
            color: totalProfit >= 0 ? "#64ff96" : "#ff6464",
            fontWeight: 700,
          }}
        >
          {totalProfit.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default ChartProfitOverlay;
