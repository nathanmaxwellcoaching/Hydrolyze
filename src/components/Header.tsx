import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Box, Typography, TextField, IconButton, Tooltip } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { useState } from 'react';
import FilterCard from './FilterCard';
import ColumnManager from './ColumnManager';

const Header = observer(() => {
  const [showFilters, setShowFilters] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleColumnManagerClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleColumnManagerClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 2, py: 1, backgroundColor: '#1A1A1A', borderRadius: '8px' }}>
        <Box>
          <Typography variant="h5" sx={{ color: '#FFFFFF' }}>Dashboard</Typography>
          <Typography variant="subtitle2" sx={{ color: '#B0B0B0' }}>Overview of your swimming performance.</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            id="start-date"
            label="Start Date"
            type="date"
            value={swimStore.activeFilters.startDate || ''}
            onChange={(e) => swimStore.applyFilters({ startDate: e.target.value })}
            sx={{
              width: 150,
              '& .MuiInputLabel-root': { color: '#B0B0B0' },
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: '#2C2C2C',
                color: '#FFFFFF',
                '& fieldset': { borderColor: '#444' },
                '&:hover fieldset': { borderColor: '#666' },
              }
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            id="end-date"
            label="End Date"
            type="date"
            value={swimStore.activeFilters.endDate || ''}
            onChange={(e) => swimStore.applyFilters({ endDate: e.target.value })}
            sx={{
              width: 150,
              '& .MuiInputLabel-root': { color: '#B0B0B0' },
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: '#2C2C2C',
                color: '#FFFFFF',
                '& fieldset': { borderColor: '#444' },
                '&:hover fieldset': { borderColor: '#666' },
              }
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <Tooltip title="Filter">
            <IconButton sx={{ color: '#B0B0B0' }} onClick={() => setShowFilters(!showFilters)}><FilterListIcon /></IconButton>
          </Tooltip>
          <Tooltip title="Manage Columns">
            <IconButton sx={{ color: '#B0B0B0' }} onClick={handleColumnManagerClick}><ViewColumnIcon /></IconButton>
          </Tooltip>
          <Tooltip title={swimStore.showTrendline ? "Hide Trendline" : "Show Trendline"}>
            <IconButton sx={{ color: '#B0B0B0' }} onClick={() => swimStore.toggleTrendline(!swimStore.showTrendline)}><ShowChartIcon /></IconButton>
          </Tooltip>
        </Box>
      </Box>
      {showFilters && <FilterCard />}
      <ColumnManager anchorEl={anchorEl} onClose={handleColumnManagerClose} />
    </Box>
  );
});

export default Header;