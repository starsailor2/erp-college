import { Suspense, useMemo, useRef, useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar, Toolbar, Typography, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, IconButton, Box, Avatar, Tooltip, Badge, useMediaQuery, useTheme,
  FormControl, MenuItem, Select,
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
import { TeacherRoleContext, useTeacherRoleState } from "@/context/TeacherRoleContext";
import type { TeacherRole } from "@/types";
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
  const { role: teacherRole, setRole: setTeacherRole } = useTeacherRoleState();
  const sidebarTokens = getSidebarTokens(mode);
  const navigate = useNavigate();
  const location = useLocation();

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const toggleSubmenu = (label: string) => setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));

  const navItems = useMemo(() => getNavItems(role, teacherRole), [role, teacherRole]);

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
    const sortedOrder = [...order.filter((g) => g !== "_bottom"), ...order.filter((g) => g === "_bottom")];
    return sortedOrder.map((g) => ({ group: g, items: map.get(g)! }));
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
            {group && group !== "_bottom" && (
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
    <TeacherRoleContext.Provider value={{ role: teacherRole, setRole: setTeacherRole }}>
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

          {role === "teacher" && (
            <FormControl size="small" sx={{ minWidth: 130, mr: 1 }}>
              <Select
                value={teacherRole}
                onChange={(e) => setTeacherRole(e.target.value as TeacherRole)}
                sx={{ fontSize: 14 }}
              >
                <MenuItem value="professor">Professor</MenuItem>
                <MenuItem value="hod">HOD</MenuItem>
                <MenuItem value="dean">Dean</MenuItem>
              </Select>
            </FormControl>
          )}

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
    </TeacherRoleContext.Provider>
  );
}
