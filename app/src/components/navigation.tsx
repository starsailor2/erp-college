import type { Role, TeacherRole, StaffRole } from "@/types";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import GroupsIcon from "@mui/icons-material/Groups";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EventNoteIcon from "@mui/icons-material/EventNote";
import ScheduleIcon from "@mui/icons-material/Schedule";
import GradingIcon from "@mui/icons-material/Grading";
import AssessmentIcon from "@mui/icons-material/Assessment";
import InventoryIcon from "@mui/icons-material/Inventory";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import HotelIcon from "@mui/icons-material/Hotel";
import EventIcon from "@mui/icons-material/Event";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import PaymentIcon from "@mui/icons-material/Payment";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptIcon from "@mui/icons-material/Receipt";
import CampaignIcon from "@mui/icons-material/Campaign";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import TuneIcon from "@mui/icons-material/Tune";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SettingsIcon from "@mui/icons-material/Settings";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PublicIcon from "@mui/icons-material/Public";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import RuleIcon from "@mui/icons-material/Rule";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ChatIcon from "@mui/icons-material/Chat";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import AddTaskIcon from "@mui/icons-material/AddTask";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import BarChartIcon from "@mui/icons-material/BarChart";
import UpdateIcon from "@mui/icons-material/Update";
import type { ReactNode } from "react";

export interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  group?: string;
  children?: { label: string; path: string }[];
}

