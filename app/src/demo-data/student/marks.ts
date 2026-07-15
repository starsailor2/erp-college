import type { MarksSubject } from "@/types";

export const marksBySemester: Record<number, MarksSubject[]> = {
  6: [
    { code: "CS601", name: "Advanced Algorithms", test1: 18, test2: 19, assignment: 9, total: 46, maxTotal: 50 },
    { code: "CS602", name: "Machine Learning", test1: 16, test2: 17, assignment: 8, total: 41, maxTotal: 50 },
    { code: "CS603", name: "Distributed Systems", test1: 19, test2: 18, assignment: 10, total: 47, maxTotal: 50 },
  ],
  5: [
    { code: "CS501", name: "Operating Systems", test1: 17, test2: 18, assignment: 9, total: 44, maxTotal: 50 },
    { code: "CS502", name: "Computer Networks", test1: 19, test2: 19, assignment: 10, total: 48, maxTotal: 50 },
  ],
  4: [
    { code: "CS401", name: "Data Structures", test1: 19, test2: 20, assignment: 10, total: 49, maxTotal: 50 },
  ],
};

export const semesterGpaHistory = [
  { semester: 3, gpa: 8.2 },
  { semester: 4, gpa: 8.5 },
  { semester: 5, gpa: 8.8 },
  { semester: 6, gpa: 8.75 },
];
