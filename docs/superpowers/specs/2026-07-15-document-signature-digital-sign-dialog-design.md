# Digital Signature Dialog — Design

## Purpose

Both Document Signatures pages (Admin's "Document Signature Management" and
Teacher's "Document Signatures") currently sign a document with a single
button click that instantly flips its status — there's no signing
experience at all. This adds a small modal that simulates how a real
e-signature product feels: upload the document, then apply a digital
signature to it. It's a UI experience only — no real vendor, no file
storage, no new data fields.

## Scope

- **Both portals.** Admin's "Sign" button and Teacher's "Review & Sign"
  button both open the same dialog.
- **No vendor branding.** Generic labels only ("Digital Signature",
  "Secured & Verified Digital Signature") — no product/company name
  anywhere in the UI or code (component name, strings, comments).
- **Presentation only.** The dialog collects the upload + signature
  interaction and then calls back to the page; the actual signing logic
  (`signDocument` / `signTeacherDocument`, status transitions) is
  unchanged — only the trigger path moves from "click Sign" to "click Sign
  → complete the dialog."
- **No new data model.** No new fields on `DocumentSignature` or
  `TeacherDocument`, no verification ID, no persisted "uploaded file" —
  the chosen filename lives only in the dialog's own local state for the
  duration it's open.

## Component

One new shared component: `app/src/components/DigitalSignDialog.tsx`.

**Props:**
```ts
interface DigitalSignDialogProps {
  open: boolean;
  documentTitle: string;
  onClose: () => void;
  onConfirm: () => void;
}
```

`onConfirm` fires once the signature step is completed; the calling page
is responsible for the actual sign API call and reloading its row data,
exactly as it does today — this dialog has no knowledge of which portal
or which API function it's wired to.

## Flow

Two steps, tracked with local `step: "upload" | "sign"` state and rendered
with the existing `PipelineStepper` component (`app/src/components/PipelineStepper.tsx`)
as a 2-step progress indicator at the top of the dialog:

1. **Upload step** — shows the document title being signed, a "Choose
   File" button wired to a native `<input type="file">` (hidden, triggered
   via the button — the first file input in this codebase). Once a file
   is chosen, its name is displayed with a checkmark. There is no real
   storage or parsing of the file's contents — this is purely a UI
   simulation, consistent with the rest of the app having no backend.
   "Continue to Sign" is disabled until a file is chosen.
2. **Digital Sign step** — a text field labeled "Type your name to sign",
   with a live preview of that text rendered in a cursive font directly
   below it as the simulated signature. "Apply Digital Signature" is
   disabled until the name field is non-empty. Clicking it calls
   `onConfirm()`.

Closing the dialog (via the close button or clicking outside) at any point
resets its internal state back to the upload step for next time — nothing
is signed unless "Apply Digital Signature" is clicked.

## Wiring Into Existing Pages

**`app/src/pages/teacher/DocumentSignatures.tsx`:** the "Review & Sign"
button (in the `actions` column render, currently `onClick={() =>
handleSign(row.id)}`) instead opens `DigitalSignDialog` with that row's
`title`. The dialog's `onConfirm` calls the existing `handleSign(row.id)`
logic and closes the dialog.

**`app/src/pages/admin/DocumentSignatures.tsx`:** the same change for the
"Sign" button (currently `onClick={() => handleSign(row.id)}` in the
`actions` column), using the page's own existing `handleSign`.

Both pages track which row is being signed (e.g. `const [signingDoc,
setSigningDoc] = useState<{ id: string; title: string } | null>(null)`) so
the dialog knows the document title to display and `onConfirm` knows which
row's existing `handleSign` to call.

## Non-Goals

- No vendor/product name anywhere (component name, UI copy, code comments).
- No new "signed via X" badge, verification ID, or header branding on
  either page — this was explicitly ruled out; the dialog is the only
  place this feature is visible.
- No real file upload, storage, or document preview.
- No change to the underlying signing/status logic, multi-stage approval
  chains, or any other part of either page.
