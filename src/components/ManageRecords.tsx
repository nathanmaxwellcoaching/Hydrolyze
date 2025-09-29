import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import type { Swim } from '../store/SwimStore';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Button, TextField, IconButton } from '@mui/material';
import ColumnSelector from './ColumnSelector';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardFilter from './DashboardFilter';

const columnDisplayNames: { [key: string]: string } = {
  id: 'ID',
  swimmer: 'Swimmer',
  distance: 'Distance',
  stroke: 'Stroke',
  duration: 'Time Swum (s)',
  targetTime: 'Target Time (s)',
  gear: 'Gear',
  date: 'Date & Time',
  poolLength: 'Pool Length',
  averageStrokeRate: 'Avg Stroke Rate',
  heartRate: 'Heart Rate',
  strokeLength: 'Stroke Length (SL)',
  swimIndex: 'Swim Index (SI)',
  ieRatio: 'IE Ratio',
};

const getColumnValue = (record: Swim, column: (keyof Swim | 'strokeLength' | 'swimIndex' | 'ieRatio')) => {
  switch (column) {
    case 'strokeLength':
      return swimStore.calculateStrokeLength(record);
    case 'swimIndex':
      return swimStore.calculateSwimIndex(record);
    case 'ieRatio':
      return swimStore.calculateIERatio(record);
    case 'gear':
      return Array.isArray(record.gear) ? record.gear.join(', ') : record.gear;
    default:
      return record[column as keyof Swim];
  }
};

const ManageRecords = observer(() => {
  const [editState, setEditState] = useState<Record<string, Partial<Swim>>>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleColumnSelectorClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleColumnSelectorClose = () => {
    setAnchorEl(null);
  };

  const handleEditChange = (id: string, field: keyof Swim, value: any) => {
    setEditState(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSave = async (id: string) => {
    const originalRecord = swimStore.swims.find(swim => swim.id === id);
    const updatedData = editState[id];
    if (originalRecord && updatedData) {
      const updatedRecord = { ...originalRecord, ...updatedData };
  
      // Fix for gear handling - ensure gear is properly typed
      if (typeof updatedRecord.gear === 'string') {
        updatedRecord.gear = (updatedRecord.gear as any).split(',').map((item: string) => item.trim());
      }
  
      await swimStore.updateSwim(id, updatedRecord);
      setEditState(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };

  const handleDelete = async (id: string) => {
    await swimStore.deleteSwim(id);
  };

  const handleStartEditing = (record: Swim) => {
    const gearAsString = Array.isArray(record.gear) ? record.gear.join(', ') : record.gear;
    setEditState(prev => ({
      ...prev,
      [record.id]: { ...record, gear: gearAsString as any },
    }));
  };

  const isEditable = (key: any) => !['id', 'strokeLength', 'swimIndex', 'ieRatio'].includes(key);

  return (
    <Paper sx={{ p: 2, backgroundColor: '#1A1A1A', color: '#FFFFFF' }}>
      <DashboardFilter />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#FFFFFF' }}>Manage Swim Records</Typography>
        <IconButton onClick={handleColumnSelectorClick} color="inherit">
          <SettingsIcon />
        </IconButton>
        <ColumnSelector anchorEl={anchorEl} onClose={handleColumnSelectorClose} />
      </div>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader aria-label="manage swim records table">
          <TableHead>
            <TableRow>
              {swimStore.visibleColumns.map((column) => (
                <TableCell key={column} sx={{ backgroundColor: '#2C2C2C', color: '#FFFFFF' }}>
                  {columnDisplayNames[column] || column}
                </TableCell>
              ))}
              <TableCell sx={{ backgroundColor: '#2C2C2C', color: '#FFFFFF' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {swimStore.filteredSwims.map((record) => (
              <TableRow key={record.id}>
                {swimStore.visibleColumns.map((column) => (
                  <TableCell key={column} sx={{ color: '#B0B0B0' }}>
                    {editState[record.id] && isEditable(column) ? (
                      <TextField
                        value={editState[record.id]?.[column as keyof Swim] ?? ''}
                        onChange={(e) => handleEditChange(record.id, column as keyof Swim, e.target.value)}
                        sx={{
                          '& .MuiInputBase-input': { color: '#FFFFFF' },
                          '& .MuiInput-underline:before': { borderBottomColor: '#B0B0B0' },
                        }}
                        variant="standard"
                      />
                    ) : (
                      String(getColumnValue(record, column) ?? '')
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  {editState[record.id] ? (
                    <Button onClick={() => handleSave(record.id)} variant="contained" color="primary" size="small">Save</Button>
                  ) : (
                    <Button onClick={() => handleStartEditing(record)} variant="outlined" size="small">Edit</Button>
                  )}
                  <Button onClick={() => handleDelete(record.id)} variant="contained" color="secondary" size="small" sx={{ ml: 1 }}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
});

export default ManageRecords;