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
