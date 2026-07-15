# Digital Signature Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the instant one-click "Sign" / "Review & Sign" action on both Document Signatures pages (Admin and Teacher) with a shared modal that simulates an upload-then-sign digital signature experience.

**Architecture:** One new presentation-only component, `DigitalSignDialog`, tracks its own two-step internal state (upload a file, then type-to-sign) using the existing `PipelineStepper` component for the progress indicator. It knows nothing about which portal or API it's wired to — the calling page passes a document title and an `onConfirm` callback that runs the page's existing (unchanged) sign logic.

**Tech Stack:** React 19, TypeScript 5.8, MUI v7. No new dependencies.

## Global Constraints

- No vendor/product name anywhere — not in the component name, UI copy, or code comments. Generic labels only ("Digital Signature", "Secured & Verified Digital Signature").
- Presentation only — the dialog never calls `signDocument`/`signTeacherDocument` itself; it only invokes `onConfirm`, and the calling page keeps its existing sign logic unchanged.
- No new fields on `DocumentSignature` or `TeacherDocument`, no verification ID, no real file storage — the chosen filename lives only in the dialog's own local state.
- No automated test framework in this codebase (established project convention) — every task is verified manually via `npm run dev` and the browser.
- Path alias `@/` maps to `app/src/`. Run `npx tsc -b` from `app/` after every task as a type-check gate.

---

### Task 1: Build the Digital Sign Dialog and wire it into the Teacher portal

**Files:**
- Create: `app/src/components/DigitalSignDialog.tsx`
- Modify: `app/src/pages/teacher/DocumentSignatures.tsx`

**Interfaces:**
- Produces: `DigitalSignDialog` default export, props `{ open: boolean; documentTitle: string; onClose: () => void; onConfirm: () => void }`.
- Consumes: `PipelineStepper` and `PipelineStep` from `@/components/PipelineStepper` (existing: `steps: PipelineStep[]` where `PipelineStep = { label: string; status: "done" | "active" | "pending"; timestamp?: string; detail?: string }`).

- [ ] **Step 1: Create the dialog component**

Create `app/src/components/DigitalSignDialog.tsx`:

```tsx
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { PipelineStepper, type PipelineStep } from "@/components/PipelineStepper";

type SignStep = "upload" | "sign";

interface DigitalSignDialogProps {
  open: boolean;
  documentTitle: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DigitalSignDialog({ open, documentTitle, onClose, onConfirm }: DigitalSignDialogProps) {
  const [step, setStep] = useState<SignStep>("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setStep("upload");
      setFileName(null);
      setSignatureName("");
    }
  }, [open]);

  const steps: PipelineStep[] = [
    { label: "Upload Document", status: step === "upload" ? "active" : "done" },
    { label: "Digital Signature", status: step === "sign" ? "active" : "pending" },
  ];

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Digital Signature</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3, mt: 1 }}>
          <PipelineStepper steps={steps} />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {documentTitle}
        </Typography>

        {step === "upload" ? (
          <Stack spacing={2} alignItems="flex-start">
            <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileChange} />
            <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => fileInputRef.current?.click()}>
              Choose File
            </Button>
            {fileName && (
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircleIcon fontSize="small" color="success" />
                <Typography variant="body2">{fileName}</Typography>
              </Stack>
            )}
          </Stack>
        ) : (
          <Stack spacing={2}>
            <TextField
              label="Type your name to sign"
              fullWidth
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              autoFocus
            />
            <Box
              sx={{
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 1,
                p: 3,
                minHeight: 80,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography sx={{ fontFamily: "'Segoe Script', 'Brush Script MT', cursive", fontSize: 32 }}>
                {signatureName || "Your signature"}
              </Typography>
            </Box>
          </Stack>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 3 }}>
          Secured & Verified Digital Signature
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {step === "upload" ? (
          <Button variant="contained" disabled={!fileName} onClick={() => setStep("sign")}>
            Continue to Sign
          </Button>
        ) : (
          <Button variant="contained" disabled={!signatureName.trim()} onClick={onConfirm}>
            Apply Digital Signature
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
```

- [ ] **Step 2: Wire it into the Teacher portal's Document Signatures page**

In `app/src/pages/teacher/DocumentSignatures.tsx`, add the import after the existing `StatusChip` import:

```ts
import StatusChip from "@/components/StatusChip";
import DigitalSignDialog from "@/components/DigitalSignDialog";
```

Add state for which document is being signed, right after the existing `snackbar` state:

```tsx
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [signingDoc, setSigningDoc] = useState<{ id: string; title: string } | null>(null);
```

Replace the "Review & Sign" button's `onClick` — find:

```tsx
              ? <Button size="small" variant="contained" onClick={() => handleSign(row.id)}>Review & Sign</Button>
```

and change it to:

```tsx
              ? <Button size="small" variant="contained" onClick={() => setSigningDoc({ id: row.id, title: row.title })}>Review & Sign</Button>
```

