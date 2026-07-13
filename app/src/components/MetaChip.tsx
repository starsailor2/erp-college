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
