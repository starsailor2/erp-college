# Foundation Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a Vite + React + TypeScript project at the `erp-college` repo root — matching the sibling `school-erp` project's architecture and the `dashboard-design-system` skill — with a working shell (theme, layout, nav, auth, router) and one placeholder dashboard per role (Admin, Faculty, Operations, Student), ready for Phases 1–4 to fill in real portal content.

**Architecture:** Client-only React SPA, no backend. A fake-API layer (`src/api/*`) wraps demo data in `Promise`-returning functions with artificial latency, so pages consume data the same way school-erp's pages do (`useState`/`useEffect`) but through an async, API-shaped boundary. One worked example (notifications) proves the pattern end-to-end and powers the AppBar's unread badge.

**Tech Stack:** Vite 6, React 19, TypeScript 5.8, react-router-dom v7, MUI v7 (`@mui/material`, `@mui/icons-material`), Emotion, Tailwind v4 (`@tailwindcss/vite`), recharts v2, `motion` v12 (Framer Motion successor).

## Global Constraints

- No dependencies beyond the Tech Stack list above — in particular, no data-fetching library (no TanStack Query).
- Path alias `@/*` → `src/*` (both `tsconfig.app.json` and `vite.config.ts`).
- No test runner. Verification is `tsc -b` (via `npm run build`), `eslint .`, and manually driving the app in a browser in both light and dark mode.
- Roles are exactly `"admin" | "teacher" | "staff" | "student"` — no `parent` role.
- User-facing portal labels are **Admin**, **Faculty**, **Operations**, **Student** (preserving erp-college's existing copy), even though the internal role keys/folder names are `admin`/`teacher`/`staff`/`student` (matching school-erp's structure).
- Chrome (nav, toolbar, buttons) is fully monochrome — no brand-accent color. Color appears only via the status palette (state) and identity palette (category), both centralized in `src/theme/`.
- Any username/password is accepted at login — no real credential validation.
- `src/api/<domain>.ts` functions return `Promise`s (via `simulateRequest` in `src/api/http.ts`); pages consume them with plain `useState`/`useEffect`, not a custom hook or library.
- Do not touch or delete `index.html`, `faculty.html`, `ops.html`, `student.html` at the repo root — they are retired phase-by-phase in Phases 1–4, not here.

**Amendment (found during execution of Task 1):** the legacy `index.html` already occupies the repo root, colliding with Vite's required root-level entry file of the same name. Resolution: the new Vite project lives under `app/` instead of the true repo root. Every file path below that starts with `src/`, or names `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `eslint.config.js`, or the *new* `index.html`, is relative to `app/` (e.g. `src/theme/tokens.ts` means `app/src/theme/tokens.ts`; the new `index.html` means `app/index.html`). `npm install` / `npm run dev` / `npm run build` / `npm run lint` all run with `app/` as the working directory. The `@/*` import alias, and every `@/...` import shown in code, is unaffected (it still resolves to `app/src/*`). The legacy root-level `index.html`, `faculty.html`, `ops.html`, `student.html` are untouched by this change.

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `eslint.config.js`
- Create: `index.html`
- Create: `src/vite-env.d.ts`
- Create: `src/index.css`
- Create: `src/App.tsx` (minimal placeholder — replaced fully in Task 13)
- Create: `src/main.tsx`

**Interfaces:**
- Produces: a bootable Vite project; `@/*` path alias resolving to `src/*`; `npm run dev`, `npm run build`, `npm run lint` scripts.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "erp-college",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.0",
    "@mui/icons-material": "^7.3.9",
    "@mui/material": "^7.3.9",
    "motion": "^12.23.24",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.13.1",
    "recharts": "^2.15.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.4",
    "@tailwindcss/vite": "^4.2.1",
    "@types/node": "^22.13.0",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^4.7.0",
    "eslint": "^9.39.4",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.26",
    "tailwindcss": "^4.2.1",
    "typescript": "~5.8.2",
    "typescript-eslint": "^8.57.0",
    "vite": "^6.4.1"
  }
}
```

**Amendment (found during execution):** `@types/node` is required in addition to school-erp's dependency list — `tsc -b` builds `tsconfig.node.json` (which includes `vite.config.ts`, using Node's `path` module and `__dirname`) as part of the project-reference graph, and without `@types/node` this fails with `TS2307`/`TS2304`. school-erp's own root `tsconfig.json` sidesteps this because it was later flattened to a single self-contained config (`include: ["src"]`, no `references`) that never asks `tsc -b` to check `vite.config.ts` at all, leaving its `tsconfig.app.json` unused. This plan keeps the standard three-file project-reference split (cleaner, no dead config file) and fixes the real gap by adding `@types/node` instead.

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

- [ ] **Step 3: Create `tsconfig.app.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,

    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "skipLibCheck": true,

    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Create `vite.config.ts`**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 6: Create `eslint.config.js`**

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
);
```

- [ ] **Step 7: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>KALNET College ERP</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create `src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 9: Create `src/index.css`**

```css
@import "tailwindcss";
```

- [ ] **Step 10: Create minimal `src/App.tsx`** (replaced with the full provider/router tree in Task 13)

```tsx
export default function App() {
  return <div>College ERP</div>;
}
```

- [ ] **Step 11: Create `src/main.tsx`**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import App from "@/App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 12: Install dependencies**

Run: `npm install`
Expected: installs cleanly, `node_modules/` created, no error output.

- [ ] **Step 13: Verify the project builds**

Run: `npm run build`
Expected: `tsc -b` reports no errors, then `vite build` completes with output like `✓ built in <time>`. A `dist/` folder is created.

- [ ] **Step 14: Commit**

```bash
git add package.json tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts eslint.config.js index.html src/vite-env.d.ts src/index.css src/App.tsx src/main.tsx
git commit -m "Scaffold Vite + React + TS project for the college ERP rewrite"
```

---

### Task 2: Central types skeleton

**Files:**
- Create: `src/types/index.ts`

**Interfaces:**
- Produces: `Role` (`"admin" | "teacher" | "staff" | "student"`), `User { id, name }`, `Notification { id, title, message, postedBy, read, timestamp }` — all imported via `@/types` by every later task.

- [ ] **Step 1: Create `src/types/index.ts`**

```ts
export type Role = "admin" | "teacher" | "staff" | "student";

export interface User {
  id: string;
  name: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  postedBy: string;
  read: boolean;
  timestamp: string;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors (unused exports are fine — only unused *locals/parameters* are flagged by `noUnusedLocals`/`noUnusedParameters`).

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "Add central types skeleton"
```

---

### Task 3: Theme tokens and chart palette

**Files:**
- Create: `src/theme/tokens.ts`
- Create: `src/theme/chartPalette.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `modeTokens`, `getSidebarTokens(mode)`, `statusTokens`, `motionEasing`, `motionEasingCss`, `motionDuration`, `radii` from `tokens.ts`; `getChartPalette(mode)`, `getIconAccent(mode, key)`, `getChartTooltipStyle(mode)` from `chartPalette.ts` — used by every component and page from Task 8 onward.

- [ ] **Step 1: Create `src/theme/tokens.ts`**

```ts
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
```

- [ ] **Step 2: Create `src/theme/chartPalette.ts`**

```ts
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
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/theme/tokens.ts src/theme/chartPalette.ts
git commit -m "Add theme tokens and chart palette"
```

---

### Task 4: MUI theme, ColorModeContext, ThemeProvider

**Files:**
- Create: `src/theme/index.ts`
- Create: `src/context/ColorModeContext.ts`
- Create: `src/providers/ThemeProvider.tsx`

**Interfaces:**
- Consumes: `modeTokens`, `getSidebarTokens`, `statusTokens`, `motionEasingCss`, `radii` from `@/theme/tokens` (Task 3).
- Produces: default export `getTheme(mode)` from `@/theme`; `ColorModeContext`/`useColorMode()` from `@/context/ColorModeContext`; default export `ThemeProvider` from `@/providers/ThemeProvider` — used by `App.tsx` (Task 13) and every themed component/page thereafter.

- [ ] **Step 1: Create `src/theme/index.ts`**

```ts
import { createTheme } from "@mui/material/styles";
import { modeTokens, getSidebarTokens, statusTokens, motionEasingCss, radii } from "./tokens";

const FONT_STACK = '"Inter", "SF Pro Display", -apple-system, "Segoe UI", Arial, sans-serif';

