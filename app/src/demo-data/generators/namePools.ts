import { pick } from "./random";

export const firstNames = [
  "Aarav", "Vivaan", "Aditya", "Ishaan", "Reyansh", "Kabir", "Aryan", "Dhruv",
  "Ananya", "Diya", "Ishita", "Kavya", "Meera", "Priya", "Riya", "Saanvi",
  "Rohan", "Karan", "Nikhil", "Sanjay", "Anjali", "Neha", "Pooja", "Shreya",
];

export const lastNames = [
  "Sharma", "Verma", "Gupta", "Mehta", "Kumar", "Singh", "Reddy", "Nair",
  "Iyer", "Rao", "Chatterjee", "Bose", "Malhotra", "Kapoor", "Joshi", "Das",
];

export function randomFullName(): string {
  return `${pick(firstNames)} ${pick(lastNames)}`;
}
