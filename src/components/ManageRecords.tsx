import React, { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import swimStore from "../store/SwimStore";
import type { Swim } from "../store/SwimStore";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  TextField,
  IconButton,
  Box,
} from "@mui/material";
import ColumnSelector from "./ColumnSelector";
import SettingsIcon from "@mui/icons-material/Settings";
import anime from "animejs";

const columnDisplayNames: { [key: string]: string } = {
  id: "ID",
  swimmer: "Swimmer",
  distance: "Distance",
  stroke: "Stroke",
  duration: "Time Swum (s)",
  targetTime: "Target Time (s)",
  gear: "Gear",
  date: "Date & Time",
  poolLength: "Pool Length",
  averageStrokeRate: "Avg SR",
  heartRate: "HR",
  velocity: "Velocity (m/s)",
  sl: "SL (m)",
  si: "SI",
  ie: "IE Ratio",
};

const getColumnValue = (record: Swim, column: keyof Swim) => {
  if (column === "gear") {
    return Array.isArray(record.gear) ? record.gear.join(", ") : record.gear;
  }
  const value = record[column];
  return value ?? "";
};

const ManageRecords = observer(() => {
  const [editState, setEditState] = useState<Record<string, Partial<Swim>>>({});
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    anime({
      targets: pageRef.current,
      opacity: [0, 1],
      translateY: [50, 0],
      easing: "easeInOutQuad",
      duration: 800,
    });
  }, []);

  const handleColumnSelectorClick = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(event.currentTarget);
  const handleColumnSelectorClose = () => setAnchorEl(null);

  const handleEditChange = (id: string, field: keyof Swim, value: any) => {
    setEditState((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSave = async (id: string) => {
    const originalRecord = swimStore.swims.find((swim) => swim.id === id);
    const updatedData = editState[id];
    if (originalRecord && updatedData) {
      const updatedRecord = { ...originalRecord, ...updatedData };
      if (typeof updatedRecord.gear === "string") {
        updatedRecord.gear = (updatedRecord.gear as any)
          .split(",")
          .map((item: string) => item.trim());
      }
      await swimStore.updateSwim(id, updatedRecord);
      setEditState((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };

  const handleDelete = async (id: string) => await swimStore.deleteSwim(id);

  const handleStartEditing = (record: Swim) => {
    const gearAsString = Array.isArray(record.gear)
      ? record.gear.join(", ")
      : record.gear;
    setEditState((prev) => ({
      ...prev,
      [record.id]: { ...record, gear: gearAsString as any },
    }));
  };

  const isEditable = (key: any) =>
    !["id", "velocity", "sl", "si", "ie"].includes(key);

  const editFieldSx = {
    "& .MuiInputBase-input": { color: "var(--color-text-primary)" },
    "& .MuiInput-underline:before": {
      borderBottomColor: "var(--color-text-secondary)",
    },
    "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
      borderBottomColor: "var(--color-accent-orange)",
    },
  };

  return (
    <Box ref={pageRef} sx={{ opacity: 0 }}>
      <Paper
        sx={{
          p: 2,
          background: "var(--color-background-card-gradient)",
          color: "var(--color-text-primary)",
          borderRadius: "16px",
          border: "1px solid var(--color-border)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Manage Swim Records
          </Typography>
          <IconButton
            onClick={handleColumnSelectorClick}
            sx={{ color: "var(--color-text-secondary)" }}
          >
            <SettingsIcon />
          </IconButton>
          <ColumnSelector
            anchorEl={anchorEl}
            onClose={handleColumnSelectorClose}
          />
        </Box>

        <TableContainer sx={{ maxHeight: 600, overflowX: "auto" }}>
          <Table stickyHeader aria-label="manage swim records table">
            <TableHead>
              <TableRow>
                {swimStore.visibleColumns.map((column) => (
                  <TableCell
                    key={column}
                    sx={{
                      backgroundColor: "rgba(0,0,0,0.3)",
                      color: "var(--color-text-primary)",
                      fontWeight: "bold",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    {columnDisplayNames[column] || column}
                  </TableCell>
                ))}
                <TableCell
                  sx={{
                    backgroundColor: "rgba(0,0,0,0.3)",
                    color: "var(--color-text-primary)",
                    fontWeight: "bold",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {swimStore.filteredSwims.map((record) => (
                <TableRow
                  key={record.id}
                  sx={{
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
                  }}
                >
                  {swimStore.visibleColumns.map((column) => (
                    <TableCell
                      key={column}
                      sx={{
                        color: "var(--color-text-secondary)",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      {editState[record.id] && isEditable(column) ? (
                        <TextField
                          value={
                            editState[record.id]?.[column as keyof Swim] ?? ""
                          }
                          onChange={(e) =>
                            handleEditChange(
                              record.id,
                              column as keyof Swim,
                              e.target.value
                            )
                          }
                          variant="standard"
                          sx={editFieldSx}
                        />
                      ) : (
                        String(getColumnValue(record, column) ?? "")
                      )}
                    </TableCell>
                  ))}
                  <TableCell
                    sx={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    {editState[record.id] ? (
                      <Button
                        onClick={() => handleSave(record.id)}
                        variant="contained"
                        size="small"
                        sx={{
                          backgroundColor: "var(--color-accent-green)",
                          mr: 1,
                        }}
                      >
                        Save
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleStartEditing(record)}
                        variant="outlined"
                        size="small"
                        sx={{
                          borderColor: "var(--color-accent-yellow)",
                          color: "var(--color-accent-yellow)",
                          mr: 1,
                        }}
                      >
                        Edit
                      </Button>
                    )}
                    <Button
                      onClick={() => handleDelete(record.id)}
                      variant="contained"
                      size="small"
                      sx={{ backgroundColor: "var(--color-accent-red)" }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
});

export default ManageRecords;