const getTheme = (mode: "light" | "dark") => {
  const t = modeTokens[mode];
  const sidebarTokens = getSidebarTokens(mode);

  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === "light" ? "#111111" : "#F5F5F4",
        contrastText: mode === "light" ? "#FFFFFF" : "#0A0A0A",
      },
      secondary: {
        main: t.textSecondary,
      },
      success: { main: statusTokens.good },
      warning: { main: statusTokens.warning },
      error: { main: statusTokens.critical },
      info: { main: "#2a78d6" },
      background: {
        default: t.background,
        paper: t.paper,
      },
      text: {
        primary: t.textPrimary,
        secondary: t.textSecondary,
      },
      divider: t.divider,
      action: {
        hover: t.hoverOverlay,
        selected: t.selectedOverlay,
      },
    },
    typography: {
      fontFamily: FONT_STACK,
      h1: { fontWeight: 700, letterSpacing: "-0.02em" },
      h2: { fontWeight: 700, letterSpacing: "-0.02em" },
      h3: { fontWeight: 700, letterSpacing: "-0.02em" },
      h4: { fontWeight: 700, letterSpacing: "-0.02em" },
      h5: { fontWeight: 600, letterSpacing: "-0.01em" },
      h6: { fontWeight: 600, letterSpacing: "-0.01em" },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      overline: { fontWeight: 600, letterSpacing: "0.08em" },
    },
    shape: {
      borderRadius: radii.card,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            scrollbarColor: mode === "light" ? "#8a8a8a #FFFFFF" : "#8a8a8a #000000",
          },
          body: {
            fontVariantNumeric: "tabular-nums",
            scrollbarColor: mode === "light" ? "#8a8a8a #FFFFFF" : "#8a8a8a #000000",
          },
          "*::-webkit-scrollbar": {
            width: 10,
            height: 10,
          },
          "*::-webkit-scrollbar-track": {
            backgroundColor: mode === "light" ? "#FFFFFF" : "#000000",
          },
          "*::-webkit-scrollbar-track:hover": {
            backgroundColor: mode === "light" ? "#FFFFFF" : "#000000",
          },
          "*::-webkit-scrollbar-corner": {
            backgroundColor: mode === "light" ? "#FFFFFF" : "#000000",
          },
          "*::-webkit-scrollbar-thumb": {
            backgroundColor: "#8a8a8a",
            borderRadius: 999,
            border: mode === "light" ? "2px solid #FFFFFF" : "2px solid #000000",
          },
          "*::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#a3a3a3",
          },
          "input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active": {
            WebkitBoxShadow: `0 0 0 100px ${t.paper} inset`,
            WebkitTextFillColor: t.textPrimary,
            caretColor: t.textPrimary,
            borderRadius: `${radii.control}px`,
            transition: "background-color 9999s ease-in-out 0s",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            borderRadius: radii.control,
            transition: `all ${motionEasingCss}`,
            boxShadow: "none",
          },
          containedPrimary: {
            "&:hover": { boxShadow: "none" },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            borderRadius: radii.card,
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            border: `1px solid ${t.divider}`,
            borderRadius: radii.card,
            boxShadow:
              mode === "light"
                ? "0 1px 2px rgba(0,0,0,0.04)"
                : "0 1px 2px rgba(0,0,0,0.24)",
            transition: `box-shadow ${motionEasingCss}, transform ${motionEasingCss}`,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: radii.pill,
            fontWeight: 600,
          },
        },
      },
      MuiTextField: {
        defaultProps: { size: "small" },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: radii.control,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: t.paper,
            color: t.textPrimary,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: "none",
            backgroundColor: sidebarTokens.background,
            color: sidebarTokens.text,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: t.divider,
          },
          head: {
            fontWeight: 600,
            color: t.textSecondary,
            textTransform: "uppercase",
            fontSize: "0.7rem",
            letterSpacing: "0.05em",
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: mode === "light" ? "#111111" : "#F5F5F4",
            color: mode === "light" ? "#FFFFFF" : "#0A0A0A",
            fontSize: "0.75rem",
            borderRadius: radii.control,
          },
        },
      },
    },
  });
};

export default getTheme;
```

- [ ] **Step 2: Create `src/context/ColorModeContext.ts`**

```ts
import { createContext, useContext } from "react";

interface ColorModeContextType {
  toggleColorMode: () => void;
  mode: "light" | "dark";
}

export const ColorModeContext = createContext<ColorModeContextType>({
  toggleColorMode: () => {},
  mode: "light",
});

export const useColorMode = () => useContext(ColorModeContext);
```

- [ ] **Step 3: Create `src/providers/ThemeProvider.tsx`**

```tsx
import { useState, useMemo, type ReactNode } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import getTheme from "@/theme";
import { ColorModeContext } from "@/context/ColorModeContext";

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<"light" | "dark">("light");

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () =>
        setMode((prev) => (prev === "light" ? "dark" : "light")),
      mode,
    }),
    [mode],
  );

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  );
}
```

- [ ] **Step 4: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/theme/index.ts src/context/ColorModeContext.ts src/providers/ThemeProvider.tsx
git commit -m "Add MUI theme, color mode context, and theme provider"
```

---

### Task 5: AuthContext

**Files:**
- Create: `src/context/AuthContext.tsx`

**Interfaces:**
- Consumes: `Role`, `User` from `@/types` (Task 2).
- Produces: `AuthProvider` (named export), `useAuth()` returning `{ role, user, logout, setRole }` — used by `Layout.tsx` (Task 12), `Login.tsx`/`PortalSelection.tsx` (Task 14), and `App.tsx` (Task 13).

- [ ] **Step 1: Create `src/context/AuthContext.tsx`**

```tsx
import { createContext, useContext, useState, type ReactNode } from "react";
import type { Role, User } from "@/types";

interface AuthState {
  role: Role;
  user: User;
  logout: () => void;
  setRole: (role: Role) => void;
}

const AuthContext = createContext<AuthState | null>(null);

const roleUserMap: Record<Role, User> = {
  admin: { id: "admin", name: "Admin User" },
  teacher: { id: "t1", name: "Prof. Sharma" },
  staff: { id: "sf1", name: "Rakesh Kumar" },
  student: { id: "stu1", name: "Aditya Verma" },
};

const validRoles: Role[] = ["admin", "teacher", "staff", "student"];

function detectRoleFromPath(): Role {
  const path = window.location.pathname.split("/")[1] ?? "";
  if (validRoles.includes(path as Role)) return path as Role;
  return (localStorage.getItem("college_erp_role") as Role) || "admin";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(detectRoleFromPath);

  const setRole = (r: Role) => {
    localStorage.setItem("college_erp_role", r);
    setRoleState(r);
  };

  const logout = () => {
    localStorage.removeItem("college_erp_role");
    setRoleState("admin");
  };

  const user = roleUserMap[role];

  return (
    <AuthContext.Provider value={{ role, user, logout, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/context/AuthContext.tsx
git commit -m "Add AuthContext with simulated role-based login"
```

---

### Task 6: Seeded PRNG and name-pool generators

**Files:**
- Create: `src/demo-data/generators/random.ts`
- Create: `src/demo-data/generators/namePools.ts`

**Interfaces:**
- Produces: `rng()`, `pick(arr)`, `randomInt(min, max)`, `shuffle(arr)`, `weightedPick(entries)` from `random.ts`; `firstNames`, `lastNames`, `randomFullName()` from `namePools.ts` — used by Task 7's notifications demo data, and by every later phase's generated demo data (students, staff, etc.).

- [ ] **Step 1: Create `src/demo-data/generators/random.ts`**

```ts
// Deterministic PRNG (mulberry32) so demo data stays stable across reloads
// instead of reshuffling every time a module re-evaluates.
function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const seededRandom = mulberry32(20260711);

export function rng(): number {
  return seededRandom();
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function randomInt(min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function weightedPick<T>(entries: readonly [T, number][]): T {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = rng() * total;
  for (const [value, weight] of entries) {
    r -= weight;
    if (r <= 0) return value;
  }
  return entries[entries.length - 1][0];
}
```

- [ ] **Step 2: Create `src/demo-data/generators/namePools.ts`**

```ts
import { pick } from "./random";

export const firstNames = [
  "Aarav", "Vivaan", "Aditya", "Ishaan", "Reyansh", "Kabir", "Aryan", "Dhruv",
  "Ananya", "Diya", "Ishita", "Kavya", "Meera", "Priya", "Riya", "Saanvi",
  "Rohan", "Karan", "Nikhil", "Sanjay", "Anjali", "Neha", "Pooja", "Shreya",
];

export const lastNames = [
  "Sharma", "Verma", "Gupta", "Mehta", "Kumar", "Singh", "Reddy", "Nair",
  "Iyer", "Rao", "Chatterjee", "Bose", "Malhotra", "Kapoor", "Joshi", "Das",
];

export function randomFullName(): string {
  return `${pick(firstNames)} ${pick(lastNames)}`;
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/generators/random.ts src/demo-data/generators/namePools.ts
git commit -m "Add seeded PRNG and name-pool demo-data generators"
```

---

### Task 7: Fake async API helper

**Files:**
- Create: `src/api/http.ts`

**Interfaces:**
- Produces: `simulateRequest<T>(data: T, delayMs?: number): Promise<T>` — the one primitive every `src/api/<domain>.ts` module (starting with Task 8) builds on.

- [ ] **Step 1: Create `src/api/http.ts`**

```ts
// Wraps a value in a Promise with artificial latency, so demo-data reads
// and writes are shaped like a real network call (and are a drop-in swap
// point for an actual backend later) without needing a live server.
export function simulateRequest<T>(data: T, delayMs = 250): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delayMs);
  });
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/api/http.ts
git commit -m "Add fake async API latency helper"
```

---

### Task 8: Worked example — notifications demo data and API module

**Files:**
- Create: `src/demo-data/communication/notifications.ts`
- Create: `src/api/notifications.ts`

**Interfaces:**
- Consumes: `Notification` from `@/types` (Task 2); `randomFullName` from `@/demo-data/generators/namePools` (Task 6); `simulateRequest` from `@/api/http` (Task 7).
- Produces: `getNotifications(): Promise<Notification[]>`, `getUnreadNotificationCount(): Promise<number>` from `@/api/notifications` — used by `Layout.tsx` (Task 12) and all 4 placeholder dashboards (Task 15).

