import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, IconButton } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ColumnSelector from './ColumnSelector';
import type { Swim } from '../store/SwimStore';

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

const SwimRecordsTable = observer(() => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleColumnSelectorClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleColumnSelectorClose = () => {
    setAnchorEl(null);
  };

  return (
    <Paper sx={{ p: 2, backgroundColor: '#1A1A1A', color: '#FFFFFF' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#FFFFFF' }}>Recent Swims</Typography>
        <IconButton onClick={handleColumnSelectorClick} color="inherit">
          <SettingsIcon />
        </IconButton>
        <ColumnSelector anchorEl={anchorEl} onClose={handleColumnSelectorClose} />
      </div>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="swim records table">
          <TableHead>
            <TableRow>
              {swimStore.visibleColumns.map((column) => (
                <TableCell key={column} sx={{ backgroundColor: '#2C2C2C', color: '#FFFFFF' }}>
                  {columnDisplayNames[column] || column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {swimStore.filteredSwims.map((record) => (
              <TableRow key={record.id}>
                {swimStore.visibleColumns.map((column) => (
                  <TableCell key={column} sx={{ color: '#B0B0B0' }}>
                    {String(getColumnValue(record, column) ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
});

export default SwimRecordsTable;