export function getNavItems(role: Role, teacherRole: TeacherRole = "professor", staffRole: StaffRole = "assigner"): NavItem[] {
  switch (role) {
    case "admin":
      return [
        { label: "Dashboard", path: "/admin", icon: <DashboardIcon /> },
        { label: "Students", path: "/admin/students", icon: <GroupsIcon />, group: "Academics" },
        { label: "Faculty", path: "/admin/faculty", icon: <SchoolIcon />, group: "Academics" },
        { label: "Courses", path: "/admin/courses", icon: <MenuBookIcon />, group: "Academics" },
        { label: "Departments", path: "/admin/departments", icon: <AccountBalanceIcon />, group: "Academics" },
        { label: "Registration", path: "/admin/registration", icon: <AssignmentIcon />, group: "Academics" },
        { label: "Attendance", path: "/admin/attendance", icon: <EventNoteIcon />, group: "Academics" },
        { label: "Timetable", path: "/admin/timetable", icon: <ScheduleIcon />, group: "Academics" },
        { label: "Exams", path: "/admin/exams", icon: <GradingIcon />, group: "Academics" },
        { label: "Results", path: "/admin/results", icon: <AssessmentIcon />, group: "Academics" },
        { label: "Asset Master", path: "/admin/assets", icon: <InventoryIcon />, group: "Operations" },
        { label: "Maintenance Tickets", path: "/admin/tickets", icon: <ConfirmationNumberIcon />, group: "Operations" },
        { label: "Hostel Management", path: "/admin/hostel", icon: <HotelIcon />, group: "Operations" },
        { label: "Facility / Booking", path: "/admin/facility", icon: <EventIcon />, group: "Operations" },
        { label: "Library Management", path: "/admin/library", icon: <LocalLibraryIcon />, group: "Operations" },
        { label: "Fee Structure", path: "/admin/fees/structure", icon: <PaymentIcon />, group: "Finance" },
        { label: "Student Fee Ledger", path: "/admin/fees/ledger", icon: <AccountBalanceWalletIcon />, group: "Finance" },
        { label: "Payments & Waivers", path: "/admin/fees/payments", icon: <ReceiptIcon />, group: "Finance" },
        { label: "Notices & Announcements", path: "/admin/notices", icon: <CampaignIcon />, group: "Communication" },
        { label: "Document Signatures", path: "/admin/documents", icon: <HistoryEduIcon />, group: "Communication" },
        { label: "Audit Logs", path: "/admin/audit-logs", icon: <ManageSearchIcon />, group: "System" },
        { label: "System Health", path: "/admin/system-health", icon: <MonitorHeartIcon />, group: "System" },
        { label: "Configurations", path: "/admin/configurations", icon: <TuneIcon />, group: "System" },
        { label: "My Profile", path: "/admin/profile", icon: <AccountCircleIcon />, group: "System" },
        { label: "Settings", path: "/admin/settings", icon: <SettingsIcon />, group: "System" },
        { label: "Users", path: "/admin/users", icon: <PeopleIcon />, group: "Administration" },
      ];
    case "teacher": {
      const items: NavItem[] = [
        { label: "Dashboard", path: "/teacher", icon: <DashboardIcon /> },
        { label: "My Courses", path: "/teacher/courses", icon: <MenuBookIcon />, group: "Academics" },
        { label: "Attendance", path: "/teacher/attendance", icon: <EventNoteIcon />, group: "Academics" },
        { label: "Internal Marks", path: "/teacher/marks", icon: <GradingIcon />, group: "Academics" },
        { label: "Exams", path: "/teacher/exams", icon: <AssessmentIcon />, group: "Academics" },
        { label: "Course Materials", path: "/teacher/materials", icon: <UploadFileIcon />, group: "Academics" },
        { label: "My Course Students", path: "/teacher/students", icon: <GroupsIcon />, group: "Students" },
        { label: "Department Students", path: "/teacher/dept-students", icon: <AccountBalanceIcon />, group: "Students" },
        { label: "Academic Cohort", path: "/teacher/cohort", icon: <PublicIcon />, group: "Students" },
        { label: "Student Performance", path: "/teacher/performance", icon: <TrendingUpIcon />, group: "Students" },
        { label: "Leave Requests", path: "/teacher/leave", icon: <EventBusyIcon />, group: "Requests" },
        { label: "Grade Change Requests", path: "/teacher/grade-change", icon: <RuleIcon />, group: "Requests" },
        { label: "Resource Requests", path: "/teacher/resources", icon: <Inventory2Icon />, group: "Requests" },
        { label: "Notices", path: "/teacher/notices", icon: <CampaignIcon />, group: "Communication" },
        { label: "Messages", path: "/teacher/messages", icon: <ChatIcon />, group: "Communication" },
        { label: "Document Signatures", path: "/teacher/documents", icon: <HistoryEduIcon />, group: "Communication" },
        { label: "Department Overview", path: "/teacher/department-overview", icon: <AccountBalanceIcon />, group: "HOD Functions" },
        { label: "Attendance Approval", path: "/teacher/attendance-approval", icon: <EventNoteIcon />, group: "HOD Functions" },
        { label: "Marks Approval", path: "/teacher/marks-approval", icon: <GradingIcon />, group: "HOD Functions" },
        { label: "Faculty Workload", path: "/teacher/workload", icon: <AssessmentIcon />, group: "HOD Functions" },
        { label: "Student Issues", path: "/teacher/student-issues", icon: <RuleIcon />, group: "HOD Functions" },
        { label: "Academic Overview", path: "/teacher/academic-overview", icon: <PublicIcon />, group: "Dean Functions" },
        { label: "Policy & Deadlines", path: "/teacher/policy-deadlines", icon: <EventIcon />, group: "Dean Functions" },
        { label: "Inter-Department Reports", path: "/teacher/inter-dept-reports", icon: <AssessmentIcon />, group: "Dean Functions" },
        { label: "Approvals Dashboard", path: "/teacher/approvals", icon: <PendingActionsIcon />, group: "Dean Functions" },
        { label: "My Profile", path: "/teacher/profile", icon: <AccountCircleIcon />, group: "_bottom" },
      ];
      return items.filter((item) => {
        if (item.group === "HOD Functions") return teacherRole !== "professor";
        if (item.group === "Dean Functions") return teacherRole === "dean";
        return true;
      });
    }
    case "staff": {
      const items: NavItem[] = [
        { label: "Dashboard", path: "/staff", icon: <DashboardIcon /> },
        { label: "Create Task", path: "/staff/create-task", icon: <AddTaskIcon />, group: "Task Management" },
        { label: "Assign Task", path: "/staff/assign-task", icon: <AssignmentIndIcon />, group: "Task Management" },
        { label: "Task Overview", path: "/staff/tasks", icon: <AssignmentIcon />, group: "Task Management" },
        { label: "Team View", path: "/staff/team", icon: <GroupsIcon />, group: "Team" },
        { label: "Reports", path: "/staff/reports", icon: <BarChartIcon />, group: "Analytics" },
        { label: "Update Status", path: "/staff/update-status", icon: <UpdateIcon />, group: "My Work" },
        { label: "Completed Tasks", path: "/staff/completed-tasks", icon: <FactCheckIcon />, group: "My Work" },
        { label: "My Profile", path: "/staff/profile", icon: <AccountCircleIcon />, group: "_bottom" },
      ];
      return items.filter((item) => {
        if (item.group === "Task Management" || item.group === "Team" || item.group === "Analytics") return staffRole === "assigner";
        if (item.group === "My Work") return staffRole === "executor";
        return true;
      });
    }
    case "student":
      return [{ label: "Dashboard", path: "/student", icon: <DashboardIcon /> }];
  }
}
