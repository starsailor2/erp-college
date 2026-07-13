import type { Course, CourseType } from "@/types";
import { departmentSeeds } from "./departmentSeeds";
import { faculty } from "@/demo-data/people/faculty";
import { createRng } from "@/demo-data/generators/random";

const { pick, weightedPick, randomInt } = createRng(60260711);

const courseNamesByDept: Record<string, string[]> = {
  CSE: ["Introduction to Programming", "Data Structures", "Database Systems", "Operating Systems", "Computer Networks", "Software Engineering", "Algorithms", "Web Development", "Machine Learning", "Artificial Intelligence"],
  MATH: ["Linear Algebra", "Calculus I", "Calculus II", "Differential Equations", "Probability & Statistics", "Discrete Mathematics", "Real Analysis", "Number Theory", "Numerical Methods", "Abstract Algebra"],
  PHY: ["Mechanics", "Electromagnetism", "Quantum Physics", "Thermodynamics", "Optics", "Waves & Oscillations", "Nuclear Physics", "Solid State Physics", "Modern Physics", "Astrophysics"],
  ECE: ["Circuit Theory", "Digital Electronics", "Signal Processing", "Microprocessors", "Communication Systems", "Control Systems", "VLSI Design", "Embedded Systems", "Electromagnetic Theory", "Power Electronics"],
  MECH: ["Engineering Mechanics", "Fluid Mechanics", "Machine Design", "Manufacturing Processes", "Heat Transfer", "Robotics", "Strength of Materials", "Automobile Engineering", "CAD/CAM", "Industrial Engineering"],
};

const courseTypes: [CourseType, number][] = [
  ["core", 6],
  ["elective", 3],
  ["lab", 2],
];

const days = ["Monday", "Wednesday", "Friday"];

function levelForIndex(i: number): number {
  if (i < 2) return 100;
  if (i < 4) return 200;
  if (i < 7) return 300;
  return 400;
}

function generateCourses(): Course[] {
  const list: Course[] = [];
  for (const dept of departmentSeeds) {
    const deptFaculty = faculty.filter((f) => f.departmentId === dept.id);
    const names = courseNamesByDept[dept.id];
    names.forEach((name, i) => {
      const level = levelForIndex(i);
      const instructor = pick(deptFaculty);
      list.push({
        id: `${dept.id}${level + i + 1}`,
        name,
        credits: pick([3, 3.5, 4]),
        departmentId: dept.id,
        type: weightedPick(courseTypes),
        status: "active",
        instructorFacultyId: instructor?.id ?? "",
        description: `Core concepts and applications of ${name.toLowerCase()}, part of the ${dept.name} curriculum.`,
        learningOutcomes: [
          "Understand fundamental concepts and terminology",
          "Apply theoretical knowledge to practical problems",
          "Analyze and evaluate real-world case studies",
        ],
        schedule: [{ day: pick(days), time: "10:00 AM - 11:30 AM", room: `Room ${randomInt(101, 350)}` }],
        avgAttendancePct: randomInt(75, 95),
        passRatePct: randomInt(80, 98),
      });
    });
  }
  return list;
}

export const courses: Course[] = generateCourses();

// Back-fill each instructor's `coursesTeaching` now that courses (and their
// instructor assignments) exist — faculty.ts runs first and has no way to
// know which courses will pick it as instructor, so this is the one place
// that link can be completed.
for (const course of courses) {
  const instructor = faculty.find((f) => f.id === course.instructorFacultyId);
  if (instructor && !instructor.coursesTeaching.includes(course.id)) {
    instructor.coursesTeaching.push(course.id);
  }
}

export function getCourseById(id: string): Course | undefined {
  return courses.find((c) => c.id === id);
}

export function getCoursesByDepartment(departmentId: string): Course[] {
  return courses.filter((c) => c.departmentId === departmentId);
}

export function getCourseLevel(course: Course): number {
  const match = course.id.match(/\d+/);
  const num = match ? parseInt(match[0], 10) : 100;
  return Math.floor(num / 100) * 100;
}
