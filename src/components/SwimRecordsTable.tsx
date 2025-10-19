import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, IconButton, Select, MenuItem, FormControl, InputLabel, Box, useMediaQuery, useTheme, Stack } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ColumnSelector from './ColumnSelector';
import type { Swim } from '../store/SwimStore';
import anime from 'animejs';
import { fadeInWithBlur } from '../themes/animations';

const columnDisplayNames: { [key in keyof Swim]?: string } = {
  id: 'ID',
  date: 'Date & Time',
  swimmerEmail: 'Swimmer',
  distance: 'Distance',
  stroke: 'Stroke',
  duration: 'Time Swum (s)',
  targetTime: 'Target Time (s)',
  gear: 'Gear',
  poolLength: 'Pool Length',
  averageStrokeRate: 'Avg SR',
  heartRate: 'HR',
  paceDistance: 'Pace Distance',
  velocity: 'Velocity (m/s)',
  sl: 'SL (m)',
  si: 'SI',
  ie: 'IE Ratio',
};

// Updated to read metrics directly from the record.
const getColumnValue = (record: Swim, column: keyof Swim) => {
  const value = record[column];

  if (column === 'gear') {
    return Array.isArray(value) ? value.join(', ') : value;
  }

  // Ensure computed metrics are displayed with consistent precision.
  if (typeof value === 'number' && ['sl', 'si', 'ie', 'velocity'].includes(column)) {
      return value.toFixed(2);
  }
  
  return value;
};

const SwimRecordsTable = observer(() => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const tableBodyRef = useRef(null);

  useEffect(() => {
    if (tableBodyRef.current) {
      fadeInWithBlur((tableBodyRef.current as HTMLElement).children, anime.stagger(75));
    }
  }, [swimStore.filteredSwims]);

  const handleColumnSelectorClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleColumnSelectorClose = () => setAnchorEl(null);
  const handleSortChange = (event: any) => swimStore.setSortOrder(event.target.value);

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

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
    return (
      <Paper sx={{
        p: { xs: 2, sm: 3 },
        background: 'var(--color-background-card)',
        color: 'var(--color-text-light)',
        borderRadius: 4, // Standardized to theme spacing unit
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
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
  
        {isMobile ? (
          <Box ref={tableBodyRef}> {/* Using Box as a ref container for animations */}
            <Stack spacing={2}>
              {swimStore.filteredSwims.map((record) => (
                <Paper
                  key={record.id}
                  elevation={2}
                  sx={{
                    p: 2,
                    background: 'var(--color-background-card-light)',
                    borderRadius: 3,
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'rgba(113, 126, 187, 0.1)' },
                  }}
                  onClick={() => swimStore.openRecordDetailModal(record)}
                  className="dashboard-item" // For existing animations
                >
                  <Typography variant="subtitle1" fontWeight="bold" color="primary.main">{new Date(record.date).toLocaleDateString()} - {record.distance}m {record.stroke}</Typography>
                  <Typography variant="body2" color="text.secondary">Time: {record.duration}s</Typography>
                  {record.targetTime && <Typography variant="body2" color="text.secondary">Target: {record.targetTime}s</Typography>}
  

                </Paper>
              ))}
            </Stack>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 440, overflowX: 'auto' }}>
            <Table stickyHeader aria-label="swim records table">
              <TableHead>
                <TableRow>
                  {swimStore.visibleColumns.map((column) => (
                    <TableCell key={column} sx={{
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
                    onClick={() => swimStore.openRecordDetailModal(record)}
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      transition: 'background-color 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: 'rgba(113, 126, 187, 0.2)',
                        cursor: 'pointer'
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
        )}
      </Paper>
    );});

export default SwimRecordsTable;