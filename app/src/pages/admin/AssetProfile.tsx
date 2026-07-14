import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl, Stack, Typography, Paper, Grid, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import { PageHeader } from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatusChip from "@/components/StatusChip";
import { getAssetByIdAsync, updateAsset } from "@/api/assets";
import type { Asset, AssetStatus } from "@/types";

function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function AssetProfile() {
  const { id } = useParams();
  const [asset, setAsset] = useState<Asset | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", status: "active" as AssetStatus, value: 0, location: "" });
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => {
    if (id) getAssetByIdAsync(id).then((data) => { setAsset(data); setLoaded(true); });
  };
  useEffect(() => { load(); }, [id]);

  if (loaded && !asset) {
    return <EmptyState title="Asset not found" description={`No asset with id "${id}".`} />;
  }
  if (!asset) return null;

  const openEdit = () => { setEditForm({ name: asset.name, status: asset.status, value: asset.value, location: asset.location }); setEditOpen(true); };
  const handleSave = () => { updateAsset(asset.id, editForm).then(load); setEditOpen(false); };

  return (
    <>
      <PageHeader
        eyebrow="Assets"
        title={asset.name}
        breadcrumbs={[{ label: "Assets", to: "/admin/assets" }, { label: asset.id }]}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={openEdit}>Edit Asset</Button>
            <Button variant="contained" onClick={() => setSnackbar("Asset transfer initiated")}>Transfer Asset</Button>
          </Stack>
        }
      />
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 6, sm: 4 }}><Typography variant="caption" color="text.secondary">Asset ID</Typography><Typography variant="body1">{asset.id}</Typography></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><Typography variant="caption" color="text.secondary">Category</Typography><Typography variant="body1">{asset.type}</Typography></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><Typography variant="caption" color="text.secondary">Status</Typography><StatusChip status={asset.status} /></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><Typography variant="caption" color="text.secondary">Purchase Date</Typography><Typography variant="body1">{asset.purchaseDate}</Typography></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><Typography variant="caption" color="text.secondary">Value</Typography><Typography variant="body1">{formatINR(asset.value)}</Typography></Grid>
          <Grid size={{ xs: 6, sm: 4 }}><Typography variant="caption" color="text.secondary">Location</Typography><Typography variant="body1">{asset.location}</Typography></Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Maintenance History</Typography>
        <Stack spacing={1.5}>
          {asset.maintenanceHistory.map((m, i) => (
            <Box key={i} sx={{ p: 1.5, borderLeft: 3, borderColor: "primary.main", bgcolor: "action.hover", borderRadius: 1 }}>
              <Typography variant="body2" fontWeight={600}>{m.title}</Typography>
              <Typography variant="caption" color="text.secondary">Completed on {m.date}</Typography>
            </Box>
          ))}
        </Stack>
      </Paper>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Asset</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Asset Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={editForm.status} onChange={(e: SelectChangeEvent) => setEditForm({ ...editForm, status: e.target.value as AssetStatus })}>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="retired">Retired</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Value" type="number" value={editForm.value} onChange={(e) => setEditForm({ ...editForm, value: Number(e.target.value) })} fullWidth />
          <TextField label="Location" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save Changes</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