- [ ] **Step 1: Create `src/demo-data/communication/notifications.ts`**

```ts
import type { Notification } from "@/types";
import { randomFullName } from "@/demo-data/generators/namePools";

export const notifications: Notification[] = [
  {
    id: "n1",
    title: "Semester Registration Open",
    message: "Course registration for the upcoming semester is now open. Please complete it before the deadline.",
    postedBy: randomFullName(),
    read: false,
    timestamp: "2026-07-10T09:00:00Z",
  },
  {
    id: "n2",
    title: "Library Book Due Reminder",
    message: "You have a book due for return within the next 3 days.",
    postedBy: randomFullName(),
    read: false,
    timestamp: "2026-07-11T14:30:00Z",
  },
  {
    id: "n3",
    title: "Fee Payment Received",
    message: "Your latest fee installment has been received and recorded.",
    postedBy: randomFullName(),
    read: true,
    timestamp: "2026-07-08T11:15:00Z",
  },
  {
    id: "n4",
    title: "Hostel Maintenance Notice",
    message: "Water supply will be interrupted in Block C on Sunday from 10am-2pm.",
    postedBy: randomFullName(),
    read: false,
    timestamp: "2026-07-12T08:00:00Z",
  },
  {
    id: "n5",
    title: "Exam Schedule Published",
    message: "The end-semester examination schedule has been published.",
    postedBy: randomFullName(),
    read: true,
    timestamp: "2026-07-07T16:45:00Z",
  },
  {
    id: "n6",
    title: "Placement Drive Announcement",
    message: "A new placement drive has been scheduled for final-year students.",
    postedBy: randomFullName(),
    read: true,
    timestamp: "2026-07-06T10:00:00Z",
  },
];
```

- [ ] **Step 2: Create `src/api/notifications.ts`**

```ts
import { notifications } from "@/demo-data/communication/notifications";
import { simulateRequest } from "@/api/http";
import type { Notification } from "@/types";

export function getNotifications(): Promise<Notification[]> {
  return simulateRequest(notifications);
}

export function getUnreadNotificationCount(): Promise<number> {
  return simulateRequest(notifications.filter((n) => !n.read).length);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/demo-data/communication/notifications.ts src/api/notifications.ts
git commit -m "Add notifications worked example for the fake async API layer"
```

---

### Task 9: Small presentational components (EmptyState, StatusChip, MetaChip, SeverityAvatar, CategoryTag)

**Files:**
- Create: `src/components/EmptyState.tsx`
- Create: `src/components/StatusChip.tsx`
- Create: `src/components/MetaChip.tsx`
- Create: `src/components/SeverityAvatar.tsx`
- Create: `src/components/CategoryTag.tsx`

**Interfaces:**
- Consumes: `statusTokens` from `@/theme/tokens` (Task 3); `getIconAccent` from `@/theme/chartPalette` (Task 3); `useColorMode` from `@/context/ColorModeContext` (Task 4).
- Produces: default export `EmptyState({ icon?, title, description?, action? })`; default export `StatusChip({ status, size? })`; named export `MetaChip({ icon, label, tone? })`; named export `SeverityAvatar({ severity, icon, size? })`; named export `CategoryTag({ label, fullName?, domainKey? })` — `StatusChip`/`EmptyState` used by `DataTable.tsx` (Task 10) and the placeholder dashboards (Task 15); the others available from Phase 1 onward.

- [ ] **Step 1: Create `src/components/EmptyState.tsx`**

```tsx
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import { type ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        py: 6,
        px: 2,
        color: "text.secondary",
      }}
    >
      <Box sx={{ fontSize: 40, mb: 1.5, display: "flex", color: "text.disabled" }}>
        {icon ?? <InboxOutlinedIcon fontSize="inherit" />}
      </Box>
      <Typography variant="subtitle1" fontWeight={600} color="text.primary">
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 360 }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
}
```

- [ ] **Step 2: Create `src/components/StatusChip.tsx`**

```tsx
import Chip from "@mui/material/Chip";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import ErrorIcon from "@mui/icons-material/Error";
import CancelIcon from "@mui/icons-material/Cancel";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";
import { statusTokens } from "@/theme/tokens";
import type { SvgIconComponent } from "@mui/icons-material";

interface StatusMeta {
  label: string;
  color: string;
  icon: SvgIconComponent;
}

const STATUS_MAP: Record<string, StatusMeta> = {
  // Fees
  paid: { label: "Paid", color: statusTokens.good, icon: CheckCircleIcon },
  pending: { label: "Pending", color: statusTokens.warning, icon: ScheduleIcon },
  overdue: { label: "Overdue", color: statusTokens.critical, icon: ErrorIcon },
  // Attendance
  present: { label: "Present", color: statusTokens.good, icon: CheckCircleIcon },
  absent: { label: "Absent", color: statusTokens.critical, icon: CancelIcon },
  late: { label: "Late", color: statusTokens.warning, icon: HourglassTopIcon },
  // Library
  issued: { label: "Issued", color: statusTokens.warning, icon: ScheduleIcon },
  returned: { label: "Returned", color: statusTokens.good, icon: CheckCircleIcon },
  // Tasks / requests
  in_progress: { label: "In Progress", color: statusTokens.warning, icon: HourglassTopIcon },
  completed: { label: "Completed", color: statusTokens.good, icon: CheckCircleIcon },
  rejected: { label: "Rejected", color: statusTokens.critical, icon: CancelIcon },
  approved: { label: "Approved", color: statusTokens.good, icon: CheckCircleIcon },
  fulfilled: { label: "Fulfilled", color: statusTokens.good, icon: CheckCircleIcon },
  active: { label: "Active", color: statusTokens.good, icon: CheckCircleIcon },
  inactive: { label: "Inactive", color: statusTokens.serious, icon: CancelIcon },
  // Notifications / messages
  read: { label: "Read", color: statusTokens.good, icon: MarkEmailReadIcon },
  unread: { label: "Unread", color: statusTokens.warning, icon: MarkEmailUnreadIcon },
};

interface StatusChipProps {
  status: string;
  size?: "small" | "medium";
}

export default function StatusChip({ status, size = "small" }: StatusChipProps) {
  const meta = STATUS_MAP[status] ?? {
    label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    color: "#898781",
    icon: ScheduleIcon,
  };
  const Icon = meta.icon;

  return (
    <Chip
      size={size}
      icon={<Icon style={{ color: meta.color, fontSize: 16 }} />}
      label={meta.label}
      sx={{
        bgcolor: `${meta.color}1a`, // ~10% alpha
        color: meta.color,
        border: "1px solid",
        borderColor: `${meta.color}33`, // ~20% alpha
        "& .MuiChip-icon": { color: meta.color },
      }}
    />
  );
}
```

- [ ] **Step 3: Create `src/components/MetaChip.tsx`**

```tsx
// src/components/MetaChip.tsx
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

interface MetaChipProps {
  icon: ReactNode;
  label: string;
  tone?: "default" | "muted";
}

export function MetaChip({ icon, label, tone = "default" }: MetaChipProps) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        height: 24,
        px: 0.75,
        borderRadius: 1,
        color: tone === "muted" ? "text.disabled" : "text.secondary",
        "& .MuiSvgIcon-root": { fontSize: 16 },
      }}
    >
      {icon}
      <Typography variant="caption" sx={{ fontSize: 12, lineHeight: 1 }}>
        {label}
      </Typography>
    </Box>
  );
}
```

- [ ] **Step 4: Create `src/components/SeverityAvatar.tsx`**

```tsx
import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";
import type { ReactNode } from "react";
import { statusTokens } from "@/theme/tokens";

export type Severity = "good" | "warning" | "serious" | "critical";

interface SeverityAvatarProps {
  severity: Severity;
  icon: ReactNode;
  size?: number;
}

export function SeverityAvatar({ severity, icon, size = 36 }: SeverityAvatarProps) {
  const color = statusTokens[severity];
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: alpha(color, 0.14),
        color,
        flexShrink: 0,
        "& .MuiSvgIcon-root": { fontSize: size * 0.55 },
      }}
    >
      {icon}
    </Box>
  );
}
```

- [ ] **Step 5: Create `src/components/CategoryTag.tsx`**

```tsx
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import { alpha } from "@mui/material/styles";
import { getIconAccent } from "@/theme/chartPalette";
import { useColorMode } from "@/context/ColorModeContext";

interface CategoryTagProps {
  label: string;
  fullName?: string;
  domainKey?: string;
}

export function CategoryTag({ label, fullName, domainKey }: CategoryTagProps) {
  const { mode } = useColorMode();
  const color = getIconAccent(mode, domainKey ?? label);
  const tooltip = fullName && fullName !== label ? fullName : "";

  return (
    <Tooltip title={tooltip}>
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 40,
          px: 0.75,
          py: 0.25,
          borderRadius: 1.5,
          bgcolor: alpha(color, 0.12),
          color,
          border: "1px solid",
          borderColor: alpha(color, 0.3),
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          lineHeight: 1.6,
        }}
      >
        {label}
      </Box>
    </Tooltip>
  );
}
```

