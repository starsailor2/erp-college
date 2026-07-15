import type { DocumentSignature, DocumentSignatureStatus, DocumentUrgency } from "@/types";
import { randomFullName } from "@/demo-data/generators/namePools";
import { createRng } from "@/demo-data/generators/random";

const { pick, weightedPick, randomInt } = createRng(15071502);

const docTitles: { title: string; docType: string }[] = [
  { title: "Budget Allocation - Q1 2026", docType: "Finance" },
  { title: "Lab Equipment Procurement", docType: "Procurement" },
  { title: "Faculty Leave Policy Amendment", docType: "Policy" },
  { title: "Annual Academic Calendar 2026-27", docType: "Academic" },
  { title: "Research Grant Application - IoT Lab", docType: "Research" },
  { title: "Mid-Year Performance Review", docType: "Policy" },
  { title: "New Faculty Joining Approval", docType: "HR" },
  { title: "Hostel Renovation Budget", docType: "Finance" },
  { title: "Curriculum Revision Proposal", docType: "Academic" },
  { title: "Sports Equipment Purchase", docType: "Procurement" },
  { title: "Industry Collaboration MoU", docType: "Research" },
  { title: "Staff Promotion Recommendation", docType: "HR" },
];

const stages = ["HOD Review", "Dean Approval", "Finance Review", "Admin Review"];

const statuses: [DocumentSignatureStatus, number][] = [["pending", 25], ["in_progress", 35], ["completed", 40]];
const urgencies: [DocumentUrgency, number][] = [["normal", 85], ["urgent", 15]];

const DOCUMENT_COUNT = 20;

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function generateDocuments(): DocumentSignature[] {
  const list: DocumentSignature[] = [];
  for (let i = 0; i < DOCUMENT_COUNT; i++) {
    const source = pick(docTitles);
    const status = weightedPick(statuses);
    const doc: DocumentSignature = {
      id: `DOC-2026-${String(200 - i * 2).padStart(4, "0")}`,
      title: source.title,
      docType: source.docType,
      initiatedBy: randomFullName(pick),
      date: dateStr(2026, randomInt(1, 7), randomInt(1, 28)),
      status,
      urgency: status === "pending" ? weightedPick(urgencies) : "normal",
    };
    if (status === "in_progress") {
      doc.currentStage = pick(stages);
      doc.pendingWith = randomFullName(pick);
      doc.progressCurrent = randomInt(1, 2);
      doc.progressTotal = 3;
    }
    if (status === "completed") {
      doc.signaturesTotal = randomInt(3, 4);
      doc.signaturesCollected = doc.signaturesTotal;
    }
    list.push(doc);
  }
  return list;
}

export const documentSignatures: DocumentSignature[] = generateDocuments();

export function getDocumentById(id: string): DocumentSignature | undefined {
  return documentSignatures.find((d) => d.id === id);
}
