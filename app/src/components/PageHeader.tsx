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