- [ ] **Step 6: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/EmptyState.tsx src/components/StatusChip.tsx src/components/MetaChip.tsx src/components/SeverityAvatar.tsx src/components/CategoryTag.tsx
git commit -m "Add small presentational components (EmptyState, StatusChip, MetaChip, SeverityAvatar, CategoryTag)"
```

---

### Task 10: Core dashboard components (PageHeader, StatCard, ChartCard, DataTable, PipelineStepper)

**Files:**
- Create: `src/components/PageHeader.tsx`
- Create: `src/components/StatCard.tsx`
- Create: `src/components/ChartCard.tsx`
- Create: `src/components/DataTable.tsx`
- Create: `src/components/PipelineStepper.tsx`

**Interfaces:**
- Consumes: `motionEasing`, `motionDuration` from `@/theme/tokens`; `statusTokens` from `@/theme/tokens`; `getChartPalette` from `@/theme/chartPalette`; `useColorMode` from `@/context/ColorModeContext`; default export `EmptyState` from `@/components/EmptyState` (Task 9).
- Produces: named exports `PageHeader`, `StatCard`, `ChartCard`, `DataTable<T>`, `PipelineStepper` — used by the placeholder dashboards (Task 15) and every future portal page.

- [ ] **Step 1: Create `src/components/PageHeader.tsx`**

```tsx
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import MuiLink from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import { Link } from "react-router-dom";
import { type ReactNode } from "react";

interface Crumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs?: Crumb[];
  action?: ReactNode;
  eyebrow?: string;
  summary?: ReactNode;
}

export function PageHeader({ title, breadcrumbs, action, eyebrow, summary }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 1 }}>
      <Box>
        {breadcrumbs && (
          <Breadcrumbs sx={{ mb: 0.5 }}>
            {breadcrumbs.map((b, i) =>
              b.to ? (
                <MuiLink
                  key={i}
                  component={Link}
                  to={b.to}
                  underline="hover"
                  color="inherit"
                  fontSize={14}
                >
                  {b.label}
                </MuiLink>
              ) : (
                <Typography key={i} fontSize={14} color="text.primary">
                  {b.label}
                </Typography>
              )
            )}
          </Breadcrumbs>
        )}
        {eyebrow && (
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontSize: "0.7rem", display: "block", lineHeight: 1.8 }}
          >
            {eyebrow}
          </Typography>
        )}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="h4" fontWeight={700}>
            {title}
          </Typography>
          {summary}
        </Stack>
      </Box>
      {action && <Box>{action}</Box>}
    </Box>
  );
}
```

- [ ] **Step 2: Create `src/components/StatCard.tsx`**

```tsx
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { type ReactNode, useEffect, useState } from "react";
import { motion, animate } from "motion/react";
import { useTheme, alpha } from "@mui/material/styles";
import { motionEasing, motionDuration } from "@/theme/tokens";
import { statusTokens } from "@/theme/tokens";

interface TrendInfo {
  value: number; // e.g. 4.2 for "4.2%"
  direction: "up" | "down";
  label?: string; // e.g. "vs last month"
}

interface StatCardProps {
  title: string;
  value?: string | number;
  icon: ReactNode;
  color?: string;
  numericValue?: number;
  formatValue?: (n: number) => string;
  trend?: TrendInfo;
  delay?: number;
  onClick?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveColor(theme: any, color: string): string {
  if (color.startsWith("#") || color.startsWith("rgb")) return color;
  const parts = color.split(".");
  let result: unknown = theme.palette;
  for (const p of parts) result = (result as Record<string, unknown>)?.[p];
  return typeof result === "string" ? result : color;
}

function useCountUp(target: number | undefined, duration: number) {
  const [display, setDisplay] = useState(target ?? 0);
  useEffect(() => {
    if (target === undefined) return;
    const controls = animate(0, target, {
      duration,
      ease: motionEasing,
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [target, duration]);
  return display;
}

export function StatCard({
  title,
  value,
  icon,
  color = "text.primary",
  numericValue,
  formatValue,
  trend,
  delay = 0,
  onClick,
}: StatCardProps) {
  const theme = useTheme();
  const resolved = resolveColor(theme, color);
  const animatedValue = useCountUp(numericValue, 0.9);

  const displayValue =
    numericValue !== undefined
      ? formatValue
        ? formatValue(Math.round(animatedValue))
        : Math.round(animatedValue).toLocaleString("en-IN")
      : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: motionDuration * 2, ease: motionEasing }}
      whileHover={onClick ? { y: -3 } : undefined}
      style={{ cursor: onClick ? "pointer" : "default", height: "100%" }}
      onClick={onClick}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          height: "100%",
          "&:hover": onClick
            ? { boxShadow: (t) => (t.palette.mode === "light" ? "0 8px 24px rgba(0,0,0,0.08)" : "0 8px 24px rgba(0,0,0,0.4)") }
            : {},
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box
            sx={{
              bgcolor: alpha(resolved, 0.1),
              color: resolved,
              p: 1.25,
              borderRadius: 2,
              display: "flex",
            }}
          >
            {icon}
          </Box>
          {trend && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.25}
              sx={{ color: trend.direction === "up" ? statusTokens.good : statusTokens.critical }}
            >
              {trend.direction === "up" ? (
                <ArrowUpwardIcon sx={{ fontSize: 14 }} />
              ) : (
                <ArrowDownwardIcon sx={{ fontSize: 14 }} />
              )}
              <Typography variant="caption" fontWeight={700}>
                {trend.value}%
              </Typography>
            </Stack>
          )}
        </Stack>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h5" fontWeight={700} sx={{ fontVariantNumeric: "tabular-nums" }}>
            {displayValue}
          </Typography>
          {trend?.label && (
            <Typography variant="caption" color="text.secondary">
              {trend.label}
            </Typography>
          )}
        </Box>
      </Paper>
    </motion.div>
  );
}
```

- [ ] **Step 3: Create `src/components/ChartCard.tsx`**

```tsx
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { type ReactNode } from "react";
import { motion } from "motion/react";
import { motionEasing, motionDuration } from "@/theme/tokens";

interface ChartCardLegendItem {
  label: string;
  value: string;
  percent?: number;
  color: string;
}

interface ChartCardProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  height?: number;
  delay?: number;
  legend?: ChartCardLegendItem[];
  children: ReactNode;
}

export function ChartCard({ eyebrow, title, subtitle, action, height = 320, delay = 0, legend, children }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: motionDuration * 2, ease: motionEasing }}
      style={{ height: "100%" }}
    >
      <Paper elevation={0} sx={{ p: 2.5, height: "100%", display: "flex", flexDirection: "column" }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Box>
            {eyebrow && (
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ fontSize: "0.65rem", display: "block", lineHeight: 1.6 }}
              >
                {eyebrow}
              </Typography>
            )}
            <Typography variant="subtitle1" fontWeight={600}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {action}
        </Stack>
        <Box sx={{ flex: 1, minHeight: height, width: "100%" }}>{children}</Box>
        {legend && legend.length > 0 && (
          <Stack
            direction="row"
            flexWrap="wrap"
            useFlexGap
            spacing={1.5}
            sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}
          >
            {legend.map((item) => (
              <Stack key={item.label} direction="row" alignItems="center" spacing={0.75}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: item.color, flexShrink: 0 }} />
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="caption" fontWeight={700}>
                  {item.value}
                  {item.percent !== undefined ? ` · ${item.percent}%` : ""}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </Paper>
    </motion.div>
  );
}
```

- [ ] **Step 4: Create `src/components/DataTable.tsx`**

```tsx
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { type ReactNode, useState } from "react";
import EmptyState from "@/components/EmptyState";

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  title?: string;
  dense?: boolean;
  pagination?: boolean;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T extends object>({
  columns,
  rows,
  onRowClick,
  title,
  dense = true,
  pagination = false,
  pageSize = 10,
  emptyTitle = "No data found",
  emptyDescription,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  const visibleRows = pagination
    ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : rows;

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: "divider", overflow: "hidden" }}>
      {title && (
        <Typography variant="subtitle1" fontWeight={600} sx={{ p: 2, pb: 0 }}>
          {title}
        </Typography>
      )}
      <TableContainer>
        <Table size={dense ? "small" : "medium"} stickyHeader={pagination}>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.key}>{col.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.map((row, i) => (
              <TableRow
                key={i}
                hover
                sx={{ cursor: onRowClick ? "pointer" : "default" }}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.render
                      ? col.render(row, i)
                      : ((row as Record<string, ReactNode>)[col.key] ?? null)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ border: 0 }}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {pagination && rows.length > 0 && (
        <TablePagination
          component="div"
          count={rows.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      )}
    </Paper>
  );
}
```

- [ ] **Step 5: Create `src/components/PipelineStepper.tsx`**

```tsx
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import CheckIcon from "@mui/icons-material/Check";
import { statusTokens } from "@/theme/tokens";
import { getChartPalette } from "@/theme/chartPalette";
import { useColorMode } from "@/context/ColorModeContext";

export interface PipelineStep {
  label: string;
  status: "done" | "active" | "pending";
  timestamp?: string;
  detail?: string;
}

interface PipelineStepperProps {
  steps: PipelineStep[];
}

