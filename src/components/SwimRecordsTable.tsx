import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, IconButton, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ColumnSelector from './ColumnSelector';
import type { Swim } from '../store/SwimStore';
import anime from 'animejs';

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
  averageStrokeRate: 'Avg SR',
  heartRate: 'HR',
  strokeLength: 'SL (m)',
  swimIndex: 'SI',
  ieRatio: 'IE Ratio',
};

const getColumnValue = (record: Swim, column: (keyof Swim | 'strokeLength' | 'swimIndex' | 'ieRatio')) => {
  // ... (existing function, no changes needed)
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
  const tableBodyRef = useRef(null);

  useEffect(() => {
    if (tableBodyRef.current) {
      anime({
        targets: (tableBodyRef.current as HTMLElement).children,
        opacity: [0, 1],
        translateY: [20, 0],
        delay: anime.stagger(50),
        easing: 'easeOutQuad',
      });
    }
  }, [swimStore.filteredSwims]);

  const handleColumnSelectorClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleColumnSelectorClose = () => {
    setAnchorEl(null);
  };

  const handleSortChange = (event: any) => {
    swimStore.setSortOrder(event.target.value);
  };

  const formInputStyles = {
    '& .MuiInputBase-root': {
      backgroundColor: '#191919',
      color: '#FFFFFF',
      borderRadius: '8px',
    },
    '& .MuiInputLabel-root': { color: '#a9a9a9' },
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: '#444' },
      '&:hover fieldset': { borderColor: 'var(--color-accent-orange)' },
    },
    '& .MuiSvgIcon-root': { color: '#a9a9a9' },
  };

  return (
    <Paper sx={{ 
      p: 2, 
      background: 'var(--color-background-card-gradient)', 
      color: 'var(--color-text-primary)',
      borderRadius: '16px',
      border: '1px solid var(--color-border)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">Recent Swims</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControl sx={{ m: 1, minWidth: 120, ...formInputStyles }} size="small">
            <InputLabel id="sort-select-label">Sort By</InputLabel>
            <Select
              labelId="sort-select-label"
              id="sort-select"
              value={swimStore.sortOrder}
              label="Sort By"
              onChange={handleSortChange}
            >
              <MenuItem value={"date"}>Date & Time</MenuItem>
              <MenuItem value={"duration"}>Time Swum</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={handleColumnSelectorClick} sx={{ color: 'var(--color-text-secondary)' }}>
            <SettingsIcon />
          </IconButton>
        </Box>
        <ColumnSelector anchorEl={anchorEl} onClose={handleColumnSelectorClose} />
      </Box>
      <TableContainer sx={{ maxHeight: 440, overflowX: 'auto' }}>
        <Table stickyHeader aria-label="swim records table">
          <TableHead>
            <TableRow>
              {swimStore.visibleColumns.map((column) => (
                <TableCell key={column} sx={{ 
                  backgroundColor: 'rgba(0,0,0,0.3)', 
                  color: 'var(--color-text-primary)',
                  fontWeight: 'bold',
                  borderBottom: '1px solid var(--color-border)'
                }}>
                  {columnDisplayNames[column] || column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody ref={tableBodyRef}>
            {swimStore.filteredSwims.map((record) => (
              <TableRow key={record.id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}>
                {swimStore.visibleColumns.map((column) => (
                  <TableCell key={column} sx={{ color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}>
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