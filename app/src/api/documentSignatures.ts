import { simulateRequest } from "@/api/http";
import { documentSignatures, getDocumentById } from "@/demo-data/communication/documentSignatures";
import type { DocumentSignature } from "@/types";

export function getDocumentSignatures(): Promise<DocumentSignature[]> {
  return simulateRequest(documentSignatures);
}

export function signDocument(id: string): Promise<DocumentSignature | undefined> {
  const doc = getDocumentById(id);
  if (doc) {
    if (doc.status === "pending") {
      doc.status = "in_progress";
      doc.currentStage = "HOD Review";
      doc.pendingWith = "Department HOD";
      doc.progressCurrent = 1;
      doc.progressTotal = 3;
    } else if (doc.status === "in_progress") {
      if ((doc.progressCurrent ?? 0) < (doc.progressTotal ?? 3)) {
        doc.progressCurrent = (doc.progressCurrent ?? 0) + 1;
      } else {
        doc.status = "completed";
        doc.signaturesTotal = doc.progressTotal ?? 3;
        doc.signaturesCollected = doc.signaturesTotal;
        doc.currentStage = undefined;
        doc.pendingWith = undefined;
      }
    }
  }
  return simulateRequest(doc);
}