export function PipelineStepper({ steps }: PipelineStepperProps) {
  const { mode } = useColorMode();
  const activeColor = getChartPalette(mode).categorical[0];

  const colorFor = (status: PipelineStep["status"]) =>
    status === "done" ? statusTokens.good : status === "active" ? activeColor : undefined;

  return (
    <Stack direction="row" alignItems="flex-start" sx={{ width: "100%", overflowX: "auto", pb: 0.5 }}>
      {steps.map((step, i) => {
        const color = colorFor(step.status);
        const isLast = i === steps.length - 1;
        return (
          <Box key={step.label} sx={{ display: "flex", alignItems: "flex-start", flex: isLast ? "0 0 auto" : 1 }}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 100 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: color ?? "transparent",
                  border: color ? "none" : "2px solid",
                  borderColor: "divider",
                }}
              >
                {step.status === "done" && <CheckIcon sx={{ fontSize: 14, color: "background.paper" }} />}
                {step.status === "active" && (
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "background.paper" }} />
                )}
              </Box>
              <Typography
                variant="caption"
                fontWeight={step.status === "pending" ? 500 : 700}
                sx={{ mt: 0.75, textAlign: "center", color: step.status === "pending" ? "text.disabled" : "text.primary" }}
              >
                {step.label}
              </Typography>
              {step.timestamp && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                  {step.timestamp}
                </Typography>
              )}
              {step.detail && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, textAlign: "center" }}>
                  {step.detail}
                </Typography>
              )}
            </Box>
            {!isLast && (
              <Box
                sx={{
                  flex: 1,
                  height: 2,
                  bgcolor: step.status === "done" ? statusTokens.good : "divider",
                  mt: "11px",
                  minWidth: 24,
                }}
              />
            )}
          </Box>
        );
      })}
    </Stack>
  );
}
```

- [ ] **Step 6: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/PageHeader.tsx src/components/StatCard.tsx src/components/ChartCard.tsx src/components/DataTable.tsx src/components/PipelineStepper.tsx
git commit -m "Add core dashboard components (PageHeader, StatCard, ChartCard, DataTable, PipelineStepper)"
```

---

### Task 11: Navigation skeleton

**Files:**
- Create: `src/components/navigation.tsx`

**Interfaces:**
- Consumes: `Role` from `@/types` (Task 2).
- Produces: `NavItem { label, path, icon, group?, children? }` (named export type), `getNavItems(role: Role): NavItem[]` (named export) — used by `Layout.tsx` (Task 12). Phases 1–4 each extend this same `switch` with their role's real nav items (and may widen `getNavItems`'s signature with extra tier parameters, the way school-erp's does for `teacherType`/`staffRole`).

- [ ] **Step 1: Create `src/components/navigation.tsx`**

```tsx
import type { Role } from "@/types";
import DashboardIcon from "@mui/icons-material/Dashboard";
import type { ReactNode } from "react";

export interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  group?: string;
  children?: { label: string; path: string }[];
}

export function getNavItems(role: Role): NavItem[] {
  switch (role) {
    case "admin":
      return [{ label: "Dashboard", path: "/admin", icon: <DashboardIcon /> }];
    case "teacher":
      return [{ label: "Dashboard", path: "/teacher", icon: <DashboardIcon /> }];
    case "staff":
      return [{ label: "Dashboard", path: "/staff", icon: <DashboardIcon /> }];
    case "student":
      return [{ label: "Dashboard", path: "/student", icon: <DashboardIcon /> }];
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/navigation.tsx
git commit -m "Add per-role navigation skeleton"
```

---

### Task 12: Layout shell

**Files:**
- Create: `src/components/Layout.tsx`

**Interfaces:**
- Consumes: `useAuth` from `@/context/AuthContext` (Task 5); `useColorMode` from `@/context/ColorModeContext` (Task 4); `getNavItems`, `NavItem` from `@/components/navigation` (Task 11); `getUnreadNotificationCount` from `@/api/notifications` (Task 8); `getSidebarTokens` from `@/theme/tokens` (Task 3).
- Produces: default export `Layout` — a `react-router-dom` layout route element (renders `<Outlet />`) — wired into `router.tsx` (Task 13).

- [ ] **Step 1: Create `src/components/Layout.tsx`**

```tsx
import { Suspense, useMemo, useRef, useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar, Toolbar, Typography, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, IconButton, Box, Avatar, Tooltip, Badge, useMediaQuery, useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LogoutIcon from "@mui/icons-material/Logout";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { useColorMode } from "@/context/ColorModeContext";
import { getNavItems, type NavItem } from "@/components/navigation";
import { getUnreadNotificationCount } from "@/api/notifications";
import { getSidebarTokens } from "@/theme/tokens";

const SIDEBAR_WIDTH = 260;
const SIDEBAR_TRANSITION_DURATION = 0.3;
const SIDEBAR_TRANSITION_EASING = [0.22, 1, 0.36, 1] as const;
// Chrome icon size (sidebar rows, AppBar utility buttons): 20px per the
// density amendment — structural icons are smaller and monochrome, distinct
// from the 24px+ domain-colored icons on content surfaces like StatCard.
const CHROME_ICON_SX = { "& .MuiSvgIcon-root": { fontSize: 20 } };

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { role, user, logout } = useAuth();
  const { toggleColorMode, mode } = useColorMode();
  const sidebarTokens = getSidebarTokens(mode);
  const navigate = useNavigate();
  const location = useLocation();

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const toggleSubmenu = (label: string) => setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));

  const navItems = useMemo(() => getNavItems(role), [role]);

  const groups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, NavItem[]>();
    for (const item of navItems) {
      const g = item.group ?? "";
      if (!map.has(g)) {
        map.set(g, []);
        order.push(g);
      }
      map.get(g)!.push(item);
    }
    return order.map((g) => ({ group: g, items: map.get(g)! }));
  }, [navItems]);

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  useEffect(() => {
    let live = true;
    getUnreadNotificationCount().then((count) => { if (live) setUnreadNotifications(count); });
    return () => { live = false; };
  }, []);

  // The scrollable area is this main Box (overflow: auto), not the window -
  // React Router doesn't reset scroll position on client-side navigation the
  // way a real page load does, so without this a new page can render already
  // scrolled partway down from wherever the previous page was left.
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleNav = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const portalLabels: Record<string, string> = {
    admin: "Admin Portal",
    teacher: "Faculty Portal",
    staff: "Operations Portal",
    student: "Student Portal",
  };

  const hasActiveChild = (item: NavItem) =>
    item.children?.some((c) => location.pathname === c.path || location.pathname.startsWith(`${c.path}/`)) ?? false;
  const isSelected = (item: NavItem) => location.pathname === item.path || hasActiveChild(item);

  const renderNavItem = (item: NavItem) => {
    const selected = isSelected(item);
    const iconSx = { minWidth: 36, color: "inherit", ...CHROME_ICON_SX };
    if (item.children) {
      const open = openMenus[item.label] ?? hasActiveChild(item);
      return (
        <Box key={item.label}>
          <ListItemButton
            disableRipple
            onClick={() => toggleSubmenu(item.label)}
            sx={{
              mx: 1, borderRadius: 1.5, mb: 0.25, minHeight: 44,
              color: selected ? sidebarTokens.activeText : sidebarTokens.text,
              bgcolor: selected ? sidebarTokens.activeBackground : "transparent",
              "&:hover": { bgcolor: sidebarTokens.hoverBackground, color: sidebarTokens.hoverText },
            }}
          >
            <ListItemIcon sx={iconSx}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
            <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: SIDEBAR_TRANSITION_DURATION, ease: SIDEBAR_TRANSITION_EASING }}>
              <ExpandMoreIcon fontSize="small" />
            </motion.div>
          </ListItemButton>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: SIDEBAR_TRANSITION_DURATION, ease: SIDEBAR_TRANSITION_EASING }}
                style={{ overflow: "hidden" }}
              >
                <Box sx={{ position: "relative" }}>
                  <Box
                    aria-hidden
                    sx={{ position: "absolute", left: 28, top: 4, bottom: 4, width: "1px", bgcolor: sidebarTokens.divider }}
                  />
                  {item.children.map((child) => (
                    <ListItemButton
                      key={child.path}
                      disableRipple
                      onClick={() => handleNav(child.path)}
                      sx={{
                        pl: 3, ml: 4.5, mr: 1, borderRadius: 1.5, mb: 0.25, minHeight: 34,
                        color: location.pathname === child.path ? sidebarTokens.activeText : sidebarTokens.muted,
                        bgcolor: location.pathname === child.path ? sidebarTokens.activeBackground : "transparent",
                        "&:hover": { bgcolor: sidebarTokens.hoverBackground, color: sidebarTokens.hoverText },
                      }}
                    >
                      <ListItemText primary={child.label} primaryTypographyProps={{ fontSize: 13 }} />
                    </ListItemButton>
                  ))}
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      );
    }
    return (
      <ListItemButton
        key={item.path}
        disableRipple
        onClick={() => handleNav(item.path)}
        sx={{
          mx: 1, borderRadius: 1.5, mb: 0.25, minHeight: 44,
          color: selected ? sidebarTokens.activeText : sidebarTokens.text,
          bgcolor: selected ? sidebarTokens.activeBackground : "transparent",
          "&:hover": { bgcolor: sidebarTokens.hoverBackground, color: sidebarTokens.hoverText },
        }}
      >
        <ListItemIcon sx={iconSx}>{item.icon}</ListItemIcon>
        <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
      </ListItemButton>
    );
  };

  const sidebarContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: sidebarTokens.background }}>
      <Box sx={{ p: 2, minHeight: 84, display: "flex", alignItems: "center", gap: 1.5, borderBottom: `1px solid ${sidebarTokens.divider}` }}>
        <Avatar sx={{ bgcolor: sidebarTokens.text, color: sidebarTokens.background, width: 36, height: 36, fontSize: 14, fontWeight: 700 }}>
          {user?.name.charAt(0) ?? "U"}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap sx={{ color: sidebarTokens.text }}>
            {user?.name ?? "User"}
          </Typography>
          <Typography variant="caption" noWrap sx={{ color: sidebarTokens.muted }}>
            {portalLabels[role]}
          </Typography>
        </Box>
      </Box>
      <List sx={{ flex: 1, overflow: "auto", py: 1 }} component="nav">
        {groups.map(({ group, items }) => (
          <Box key={group || "ungrouped"}>
            {group && (
              <Typography
                variant="caption"
                sx={{
                  display: "block", px: 2.5, pt: 2, pb: 0.5,
                  color: sidebarTokens.muted, fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.65rem",
                }}
              >
                {group}
              </Typography>
            )}
            {items.map(renderNavItem)}
          </Box>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{ zIndex: theme.zIndex.drawer + 1, bgcolor: "background.paper", color: "text.primary", borderBottom: 1, borderColor: "divider" }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1, ...CHROME_ICON_SX }}>
              <MenuIcon sx={{ color: "text.secondary" }} />
            </IconButton>
          )}
          <Typography variant="h6" fontWeight={700} sx={{ mr: 2, letterSpacing: "-0.02em" }} noWrap>
            KALNET
          </Typography>

          <Box sx={{ flex: 1 }} />

          <Tooltip title="Sign Out">
            <IconButton onClick={handleLogout} sx={{ ml: 0.5, ...CHROME_ICON_SX }}>
              <LogoutIcon sx={{ color: "text.secondary" }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Toggle theme">
            <IconButton onClick={toggleColorMode} sx={{ ml: 0.5, ...CHROME_ICON_SX }}>
              {mode === "dark" ? (
                <Brightness7Icon sx={{ color: "text.secondary" }} />
              ) : (
                <Brightness4Icon sx={{ color: "text.secondary" }} />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="Notifications">
            <Box sx={{ display: "flex", alignItems: "center", ml: 0.5, px: 0.5, ...CHROME_ICON_SX }}>
              <Badge badgeContent={unreadNotifications} color="error">
                <NotificationsIcon sx={{ color: "text.secondary" }} />
              </Badge>
            </Box>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ "& .MuiDrawer-paper": { width: SIDEBAR_WIDTH, boxSizing: "border-box" } }}
          ModalProps={{ keepMounted: true }}
        >
          {sidebarContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: SIDEBAR_WIDTH, boxSizing: "border-box",
              borderRight: `1px solid ${sidebarTokens.divider}`, mt: "64px", height: "calc(100% - 64px)",
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      <Box
        component="main"
        ref={mainRef}
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: 3,
          mt: "64px",
          bgcolor: "background.default",
          height: "calc(100vh - 64px)",
          overflow: "auto",
        }}
      >
        <Box sx={{ maxWidth: 1600, mx: "auto" }}>
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </Box>
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Layout.tsx
git commit -m "Add Layout shell (sidebar, topbar, theme toggle, notification badge)"
```

