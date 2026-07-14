import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl, Stack, IconButton, Typography, Snackbar,
  type SelectChangeEvent,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import StatusChip from "@/components/StatusChip";
import { getAssets, addAsset, updateAsset } from "@/api/assets";
import { campusLocations } from "@/demo-data/campus/assets";
import type { Asset, AssetCondition, AssetStatus } from "@/types";

const assetTypes = ["Projector", "Computer", "Printer", "Furniture", "Lab Equipment", "Whiteboard", "Router", "Air Conditioner", "Photocopier", "Scanner"];

const conditionColor: Record<AssetCondition, string> = {
  excellent: "#0ca30c", good: "#0ca30c", fair: "#fab219", poor: "#d03b3b",
};
const conditionLabel: Record<AssetCondition, string> = {
  excellent: "Excellent", good: "Good", fair: "Fair", poor: "Poor",
};

const emptyAddForm = { id: "", name: "", type: assetTypes[0], value: 0, purchaseDate: "", location: "" };
const emptyEditForm = { name: "", status: "active" as AssetStatus, value: 0, location: "" };

export default function Assets() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Asset[]>([]);
  const [locationFilter, setLocationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = () => getAssets().then(setRows);
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((a) =>
    (locationFilter === "all" || a.location === locationFilter) &&
    (typeFilter === "all" || a.type === typeFilter) &&
    (search === "" || a.id.toLowerCase().includes(search.toLowerCase()) || a.type.toLowerCase().includes(search.toLowerCase()) || a.location.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => { setAddForm(emptyAddForm); setAddOpen(true); };
  const openEdit = (a: Asset) => { setEditId(a.id); setEditForm({ name: a.name, status: a.status, value: a.value, location: a.location }); };

  const handleAdd = () => {
    addAsset({
      id: addForm.id, name: addForm.name, type: addForm.type, location: addForm.location,
      condition: "good", status: "active", lastMaintenance: addForm.purchaseDate,
      value: addForm.value, purchaseDate: addForm.purchaseDate, maintenanceHistory: [],
    }).then(load);
    setAddOpen(false);
  };

  const handleEditSave = () => {
    if (editId) updateAsset(editId, editForm).then(load);
    setEditId(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Asset Management"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => setSnackbar("Exporting Asset Report... Download will start shortly.")}>Export Report</Button>
            <Button variant="contained" onClick={openAdd}>Add Asset</Button>
          </Stack>
        }
      />
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Location</InputLabel>
          <Select label="Location" value={locationFilter} onChange={(e: SelectChangeEvent) => setLocationFilter(e.target.value)}>
            <MenuItem value="all">All Locations</MenuItem>
            {campusLocations.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Type</InputLabel>
          <Select label="Type" value={typeFilter} onChange={(e: SelectChangeEvent) => setTypeFilter(e.target.value)}>
            <MenuItem value="all">All Types</MenuItem>
            {assetTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" placeholder="Search by ID, Type, or Location..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 260 }} />
      </Stack>

      <DataTable<Asset>
        pagination
        columns={[
          { key: "id", label: "Asset ID" },
          { key: "type", label: "Type" },
          { key: "location", label: "Location" },
          {
            key: "condition", label: "Condition",
            render: (row) => (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: conditionColor[row.condition] }} />
                <Typography variant="body2">{conditionLabel[row.condition]}</Typography>
              </Stack>
            ),
          },
          { key: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
          { key: "lastMaintenance", label: "Last Maintenance" },
          {
            key: "actions", label: "Actions",
            render: (row) => (
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/admin/assets/${row.id}`); }}><VisibilityIcon fontSize="small" /></IconButton>
              </Stack>
            ),
          },
        ]}
        rows={filtered}
        emptyTitle="No assets found"
      />

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Asset</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Asset Name" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} fullWidth />
          <TextField label="Asset ID" placeholder="AST-2024-001" value={addForm.id} onChange={(e) => setAddForm({ ...addForm, id: e.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select label="Category" value={addForm.type} onChange={(e: SelectChangeEvent) => setAddForm({ ...addForm, type: e.target.value })}>
              {assetTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Value" type="number" placeholder="45000" value={addForm.value} onChange={(e) => setAddForm({ ...addForm, value: Number(e.target.value) })} fullWidth />
          <TextField label="Purchase Date" type="date" value={addForm.purchaseDate} onChange={(e) => setAddForm({ ...addForm, purchaseDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="Location" placeholder="Lab 301" value={addForm.location} onChange={(e) => setAddForm({ ...addForm, location: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}>Add Asset</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!editId} onClose={() => setEditId(null)} maxWidth="sm" fullWidth>
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
          <Button onClick={() => setEditId(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}>Save Changes</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar(null)} message={snackbar} />
    </>
  );
}
