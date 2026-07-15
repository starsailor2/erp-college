import type { StudentCourse, RegistrationCourse } from "@/types";

export const studentCourses: StudentCourse[] = [
  { code: "CS601", name: "Advanced Algorithms", instructor: "Dr. Priya Menon", section: "A", credits: 4, semester: 6, grade: "-", attendancePct: 88 },
  { code: "CS602", name: "Machine Learning", instructor: "Dr. Arjun Rao", section: "A", credits: 4, semester: 6, grade: "-", attendancePct: 82 },
  { code: "CS603", name: "Distributed Systems", instructor: "Dr. Kavita Iyer", section: "B", credits: 3, semester: 6, grade: "-", attendancePct: 90 },
  { code: "CS604", name: "Cloud Computing", instructor: "Prof. Sanjay Gupta", section: "A", credits: 3, semester: 6, grade: "-", attendancePct: 79 },
  { code: "HS601", name: "Engineering Ethics", instructor: "Dr. Meera Nair", section: "A", credits: 2, semester: 6, grade: "-", attendancePct: 95 },
  { code: "EC601", name: "Digital Signal Processing", instructor: "Dr. Vikram Shah", section: "C", credits: 3, semester: 6, grade: "-", attendancePct: 85 },
  { code: "CS501", name: "Operating Systems", instructor: "Dr. Priya Menon", section: "A", credits: 4, semester: 5, grade: "A", attendancePct: 91 },
  { code: "CS502", name: "Computer Networks", instructor: "Dr. Arjun Rao", section: "A", credits: 4, semester: 5, grade: "A+", attendancePct: 89 },
  { code: "CS503", name: "Database Systems", instructor: "Dr. Kavita Iyer", section: "B", credits: 4, semester: 5, grade: "B+", attendancePct: 86 },
  { code: "CS504", name: "Theory of Computation", instructor: "Prof. Sanjay Gupta", section: "A", credits: 3, semester: 5, grade: "A", attendancePct: 88 },
  { code: "CS401", name: "Data Structures", instructor: "Dr. Priya Menon", section: "A", credits: 4, semester: 4, grade: "A+", attendancePct: 93 },
  { code: "CS402", name: "Object Oriented Programming", instructor: "Dr. Arjun Rao", section: "A", credits: 4, semester: 4, grade: "A", attendancePct: 90 },
  { code: "MA401", name: "Discrete Mathematics", instructor: "Dr. Ramesh Kumar", section: "A", credits: 3, semester: 4, grade: "B+", attendancePct: 84 },
  { code: "CS301", name: "Digital Logic Design", instructor: "Dr. Kavita Iyer", section: "A", credits: 3, semester: 3, grade: "A", attendancePct: 87 },
  { code: "CS302", name: "Computer Organization", instructor: "Prof. Sanjay Gupta", section: "A", credits: 4, semester: 3, grade: "A", attendancePct: 89 },
  { code: "MA301", name: "Probability & Statistics", instructor: "Dr. Ramesh Kumar", section: "A", credits: 3, semester: 3, grade: "B", attendancePct: 82 },
  { code: "CS201", name: "Programming Fundamentals", instructor: "Dr. Priya Menon", section: "A", credits: 4, semester: 2, grade: "A+", attendancePct: 94 },
  { code: "PH201", name: "Engineering Physics", instructor: "Dr. Anjali Desai", section: "A", credits: 3, semester: 2, grade: "A", attendancePct: 88 },
  { code: "CS101", name: "Introduction to Computing", instructor: "Dr. Priya Menon", section: "A", credits: 3, semester: 1, grade: "A+", attendancePct: 96 },
  { code: "MA101", name: "Calculus", instructor: "Dr. Ramesh Kumar", section: "A", credits: 4, semester: 1, grade: "A", attendancePct: 90 },
];

export const registrationCatalog: RegistrationCourse[] = [
  { code: "CS701", name: "Deep Learning", credits: 4, category: "core", instructor: "Dr. Arjun Rao", seatsAvailable: 12 },
  { code: "CS702", name: "Blockchain Technology", credits: 3, category: "core", instructor: "Dr. Kavita Iyer", seatsAvailable: 18 },
  { code: "CS703", name: "Natural Language Processing", credits: 3, category: "core", instructor: "Prof. Sanjay Gupta", seatsAvailable: 10 },
  { code: "CS704", name: "Computer Vision", credits: 3, category: "core", instructor: "Dr. Priya Menon", seatsAvailable: 15 },
  { code: "CS711", name: "Quantum Computing", credits: 3, category: "elective", instructor: "Dr. Vikram Shah", seatsAvailable: 20 },
  { code: "CS712", name: "Game Development", credits: 3, category: "elective", instructor: "Dr. Meera Nair", seatsAvailable: 25 },
  { code: "EC701", name: "IoT Systems", credits: 3, category: "interdisciplinary", instructor: "Dr. Vikram Shah", seatsAvailable: 22 },
  { code: "ME701", name: "Robotics Fundamentals", credits: 3, category: "interdisciplinary", instructor: "Dr. Anjali Desai", seatsAvailable: 16 },
  { code: "BM701", name: "Biomedical Instrumentation", credits: 3, category: "interdisciplinary", instructor: "Dr. Ramesh Kumar", seatsAvailable: 14 },
  { code: "MA701", name: "Applied Optimization", credits: 3, category: "interdisciplinary", instructor: "Dr. Ramesh Kumar", seatsAvailable: 20 },
  { code: "DS801", name: "Data Science Minor - Foundations", credits: 4, category: "minor", instructor: "Dr. Arjun Rao", seatsAvailable: 30 },
  { code: "DS802", name: "Data Science Minor - Applied Analytics", credits: 4, category: "minor", instructor: "Dr. Kavita Iyer", seatsAvailable: 28 },
];

export const registeredCourseCodes: string[] = ["CS701", "CS702"];