---

### Task 13: Router and App wiring

**Files:**
- Create: `src/router.tsx`
- Modify: `src/App.tsx` (replace the Task 1 placeholder)

**Interfaces:**
- Consumes: `AuthProvider` from `@/context/AuthContext` (Task 5); default export `ThemeProvider` from `@/providers/ThemeProvider` (Task 4); default export `Layout` from `@/components/Layout` (Task 12); page modules from `@/pages/*` (Task 14, Task 15 — referenced here via `React.lazy`, so this task can be written before those files exist, but the app won't render a role's page until its page file exists).
- Produces: named export `router` from `@/router` — consumed by `App.tsx`.

- [ ] **Step 1: Create `src/router.tsx`**

```tsx
import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";

const Layout = lazy(() => import("@/components/Layout"));

const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const TeacherDashboard = lazy(() => import("@/pages/teacher/Dashboard"));
const StaffDashboard = lazy(() => import("@/pages/staff/Dashboard"));
const StudentDashboard = lazy(() => import("@/pages/student/Dashboard"));

const PortalSelection = lazy(() => import("@/pages/PortalSelection"));
const LoginPage = lazy(() => import("@/pages/Login"));

export const router = createBrowserRouter([
  { path: "/", element: <PortalSelection /> },
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <Suspense fallback={null}>
        <Layout />
      </Suspense>
    ),
    children: [
      { path: "admin", element: <AdminDashboard /> },
      { path: "teacher", element: <TeacherDashboard /> },
      { path: "staff", element: <StaffDashboard /> },
      { path: "student", element: <StudentDashboard /> },
    ],
  },
]);
```

- [ ] **Step 2: Replace `src/App.tsx` with the full provider tree**

```tsx
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ThemeProvider from "@/providers/ThemeProvider";
import { router } from "@/router";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </AuthProvider>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: `vite build` will fail at this point because `@/pages/admin/Dashboard`, `@/pages/teacher/Dashboard`, `@/pages/staff/Dashboard`, `@/pages/student/Dashboard`, `@/pages/PortalSelection`, and `@/pages/Login` don't exist yet — that's expected. Confirm the *only* errors are "Cannot find module" for those six paths (proves everything else wired correctly); Tasks 14–15 create them next.

- [ ] **Step 4: Commit**

```bash
git add src/router.tsx src/App.tsx
git commit -m "Wire up router and provider tree"
```

---

### Task 14: PortalSelection and Login pages

**Files:**
- Create: `src/pages/PortalSelection.tsx`
- Create: `src/pages/Login.tsx`

**Interfaces:**
- Consumes: `useAuth` from `@/context/AuthContext` (Task 5); `motionEasing`, `motionEasingCss`, `motionDuration` from `@/theme/tokens` (Task 3); `Role` from `@/types` (Task 2).
- Produces: default exports consumed by `router.tsx` (Task 13) at `/` and `/login`.

- [ ] **Step 1: Create `src/pages/PortalSelection.tsx`**

```tsx
import { useNavigate } from "react-router-dom";
import { Box, Typography, Paper, Avatar } from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SchoolIcon from "@mui/icons-material/School";
import BuildIcon from "@mui/icons-material/Build";
import PersonIcon from "@mui/icons-material/Person";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ShieldIcon from "@mui/icons-material/Shield";
import { motion } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { motionEasing, motionEasingCss, motionDuration } from "@/theme/tokens";
import type { Role } from "@/types";

const portals: {
  role: Role;
  label: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
}[] = [
  {
    role: "admin",
    label: "Admin",
    description: "Manage students, faculty, departments, fees, hostel, and full institutional administration.",
    icon: <AdminPanelSettingsIcon />,
    accent: "#2a78d6",
  },
  {
    role: "teacher",
    label: "Faculty",
    description: "Courses, attendance, internal marks, exams, and department management for professors, HODs, and deans.",
    icon: <SchoolIcon />,
    accent: "#1baf7a",
  },
  {
    role: "staff",
    label: "Operations",
    description: "Task assignment, tracking, and reporting for non-teaching staff.",
    icon: <BuildIcon />,
    accent: "#e34948",
  },
  {
    role: "student",
    label: "Student",
    description: "Courses, attendance, exams, fees, hostel, placements, and campus services.",
    icon: <PersonIcon />,
    accent: "#eb6834",
  },
];

