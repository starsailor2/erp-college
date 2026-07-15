import { useNavigate } from "react-router-dom";
import { Button, Typography } from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";

const schedule = [
  { course: "CS201", examType: "Mid Sem", date: "2026-08-12", time: "10:00 AM", venue: "Exam Hall 1", role: "Invigilator" },
  { course: "CS202", examType: "Mid Sem", date: "2026-08-13", time: "10:00 AM", venue: "Exam Hall 2", role: "Setter" },
  { course: "CS203", examType: "Practical", date: "2026-08-14", time: "02:00 PM", venue: "Lab A", role: "Examiner" },
  { course: "CS204", examType: "End Sem", date: "2026-12-05", time: "10:00 AM", venue: "Exam Hall 1", role: "Coordinator" },
];

const evaluation = [
  { course: "CS201", exam: "Mid Sem", status: "completed", submitted: "2026-08-15" },
  { course: "CS202", exam: "Mid Sem", status: "in_progress", submitted: "—" },
  { course: "CS203", exam: "Practical", status: "pending", submitted: "—" },
];

export default function Exams() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader eyebrow="Academics" title="Exams" />
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Exam Schedule</Typography>
      <DataTable
        columns={[
          { key: "course", label: "Course" },
          { key: "examType", label: "Exam Type" },
          { key: "date", label: "Date" },
          { key: "time", label: "Time" },
          { key: "venue", label: "Venue" },
          { key: "role", label: "Role" },
        ]}
        rows={schedule}
        emptyTitle="No exams scheduled"
      />

      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 4, mb: 1.5 }}>Evaluation Status</Typography>
      <DataTable
        columns={[
          { key: "course", label: "Course" },
          { key: "exam", label: "Exam" },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
          { key: "submitted", label: "Submitted" },
          {
            key: "actions", label: "Action",
            render: (row) => row.status === "completed"
              ? <Button size="small" onClick={() => navigate("/teacher/marks")}>Download</Button>
              : <Button size="small" onClick={() => navigate("/teacher/marks")}>Evaluate</Button>,
          },
        ]}
        rows={evaluation}
        emptyTitle="No evaluations"
      />
    </>
  );
}
