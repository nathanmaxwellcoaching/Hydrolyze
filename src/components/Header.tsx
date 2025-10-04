import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Box, Typography, TextField, IconButton, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import MenuIcon from '@mui/icons-material/Menu';
import { useState, useEffect, useRef } from 'react';
import FilterCard from './FilterCard';
import ColumnManager from './ColumnManager';
import anime from 'animejs';

const Header = observer(({ handleDrawerToggle }: { handleDrawerToggle: () => void }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const headerRef = useRef(null);

  useEffect(() => {
    anime({
      targets: headerRef.current,
      opacity: [0, 1],
      translateY: [-50, 0],
      easing: 'easeInOutQuad',
      duration: 800,
    });
  }, []);

  const handleColumnManagerClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleColumnManagerClose = () => {
    setAnchorEl(null);
  };

  const formInputStyles = {
    width: 150,
    '& .MuiInputBase-root': {
      backgroundColor: '#191919',
      color: '#FFFFFF',
      borderRadius: '8px',
      transition: 'box-shadow 0.3s ease-in-out',
      height: '48px',
    },
    '& .MuiInputLabel-root': {
      color: '#a9a9a9',
      '&.Mui-focused': {
        color: '#FFFFFF',
      },
    },
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: '#444',
      },
      '&:hover fieldset': {
        borderColor: 'var(--color-accent-orange)',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'var(--color-accent-orange)',
        borderWidth: '2px',
      },
    },
  };

  const iconButtonStyles = {
    color: 'var(--color-text-secondary)',
    backgroundColor: '#191919',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    '&:hover': {
      color: 'var(--color-text-primary)',
      backgroundColor: '#2c2c2c',
      transform: 'scale(1.1)',
      boxShadow: '0 0 15px rgba(252, 76, 2, 0.5)',
    },
  };

  return (
    <Box ref={headerRef} sx={{ opacity: 0 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3, 
        p: 2, 
        background: 'linear-gradient(135deg, #121212, #0A1A37)', 
        borderRadius: '16px',
        border: '1px solid var(--color-border)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ color: 'var(--color-text-primary)' }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>Dashboard</Typography>
            <Typography variant="subtitle2" sx={{ color: 'var(--color-text-secondary)' }}>Overview of your swimming performance.</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TextField
            id="start-date"
            label="Start Date"
            type="date"
            value={swimStore.activeFilters.startDate || ''}
            onChange={(e) => swimStore.applyFilters({ startDate: e.target.value })}
            sx={formInputStyles}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            id="end-date"
            label="End Date"
            type="date"
            value={swimStore.activeFilters.endDate || ''}
            onChange={(e) => swimStore.applyFilters({ endDate: e.target.value })}
            sx={formInputStyles}
            InputLabelProps={{ shrink: true }}
          />
          <Tooltip title="Filter">
            <IconButton sx={iconButtonStyles} onClick={() => setShowFilters(!showFilters)}><FilterListIcon /></IconButton>
          </Tooltip>
          <Tooltip title="Manage Columns">
            <IconButton sx={iconButtonStyles} onClick={handleColumnManagerClick}><ViewColumnIcon /></IconButton>
          </Tooltip>
          <Tooltip title={swimStore.showTrendline ? "Hide Trendline" : "Show Trendline"}>
            <IconButton sx={iconButtonStyles} onClick={() => swimStore.toggleTrendline(!swimStore.showTrendline)}><ShowChartIcon /></IconButton>
          </Tooltip>
        </Box>
      </Box>
      {showFilters && <FilterCard />} 
      <ColumnManager anchorEl={anchorEl} onClose={handleColumnManagerClose} />
    </Box>
  );
});

export default Header;