export default function PortalSelection() {
  const { setRole } = useAuth();
  const navigate = useNavigate();

  const handleSelect = (role: Role) => {
    setRole(role);
    navigate(`/login`, { state: { role } });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
      }}
    >
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: motionDuration * 2, ease: motionEasing }}>
        <Avatar
          sx={{
            width: 56,
            height: 56,
            bgcolor: "#1D1D1F",
            color: "#F5F5F4",
            mb: 2,
          }}
        >
          <ShieldIcon sx={{ fontSize: 30 }} />
        </Avatar>
      </motion.div>

      <Typography
        variant="overline"
        sx={{
          color: "text.secondary",
          fontWeight: 700,
          letterSpacing: 3,
          mb: 0.5,
        }}
      >
        SELECT YOUR PORTAL
      </Typography>

      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          color: "text.primary",
          mb: 1,
          textAlign: "center",
        }}
      >
        KALNET College ERP
      </Typography>

      <Typography
        variant="body2"
        sx={{ color: "text.secondary", mb: 5, textAlign: "center", maxWidth: 480 }}
      >
        Choose your role to continue. Experience seamless management
        and connectivity across all college operations.
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: 900,
          width: "100%",
        }}
      >
        {portals.map((portal, i) => (
          <motion.div
            key={portal.role}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: motionDuration * 2, ease: motionEasing }}
            style={{ flex: "1 1 0", minWidth: 180, maxWidth: 200 }}
          >
            <Paper
              elevation={0}
              onClick={() => handleSelect(portal.role)}
              sx={{
                p: 2.5,
                pt: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                cursor: "pointer",
                border: "1px solid",
                borderColor: "divider",
                borderTop: "3px solid",
                borderTopColor: portal.accent,
                bgcolor: "background.paper",
                boxShadow: (t) => (t.palette.mode === "light" ? "0 1px 3px rgba(0,0,0,0.04)" : "0 1px 3px rgba(0,0,0,0.3)"),
                transition: `all ${motionDuration * 1.5}s ${motionEasingCss}`,
                "&:hover": {
                  boxShadow: (t) => (t.palette.mode === "light" ? "0 12px 32px rgba(0,0,0,0.12)" : "0 12px 32px rgba(0,0,0,0.5)"),
                  transform: "translateY(-4px)",
                  borderColor: "transparent",
                  borderTopColor: portal.accent,
                  bgcolor: "#1D1D1F",
                  color: "#F5F5F4",
                  "& .portal-desc": { color: "rgba(245,245,244,0.72)" },
                  "& .portal-avatar": {
                    bgcolor: "#F5F5F4",
                    color: portal.accent,
                  },
                  "& .portal-btn": {
                    bgcolor: "#1D1D1F",
                    color: "#F5F5F4",
                  },
                },
              }}
            >
              <Avatar
                className="portal-avatar"
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: "#1D1D1F",
                  color: portal.accent,
                  mb: 2,
                  boxShadow: `0 0 0 6px ${portal.accent}14`,
                  transition: `all ${motionDuration}s`,
                }}
              >
                {portal.icon}
              </Avatar>

              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
                {portal.label}
              </Typography>

              <Typography
                variant="caption"
                className="portal-desc"
                sx={{ color: "text.secondary", display: "block", mb: 2, lineHeight: 1.5, transition: `all ${motionDuration}s` }}
              >
                {portal.description}
              </Typography>

              <Box
                className="portal-btn"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.5,
                  mt: "auto",
                  px: 2,
                  py: 0.75,
                  borderRadius: 2,
                  bgcolor: "#1D1D1F",
                  color: "#F5F5F4",
                  fontSize: 13,
                  fontWeight: 600,
                  transition: `all ${motionDuration}s`,
                }}
              >
                Get started <ArrowForwardIcon sx={{ fontSize: 16 }} />
              </Box>
            </Paper>
          </motion.div>
        ))}
      </Box>

      <Typography
        variant="caption"
        sx={{ mt: 6, color: "text.disabled", letterSpacing: 1 }}
      >
        Secure &bull; Reliable &bull; Efficient
      </Typography>
    </Box>
  );
}
```

- [ ] **Step 2: Create `src/pages/Login.tsx`**

```tsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box, Paper, Typography, TextField, Button, MenuItem, Link, IconButton, Avatar,
} from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { motion } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { motionEasing, motionDuration } from "@/theme/tokens";
import type { Role } from "@/types";

const roles: { value: Role; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "teacher", label: "Faculty" },
  { value: "staff", label: "Operations" },
  { value: "student", label: "Student" },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setRole } = useAuth();
  const preselectedRole = (location.state as { role?: Role })?.role;
  const [form, setForm] = useState({
    institutionCode: "COL-2026-001",
    userId: "",
    password: "",
    role: (preselectedRole || "student") as Role,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRole(form.role);
    navigate(`/${form.role}`);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: motionDuration * 2, ease: motionEasing }}
        style={{ width: "100%", maxWidth: 420 }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            p: 5,
            position: "relative",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <IconButton
            onClick={() => navigate("/")}
            sx={{ position: "absolute", top: 16, left: 16 }}
            size="small"
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>

          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                mx: "auto",
                mb: 2,
              }}
            >
              <ShieldIcon />
            </Avatar>
            <Typography variant="h5" fontWeight={700}>
              Sign In
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your credentials to access the system
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Institution Code
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={form.institutionCode}
              onChange={(e) => setForm({ ...form, institutionCode: e.target.value })}
              sx={{ mb: 2 }}
            />

            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              User ID / Email
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="admin@kalnet.edu"
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              sx={{ mb: 2 }}
            />

            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Password
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              sx={{ mb: 2 }}
            />

            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Role
            </Typography>
            <TextField
              fullWidth
              select
              size="small"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              sx={{ mb: 3 }}
            >
              {roles.map((r) => (
                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
              ))}
            </TextField>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ py: 1.5, fontSize: 15 }}
            >
              Sign In
            </Button>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mt: 3 }}>
            <Link href="#" underline="hover" variant="caption" color="text.secondary">
              Forgot Password?
            </Link>
            <Link href="#" underline="hover" variant="caption" color="text.secondary">
              Need Help?
            </Link>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: `vite build` still fails, but now *only* for the 4 dashboard modules (`@/pages/admin/Dashboard`, `@/pages/teacher/Dashboard`, `@/pages/staff/Dashboard`, `@/pages/student/Dashboard`) — confirming `PortalSelection`/`Login` resolved correctly.

- [ ] **Step 4: Commit**

```bash
git add src/pages/PortalSelection.tsx src/pages/Login.tsx
git commit -m "Add PortalSelection and Login pages"
```

---

### Task 15: Placeholder dashboards (Admin, Faculty, Operations, Student)

**Files:**
- Create: `src/pages/admin/Dashboard.tsx`
- Create: `src/pages/teacher/Dashboard.tsx`
- Create: `src/pages/staff/Dashboard.tsx`
- Create: `src/pages/student/Dashboard.tsx`

**Interfaces:**
- Consumes: `PageHeader` (Task 10), `StatCard` (Task 10), `ChartCard` (Task 10), `DataTable` (Task 10), default export `StatusChip` (Task 9), `useColorMode` (Task 4), `getChartPalette`/`getChartTooltipStyle`/`getIconAccent` (Task 3), `getNotifications`/`getUnreadNotificationCount` (Task 8), `Notification` type (Task 2).
- Produces: default exports consumed by `router.tsx` (Task 13) at `/admin`, `/teacher`, `/staff`, `/student`. Each of these 4 files is fully replaced when its phase (1–4) builds the real dashboard.

- [ ] **Step 1: Create `src/pages/admin/Dashboard.tsx`**

```tsx
import { useEffect, useState } from "react";
import { Grid } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { ChartCard } from "@/components/ChartCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getChartPalette, getChartTooltipStyle, getIconAccent } from "@/theme/chartPalette";
import { getNotifications, getUnreadNotificationCount } from "@/api/notifications";
import type { Notification } from "@/types";

const weeklyActivity = [
  { day: "Mon", count: 34 },
  { day: "Tue", count: 41 },
  { day: "Wed", count: 28 },
  { day: "Thu", count: 47 },
  { day: "Fri", count: 39 },
];

export default function Dashboard() {
  const { mode } = useColorMode();
  const palette = getChartPalette(mode);
  const [unread, setUnread] = useState(0);
  const [rows, setRows] = useState<Notification[]>([]);

  useEffect(() => {
    let live = true;
    getUnreadNotificationCount().then((count) => { if (live) setUnread(count); });
    getNotifications().then((data) => { if (live) setRows(data); });
    return () => { live = false; };
  }, []);

  return (
    <>
      <PageHeader eyebrow="Overview" title="Admin Dashboard" />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Unread Notifications" icon={<NotificationsIcon />} color={getIconAccent(mode, "notifications")} numericValue={unread} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Total Students" icon={<PeopleIcon />} color={getIconAccent(mode, "students")} numericValue={1240} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Faculty Members" icon={<SchoolIcon />} color={getIconAccent(mode, "faculty")} numericValue={86} />
        </Grid>
      </Grid>
      <Grid container spacing={2.5}>
        <Grid size={12}>
          <ChartCard eyebrow="This Week" title="Activity Overview">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="day" stroke={palette.axis} fontSize={12} />
                <YAxis stroke={palette.axis} fontSize={12} />
                <Tooltip {...getChartTooltipStyle(mode)} />
                <Bar dataKey="count" fill={palette.categorical[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={12}>
          <DataTable<Notification>
            title="Recent Notifications"
            columns={[
              { key: "title", label: "Title" },
              { key: "postedBy", label: "Posted By" },
              {
                key: "read",
                label: "Status",
                render: (row) => <StatusChip status={row.read ? "read" : "unread"} />,
              },
              {
                key: "timestamp",
                label: "Date",
                render: (row) => new Date(row.timestamp).toLocaleDateString(),
              },
            ]}
            rows={rows}
            emptyTitle="No notifications yet"
          />
        </Grid>
      </Grid>
    </>
  );
}
```

- [ ] **Step 2: Create `src/pages/teacher/Dashboard.tsx`**

