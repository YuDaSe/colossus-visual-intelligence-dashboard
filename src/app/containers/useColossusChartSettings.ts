"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { ChartSettingsState } from "../components/ChartSettings";

const COLOSSUS_CHART_SETTINGS_KEY = "ColossusChartSettings";

const chartSettingsSchema = z.object({
  initialLongBudget: z.number().default(1000),
  initialShortBudget: z.number().default(1000),
  leverage: z.number().default(1),
  showShortCorridors: z.boolean().default(true),
  showLongCorridors: z.boolean().default(true),
  showNewsSentiments: z.boolean().default(true),
  showGridSetupAdvices: z.boolean().default(true),
  showGridSetups: z.boolean().default(true),
  showInflationRatesPanel: z.boolean().default(true),
  showMacdPanel: z.boolean().default(true),
  showBalanceDynamicPanel: z.boolean().default(true),
});

const defaultSettings: ChartSettingsState = chartSettingsSchema.parse({});

const parseSettings = (raw: unknown): ChartSettingsState => {
  const result = chartSettingsSchema.safeParse(raw);
  if (result.success) {
    return result.data;
  }

  return defaultSettings;
};

export const useColossusChartSettings = () => {
  const [settings, setSettings] = useState<ChartSettingsState>(defaultSettings);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  useEffect(() => {
    const persisted = window.localStorage.getItem(COLOSSUS_CHART_SETTINGS_KEY);
    if (!persisted) {
      setHasLoadedFromStorage(true);
      return;
    }

    try {
      setSettings(parseSettings(JSON.parse(persisted)));
    } catch (error) {
      console.error(
        "Failed to parse ColossusChartSettings from localStorage",
        error,
      );
    } finally {
      setHasLoadedFromStorage(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedFromStorage) {
      return;
    }

    try {
      window.localStorage.setItem(
        COLOSSUS_CHART_SETTINGS_KEY,
        JSON.stringify(settings),
      );
    } catch (error) {
      console.error("Failed to save ColossusChartSettings to localStorage", error);
    }
  }, [hasLoadedFromStorage, settings]);

  return { settings, setSettings };
};
