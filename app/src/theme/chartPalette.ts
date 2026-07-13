// src/theme/chartPalette.ts
import { statusTokens } from "./tokens";

const categoricalLight = [
  "#2a78d6", // blue
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
  "#e87ba4", // magenta
  "#eb6834", // orange
];

const categoricalDark = [
  "#3987e5", // blue
  "#199e70", // aqua
  "#c98500", // yellow
  "#008300", // green
  "#9085e9", // violet
  "#e66767", // red
  "#d55181", // magenta
  "#d95926", // orange
];

// Single-hue sequential ramp (blue), light -> dark, for magnitude encodings
// (heatmaps, choropleth-style fills).
const sequentialBlue: Record<number, string> = {
  100: "#cde2fb", 150: "#b7d3f6", 200: "#9ec5f4", 250: "#86b6ef",
  300: "#6da7ec", 350: "#5598e7", 400: "#3987e5", 450: "#2a78d6",
  500: "#256abf", 550: "#1c5cab", 600: "#184f95", 650: "#104281", 700: "#0d366b",
};

export interface ChartPalette {
  categorical: string[];
  status: typeof statusTokens;
  sequential: Record<number, string>;
  surface: string;
  grid: string;
  axis: string;
  baseline: string;
}

export function getChartPalette(mode: "light" | "dark"): ChartPalette {
  return {
    categorical: mode === "light" ? categoricalLight : categoricalDark,
    status: statusTokens,
    sequential: sequentialBlue,
    surface: mode === "light" ? "#FAFAFA" : "#0A0A0A",
    grid: mode === "light" ? "#e1e0d9" : "#2c2c2a",
    axis: "#898781",
    baseline: mode === "light" ? "#c3c2b7" : "#383835",
  };
}

// Stable per-feature accent color, hashed from a key (e.g. a nav path or
// stat name) so the same feature keeps the same color everywhere it shows
// up — sidebar icons, dashboard StatCard icons, etc.
export function getIconAccent(mode: "light" | "dark", key: string): string {
  const { categorical } = getChartPalette(mode);
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return categorical[hash % categorical.length];
}

export function getChartTooltipStyle(mode: "light" | "dark") {
  const surface = mode === "light" ? "#FFFFFF" : "#1A1A1A";
  const border = mode === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const text = mode === "light" ? "#111111" : "#F5F5F4";
  return {
    contentStyle: {
      backgroundColor: surface,
      border: `1px solid ${border}`,
      borderRadius: 8,
      fontSize: 13,
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    },
    labelStyle: { color: text, fontWeight: 600 },
    // Recharts' default Tooltip cursor is a flat grey rectangle spanning the
    // full category band (very visible on single/sparse-bar charts) — off
    // by default everywhere this style object is spread onto <Tooltip>.
    cursor: false,
  };
}
