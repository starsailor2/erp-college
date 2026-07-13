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
