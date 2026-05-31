"use client";

import { useState } from "react";

const defaultDate = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 5);
  return d.toISOString().slice(0, 10);
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 4,
  color: "#fff",
  fontSize: 13,
  padding: "3px 7px",
  width: 140,
  outline: "none",
};

const panelStyle: React.CSSProperties = {
  position: "absolute",
  top: 220,
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

const AddInflationRateForm = () => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(defaultDate);
  const [rate, setRate] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    try {
      const res = await fetch("/api/inflation-rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, rate: Number(rate) }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error ?? "Failed to save");
      }

      setStatus("success");
      setRate("");
      setDate(defaultDate());
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
    }
  };

  if (!open) {
    return (
      <div style={panelStyle}>
        <button
          onClick={() => setOpen(true)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#f5c542",
            fontWeight: 600,
            fontSize: 13,
            padding: 0,
            textAlign: "left",
          }}
        >
          + Add Inflation Rate
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 600, color: "#f5c542" }}>Add Inflation Rate</span>
        <button
          type="button"
          onClick={() => { setOpen(false); setStatus("idle"); setErrorMsg(""); }}
          style={{
            background: "none",
            border: "none",
            color: "#888",
            cursor: "pointer",
            fontSize: 16,
            lineHeight: 1,
            padding: 0,
          }}
        >
          ✕
        </button>
      </div>

      <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span>Rate</span>
        <input
          type="number"
          step="any"
          required
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          placeholder="e.g. 3.2"
          style={inputStyle}
        />
      </label>

      <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span>Date</span>
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={inputStyle}
        />
      </label>

      {status === "error" && (
        <span style={{ color: "#ff6464", fontSize: 12 }}>{errorMsg}</span>
      )}
      {status === "success" && (
        <span style={{ color: "#64ff96", fontSize: 12 }}>Saved successfully</span>
      )}

      <button
        type="submit"
        disabled={status === "saving"}
        style={{
          background: status === "saving" ? "rgba(245,197,66,0.4)" : "#f5c542",
          color: "#13171a",
          border: "none",
          borderRadius: 4,
          padding: "5px 0",
          fontWeight: 700,
          fontSize: 13,
          cursor: status === "saving" ? "not-allowed" : "pointer",
          marginTop: 2,
        }}
      >
        {status === "saving" ? "Saving…" : "Save"}
      </button>
    </form>
  );
};

export default AddInflationRateForm;
