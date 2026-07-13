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