```tsx
import { useEffect, useState } from "react";
import { Grid } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { ChartCard } from "@/components/ChartCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getChartPalette, getChartTooltipStyle, getIconAccent } from "@/theme/chartPalette";
import { getNotifications, getUnreadNotificationCount } from "@/api/notifications";
import type { Notification } from "@/types";

const weeklyActivity = [
  { day: "Mon", count: 5 },
  { day: "Tue", count: 6 },
  { day: "Wed", count: 4 },
  { day: "Thu", count: 7 },
  { day: "Fri", count: 5 },
];

export default function Dashboard() {
  const { mode } = useColorMode();
  const palette = getChartPalette(mode);
  const [unread, setUnread] = useState(0);
  const [rows, setRows] = useState<Notification[]>([]);

  useEffect(() => {
    let live = true;
    getUnreadNotificationCount().then((count) => { if (live) setUnread(count); });
    getNotifications().then((data) => { if (live) setRows(data); });
    return () => { live = false; };
  }, []);

  return (
    <>
      <PageHeader eyebrow="Overview" title="Faculty Dashboard" />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Unread Notifications" icon={<NotificationsIcon />} color={getIconAccent(mode, "notifications")} numericValue={unread} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="My Courses" icon={<MenuBookIcon />} color={getIconAccent(mode, "courses")} numericValue={4} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Students Taught" icon={<PeopleIcon />} color={getIconAccent(mode, "students-taught")} numericValue={210} />
        </Grid>
      </Grid>
      <Grid container spacing={2.5}>
        <Grid size={12}>
          <ChartCard eyebrow="This Week" title="Classes Conducted">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="day" stroke={palette.axis} fontSize={12} />
                <YAxis stroke={palette.axis} fontSize={12} />
                <Tooltip {...getChartTooltipStyle(mode)} />
                <Bar dataKey="count" fill={palette.categorical[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={12}>
          <DataTable<Notification>
            title="Recent Notifications"
            columns={[
              { key: "title", label: "Title" },
              { key: "postedBy", label: "Posted By" },
              {
                key: "read",
                label: "Status",
                render: (row) => <StatusChip status={row.read ? "read" : "unread"} />,
              },
              {
                key: "timestamp",
                label: "Date",
                render: (row) => new Date(row.timestamp).toLocaleDateString(),
              },
            ]}
            rows={rows}
            emptyTitle="No notifications yet"
          />
        </Grid>
      </Grid>
    </>
  );
}
```

- [ ] **Step 3: Create `src/pages/staff/Dashboard.tsx`**

```tsx
import { useEffect, useState } from "react";
import { Grid } from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import GroupsIcon from "@mui/icons-material/Groups";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { ChartCard } from "@/components/ChartCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getChartPalette, getChartTooltipStyle, getIconAccent } from "@/theme/chartPalette";
import { getNotifications, getUnreadNotificationCount } from "@/api/notifications";
import type { Notification } from "@/types";

const weeklyActivity = [
  { day: "Mon", count: 8 },
  { day: "Tue", count: 11 },
  { day: "Wed", count: 6 },
  { day: "Thu", count: 9 },
  { day: "Fri", count: 7 },
];

export default function Dashboard() {
  const { mode } = useColorMode();
  const palette = getChartPalette(mode);
  const [unread, setUnread] = useState(0);
  const [rows, setRows] = useState<Notification[]>([]);

  useEffect(() => {
    let live = true;
    getUnreadNotificationCount().then((count) => { if (live) setUnread(count); });
    getNotifications().then((data) => { if (live) setRows(data); });
    return () => { live = false; };
  }, []);

  return (
    <>
      <PageHeader eyebrow="Overview" title="Operations Dashboard" />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Unread Notifications" icon={<NotificationsIcon />} color={getIconAccent(mode, "notifications")} numericValue={unread} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Open Tasks" icon={<AssignmentIcon />} color={getIconAccent(mode, "tasks")} numericValue={12} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Team Members" icon={<GroupsIcon />} color={getIconAccent(mode, "team")} numericValue={8} />
        </Grid>
      </Grid>
      <Grid container spacing={2.5}>
        <Grid size={12}>
          <ChartCard eyebrow="This Week" title="Tasks Completed">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="day" stroke={palette.axis} fontSize={12} />
                <YAxis stroke={palette.axis} fontSize={12} />
                <Tooltip {...getChartTooltipStyle(mode)} />
                <Bar dataKey="count" fill={palette.categorical[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={12}>
          <DataTable<Notification>
            title="Recent Notifications"
            columns={[
              { key: "title", label: "Title" },
              { key: "postedBy", label: "Posted By" },
              {
                key: "read",
                label: "Status",
                render: (row) => <StatusChip status={row.read ? "read" : "unread"} />,
              },
              {
                key: "timestamp",
                label: "Date",
                render: (row) => new Date(row.timestamp).toLocaleDateString(),
              },
            ]}
            rows={rows}
            emptyTitle="No notifications yet"
          />
        </Grid>
      </Grid>
    </>
  );
}
```

- [ ] **Step 4: Create `src/pages/student/Dashboard.tsx`**

```tsx
import { useEffect, useState } from "react";
import { Grid } from "@mui/material";
import ClassIcon from "@mui/icons-material/Class";
import EventNoteIcon from "@mui/icons-material/EventNote";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { ChartCard } from "@/components/ChartCard";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { useColorMode } from "@/context/ColorModeContext";
import { getChartPalette, getChartTooltipStyle, getIconAccent } from "@/theme/chartPalette";
import { getNotifications, getUnreadNotificationCount } from "@/api/notifications";
import type { Notification } from "@/types";

const weeklyActivity = [
  { day: "Mon", count: 5 },
  { day: "Tue", count: 6 },
  { day: "Wed", count: 6 },
  { day: "Thu", count: 4 },
  { day: "Fri", count: 6 },
];

export default function Dashboard() {
  const { mode } = useColorMode();
  const palette = getChartPalette(mode);
  const [unread, setUnread] = useState(0);
  const [rows, setRows] = useState<Notification[]>([]);

  useEffect(() => {
    let live = true;
    getUnreadNotificationCount().then((count) => { if (live) setUnread(count); });
    getNotifications().then((data) => { if (live) setRows(data); });
    return () => { live = false; };
  }, []);

  return (
    <>
      <PageHeader eyebrow="Overview" title="Student Dashboard" />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Unread Notifications" icon={<NotificationsIcon />} color={getIconAccent(mode, "notifications")} numericValue={unread} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Enrolled Courses" icon={<ClassIcon />} color={getIconAccent(mode, "enrolled-courses")} numericValue={6} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Attendance" icon={<EventNoteIcon />} color={getIconAccent(mode, "attendance")} numericValue={92} formatValue={(n) => `${n}%`} />
        </Grid>
      </Grid>
      <Grid container spacing={2.5}>
        <Grid size={12}>
          <ChartCard eyebrow="This Week" title="Classes Attended">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="day" stroke={palette.axis} fontSize={12} />
                <YAxis stroke={palette.axis} fontSize={12} />
                <Tooltip {...getChartTooltipStyle(mode)} />
                <Bar dataKey="count" fill={palette.categorical[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={12}>
          <DataTable<Notification>
            title="Recent Notifications"
            columns={[
              { key: "title", label: "Title" },
              { key: "postedBy", label: "Posted By" },
              {
                key: "read",
                label: "Status",
                render: (row) => <StatusChip status={row.read ? "read" : "unread"} />,
              },
              {
                key: "timestamp",
                label: "Date",
                render: (row) => new Date(row.timestamp).toLocaleDateString(),
              },
            ]}
            rows={rows}
            emptyTitle="No notifications yet"
          />
        </Grid>
      </Grid>
    </>
  );
}
```

- [ ] **Step 5: Verify the full project builds**

Run: `npm run build`
Expected: `tsc -b` reports no errors, `vite build` completes with `✓ built in <time>`, `dist/` is produced. No more "Cannot find module" errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/Dashboard.tsx src/pages/teacher/Dashboard.tsx src/pages/staff/Dashboard.tsx src/pages/student/Dashboard.tsx
git commit -m "Add placeholder dashboards for all 4 roles"
```

---

### Task 16: End-to-end manual verification

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: Vite prints a local URL (e.g. `http://localhost:5173/`).

- [ ] **Step 2: Verify the portal selection screen**

Open the printed URL in a browser. Expected: "KALNET College ERP" heading, 4 portal cards (Admin, Faculty, Operations, Student), each with an identity-colored top border, in light mode.

- [ ] **Step 3: Verify the login → dashboard flow for each role**

For each of the 4 portal cards: click it, confirm it navigates to `/login` with that role preselected in the dropdown, submit with any username/password, confirm it lands on `/admin`, `/teacher`, `/staff`, or `/student` respectively and renders that role's placeholder dashboard (PageHeader title, 3 stat cards with non-zero values, a bar chart, and a "Recent Notifications" table with a mix of Read/Unread status chips).

- [ ] **Step 4: Verify sidebar navigation and active-state**

Confirm the sidebar shows the user's initial avatar, name, and the correct portal label ("Admin Portal" / "Faculty Portal" / "Operations Portal" / "Student Portal"), with "Dashboard" highlighted as the active row.

- [ ] **Step 5: Verify dark mode**

Click the theme toggle in the AppBar. Confirm the whole shell (sidebar, AppBar, cards, chart, table) switches to the dark two-tone surface (`#0A0A0A`/`#1D1D1F`) with no unreadable/near-invisible text or hover states.

- [ ] **Step 6: Verify scroll reset and logout**

Scroll the dashboard content down (if it doesn't scroll at this content length, resize the window narrower to force it), then navigate away and back — confirm the content pane resets to the top on navigation. Click "Sign Out" — confirm it returns to the portal-selection screen at `/`.

- [ ] **Step 7: Run the linter**

Run: `npm run lint`
Expected: no errors (warnings are acceptable only if they pre-exist in the ported reference patterns; there should be none introduced by this plan's code).

- [ ] **Step 8: Stop the dev server, then commit**

No files change in this task; if Step 7 required any fixes, amend those specific files, then:

```bash
git add -A
git commit -m "Verify Phase 0 foundation end-to-end"
```

(Skip this commit entirely if Step 7 required no changes.)
