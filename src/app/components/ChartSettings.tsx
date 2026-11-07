"use client";

export interface ChartSettingsState {
  initialLongBudget: number;
  initialShortBudget: number;
  leverage: number;
  showShortCorridors: boolean;
  showLongCorridors: boolean;
  showNewsSentiments: boolean;
  showGridSetupAdvices: boolean;
  showGridSetups: boolean;
  showInflationRatesPanel: boolean;
  showMacdPanel: boolean;
  showBalanceDynamicPanel: boolean;
}

const ChartSettings = ({
  settings,
  onChange,
  embedded = false,
}: {
  settings: ChartSettingsState;
  onChange: (settings: ChartSettingsState) => void;
  embedded?: boolean;
}) => {
  const update = (partial: Partial<ChartSettingsState>) =>
    onChange({ ...settings, ...partial });

  const panelStyle: React.CSSProperties = {
    position: embedded ? "static" : "absolute",
    top: 112,
    left: 12,
    zIndex: 10,
    background: "rgba(19, 23, 34, 0.92)",
    borderRadius: 8,
    padding: "14px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    color: "#ccc",
    fontSize: 13,
    minWidth: 210,
    boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.08)",
  };

  const checkboxStyle: React.CSSProperties = {
    accentColor: "#64ff96",
    width: 16,
    height: 16,
    cursor: "pointer",
  };

  return (
    <div style={panelStyle}>
      <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span>Long Budget</span>
        <input
          type="number"
          value={settings.initialLongBudget}
          onChange={(e) => update({ initialLongBudget: Number(e.target.value) })}
          style={inputStyle}
        />
      </label>

      <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span>Short Budget</span>
        <input
          type="number"
          value={settings.initialShortBudget}
          onChange={(e) => update({ initialShortBudget: Number(e.target.value) })}
          style={inputStyle}
        />
      </label>

      <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span>Leverage</span>
        <input
          type="number"
          value={settings.leverage}
          onChange={(e) => update({ leverage: Number(e.target.value) })}
          style={inputStyle}
        />
      </label>

      <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <span>Short Corridors</span>
        <input
          type="checkbox"
          checked={settings.showShortCorridors}
          onChange={(e) => update({ showShortCorridors: e.target.checked })}
          style={checkboxStyle}
        />
      </label>

      <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <span>Long Corridors</span>
        <input
          type="checkbox"
          checked={settings.showLongCorridors}
          onChange={(e) => update({ showLongCorridors: e.target.checked })}
          style={checkboxStyle}
        />
      </label>

      <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <span>News Sentiments</span>
        <input
          type="checkbox"
          checked={settings.showNewsSentiments}
          onChange={(e) => update({ showNewsSentiments: e.target.checked })}
          style={checkboxStyle}
        />
      </label>

      <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <span>Grid Setup Advices</span>
        <input
          type="checkbox"
          checked={settings.showGridSetupAdvices}
          onChange={(e) => update({ showGridSetupAdvices: e.target.checked })}
          style={checkboxStyle}
        />
      </label>

      <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <span>Grid Setups</span>
        <input
          type="checkbox"
          checked={settings.showGridSetups}
          onChange={(e) => update({ showGridSetups: e.target.checked })}
          style={checkboxStyle}
        />
      </label>

      <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <span>Inflation Panel</span>
        <input
          type="checkbox"
          checked={settings.showInflationRatesPanel}
          onChange={(e) => update({ showInflationRatesPanel: e.target.checked })}
          style={checkboxStyle}
        />
      </label>

      <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <span>MACD Panel</span>
        <input
          type="checkbox"
          checked={settings.showMacdPanel}
          onChange={(e) => update({ showMacdPanel: e.target.checked })}
          style={checkboxStyle}
        />
      </label>

      <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <span>Balance Panel</span>
        <input
          type="checkbox"
          checked={settings.showBalanceDynamicPanel}
          onChange={(e) => update({ showBalanceDynamicPanel: e.target.checked })}
          style={checkboxStyle}
        />
      </label>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: 80,
  padding: "4px 6px",
  borderRadius: 4,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.06)",
  color: "#eee",
  fontSize: 13,
  outline: "none",
};

export default ChartSettings;
