
import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, IconButton, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ColumnSelector from './ColumnSelector';
import type { Swim } from '../store/SwimStore';
import anime from 'animejs';

// Column display names (no changes needed)
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

// Getter for column values (logic unchanged)
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
  const tableBodyRef = useRef(null);

  // Staggered animation for table rows on data change.
  useEffect(() => {
    if (tableBodyRef.current) {
      anime({
        targets: (tableBodyRef.current as HTMLElement).children,
        opacity: [0, 1],
        translateY: [15, 0],
        delay: anime.stagger(75), // Slightly faster stagger
        easing: 'easeOutExpo', // Smoother easing
      });
    }
  }, [swimStore.filteredSwims]);

  const handleColumnSelectorClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleColumnSelectorClose = () => setAnchorEl(null);
  const handleSortChange = (event: any) => swimStore.setSortOrder(event.target.value);

  // Reusable styles for form controls, consistent with the new design.
  const formControlStyles = {
    '& .MuiInputBase-root': {
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      color: 'var(--color-text-light)',
      borderRadius: '8px',
    },
    '& .MuiInputLabel-root': { color: 'var(--color-text-secondary)' },
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
      '&:hover fieldset': { borderColor: 'var(--color-accent-light-blue)' },
      '&.Mui-focused fieldset': { borderColor: 'var(--color-accent-green)' },
    },
    '& .MuiSvgIcon-root': { color: 'var(--color-text-secondary)' },
  };

  return (
    <Paper sx={{ 
      p: { xs: 2, sm: 3 }, // Responsive padding
      background: 'var(--color-background-card)', 
      color: 'var(--color-text-light)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    }} >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ background: 'var(--gradient-calm)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Recent Swims
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl sx={{ minWidth: 140, ...formControlStyles }} size="small">
            <InputLabel id="sort-select-label">Sort By</InputLabel>
            <Select labelId="sort-select-label" value={swimStore.sortOrder} label="Sort By" onChange={handleSortChange}>
              <MenuItem value={"date"}>Date & Time</MenuItem>
              <MenuItem value={"duration"}>Time Swum</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={handleColumnSelectorClick} sx={{ color: 'var(--color-text-secondary)', '&:hover': { color: 'var(--color-accent-green)' } }}>
            <SettingsIcon />
          </IconButton>
        </Box>
        <ColumnSelector anchorEl={anchorEl} onClose={handleColumnSelectorClose} />
      </Box>
      {/* TableContainer enables horizontal scrolling on small screens */}
      <TableContainer sx={{ maxHeight: 440, overflowX: 'auto' }}>
        <Table stickyHeader aria-label="swim records table">
          <TableHead>
            <TableRow>
              {swimStore.visibleColumns.map((column) => (
                <TableCell key={column} sx={{ 
                  // Darker, distinct header background
                  backgroundColor: '#101010', 
                  color: 'var(--color-text-light)',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  borderBottom: '2px solid var(--color-accent-blue-purple)',
                  py: 1.5,
                }} >
                  {columnDisplayNames[column] || column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody ref={tableBodyRef}>
            {swimStore.filteredSwims.map((record) => (
              <TableRow 
                key={record.id} 
                sx={{ 
                  '&:last-child td, &:last-child th': { border: 0 }, 
                  transition: 'background-color 0.2s ease-in-out',
                  '&:hover': { 
                    // Vibrant hover effect for better user feedback
                    backgroundColor: 'rgba(113, 126, 187, 0.2)',
                  }
                }}
              >
                {swimStore.visibleColumns.map((column) => (
                  <TableCell key={column} sx={{ color: 'var(--color-text-secondary)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', py: 1.5 }}>
                    {String(getColumnValue(record, column) ?? '-')}
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
