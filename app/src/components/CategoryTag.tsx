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
