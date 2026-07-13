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
