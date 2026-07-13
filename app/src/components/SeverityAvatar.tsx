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
