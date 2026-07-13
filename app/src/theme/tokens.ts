// src/theme/tokens.ts

export interface ModeTokens {
  background: string;
  paper: string;
  textPrimary: string;
  textSecondary: string;
  divider: string;
  hoverOverlay: string;
  selectedOverlay: string;
}

// The whole app's surfaces are built from exactly two tones per mode: a
// "base" (recessed) tone and an "elevated" (paper/card) tone. Light mode
// pairs off-white #F5F5F5 with pure white; dark mode pairs pitch black
// #0A0A0A with soft-black #1D1D1F. Every surface in the app — page
// backgrounds, cards, the sidebar — draws from this same pair.
export const modeTokens: Record<"light" | "dark", ModeTokens> = {
  light: {
    background: "#F5F5F5",
    paper: "#FFFFFF",
    textPrimary: "#111111",
    textSecondary: "#666666",
    divider: "rgba(0,0,0,0.08)",
    hoverOverlay: "rgba(0,0,0,0.04)",
    selectedOverlay: "rgba(0,0,0,0.06)",
  },
  dark: {
    background: "#0A0A0A",
    paper: "#1D1D1F",
    textPrimary: "#F5F5F4",
    textSecondary: "#9A9A97",
    divider: "rgba(255,255,255,0.08)",
    hoverOverlay: "rgba(255,255,255,0.06)",
    selectedOverlay: "rgba(255,255,255,0.09)",
  },
};

export interface SidebarTokens {
  background: string;
  text: string;
  muted: string;
  activeBackground: string;
  activeText: string;
  hoverBackground: string;
  hoverText: string;
  divider: string;
}

const darkSidebarTokens: SidebarTokens = {
  background: "#0A0A0A",
  text: "#F5F5F4",
  muted: "#8A8A87",
  activeBackground: "#1D1D1F",
  activeText: "#F5F5F4",
  hoverBackground: "#1D1D1F",
  hoverText: "#F5F5F4",
  divider: "rgba(255,255,255,0.08)",
};

const lightSidebarTokens: SidebarTokens = {
  background: "#F5F5F5",
  text: "#111111",
  muted: "#5B5B5B",
  activeBackground: "#FFFFFF",
  activeText: "#111111",
  hoverBackground: "#FFFFFF",
  hoverText: "#111111",
  divider: "rgba(0,0,0,0.08)",
};

export function getSidebarTokens(mode: "light" | "dark"): SidebarTokens {
  return mode === "light" ? lightSidebarTokens : darkSidebarTokens;
}

export const sidebarTokens = darkSidebarTokens;

export const statusTokens = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
} as const;

export const motionEasing: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];
export const motionEasingCss = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
export const motionDuration = 0.2;

export const radii = {
  card: 12,
  control: 8,
  pill: 9999,
} as const;
