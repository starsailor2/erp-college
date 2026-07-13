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
