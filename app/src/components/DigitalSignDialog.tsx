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