Mount the dialog right after the existing `<Snackbar ... />` line:

```tsx
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
      <DigitalSignDialog
        open={!!signingDoc}
        documentTitle={signingDoc?.title ?? ""}
        onClose={() => setSigningDoc(null)}
        onConfirm={() => {
          if (signingDoc) handleSign(signingDoc.id);
          setSigningDoc(null);
        }}
      />
```

- [ ] **Step 3: Type-check**

Run from `app/`:

```bash
npx tsc -b
```

Expected: no errors.

- [ ] **Step 4: Manual verification in the browser**

Start the dev server if it isn't running (`npm run dev` from `app/`). Log in, pick **Faculty** as the role, and navigate to Document Signatures (Communication section).

1. Find a row under "Assigned to Me" with a "Review & Sign" button and click it.
2. Confirm a dialog titled "Digital Signature" opens, showing a 2-step progress indicator ("Upload Document" active, "Digital Signature" pending), the document's title, and a disabled "Continue to Sign" button.
3. Click "Choose File", pick any file from your machine. Confirm the filename appears with a checkmark and "Continue to Sign" becomes enabled.
4. Click "Continue to Sign". Confirm the stepper updates ("Upload Document" done, "Digital Signature" active) and the view switches to a "Type your name to sign" field with an empty cursive preview box below it, plus a disabled "Apply Digital Signature" button.
5. Type a name — confirm the cursive preview updates live and "Apply Digital Signature" becomes enabled.
6. Click "Apply Digital Signature". Confirm the dialog closes, the row's status/action updates the same way it did before this change (moves out of the pending "Review & Sign" state), and the "Document signed successfully" snackbar appears.
7. Click "Review & Sign" on a different row, then click Cancel partway through (after choosing a file, before signing). Confirm the dialog closes without changing that row's status. Reopen it on the same row and confirm it resets back to the upload step (not stuck on the sign step).
8. Confirm no vendor/product name appears anywhere in the dialog — only "Digital Signature" and "Secured & Verified Digital Signature".

- [ ] **Step 5: Commit**

```bash
git add app/src/components/DigitalSignDialog.tsx app/src/pages/teacher/DocumentSignatures.tsx
git commit -m "Add digital sign dialog and wire it into Teacher Document Signatures"
```

---

### Task 2: Wire the Digital Sign Dialog into the Admin portal

**Files:**
- Modify: `app/src/pages/admin/DocumentSignatures.tsx`

**Interfaces:**
- Consumes: `DigitalSignDialog` from `@/components/DigitalSignDialog` (Task 1) — same props as above. No changes to the component itself.

- [ ] **Step 1: Wire it into the Admin portal's Document Signature Management page**

In `app/src/pages/admin/DocumentSignatures.tsx`, add the import after the existing `StatusChip` import:

```ts
import StatusChip from "@/components/StatusChip";
import DigitalSignDialog from "@/components/DigitalSignDialog";
```

Add state for which document is being signed, right after the existing `snackbar` state:

```tsx
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [signingDoc, setSigningDoc] = useState<{ id: string; title: string } | null>(null);
```

Replace the "Sign" button's `onClick` — find:

```tsx
                {row.status !== "completed" && <Button size="small" variant="contained" onClick={() => handleSign(row.id)}>Sign</Button>}
```

and change it to:

```tsx
                {row.status !== "completed" && <Button size="small" variant="contained" onClick={() => setSigningDoc({ id: row.id, title: row.title })}>Sign</Button>}
```

Mount the dialog right after the existing `<Snackbar ... />` line:

```tsx
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
      <DigitalSignDialog
        open={!!signingDoc}
        documentTitle={signingDoc?.title ?? ""}
        onClose={() => setSigningDoc(null)}
        onConfirm={() => {
          if (signingDoc) handleSign(signingDoc.id);
          setSigningDoc(null);
        }}
      />
```

- [ ] **Step 2: Type-check**

Run from `app/`:

```bash
npx tsc -b
```

Expected: no errors.

- [ ] **Step 3: Manual verification in the browser**

With the dev server running, log in as **Admin** and navigate to Document Signature Management (Communication section).

1. Find a row that isn't "Completed" and click its "Sign" button.
2. Repeat the same checks as Task 1's Step 4 (steps 2–8): dialog opens with progress indicator, upload gates the continue button, sign step shows the cursive preview, applying the signature closes the dialog and updates the row/snackbar exactly as the old direct "Sign" click used to, cancel-and-reopen resets to the upload step, and no vendor name appears anywhere.
3. Confirm the "Completed" rows (no "Sign" button, just "Download"/"History") are unaffected — this change only touches rows that still show "Sign".

- [ ] **Step 4: Commit**

```bash
git add app/src/pages/admin/DocumentSignatures.tsx
git commit -m "Wire digital sign dialog into Admin Document Signature Management"
```
