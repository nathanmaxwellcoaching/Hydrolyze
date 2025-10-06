import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Box, Typography, IconButton, Tooltip, useMediaQuery, useTheme, Avatar } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import MenuIcon from '@mui/icons-material/Menu';
import { useLocation } from 'react-router-dom';
import { useState } from 'react';

import FilterCard from './FilterCard';
import ColumnManager from './ColumnManager';

const Header = observer(({ handleDrawerToggle }: { handleDrawerToggle: () => void }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const theme = useTheme();
  // Using the same breakpoint as Layout for consistency
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  const handleColumnManagerClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleColumnManagerClose = () => setAnchorEl(null);

  // A cleaner, more modern style for icon buttons
  const iconButtonStyles = {
    color: 'var(--color-text-secondary)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'var(--color-background-card)',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    '&:hover': {
      color: 'var(--color-accent-green)',
      backgroundColor: '#2c2c2c',
      transform: 'scale(1.1)',
      boxShadow: '0 0 15px rgba(113, 235, 75, 0.4)',
    },
  };

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3, 
        p: 1.5, 
        // The header is now a clean bar, not a card
        background: 'transparent', 
        borderRadius: '16px',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Hamburger menu icon, only visible on mobile */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ ...iconButtonStyles, mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'var(--color-text-light)' }}>
              {swimStore.currentUser?.name ? `Welcome, ${swimStore.currentUser.name}` : 'Dashboard'}
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'var(--color-text-secondary)' }}>
              Here's your performance overview.
            </Typography>
          </Box>
        </Box>
        
        {/* Right-side controls and user avatar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {!isMobile && (
            <>
              <Tooltip title="Filter Swims">
                <IconButton sx={iconButtonStyles} onClick={() => setShowFilters(!showFilters)}><FilterListIcon /></IconButton>
              </Tooltip>
              <Tooltip title="Manage Columns">
                <IconButton sx={iconButtonStyles} onClick={handleColumnManagerClick}><ViewColumnIcon /></IconButton>
              </Tooltip>
              <Tooltip title={swimStore.showTrendline ? "Hide Trendline" : "Show Trendline"}>
                <IconButton sx={iconButtonStyles} onClick={() => swimStore.toggleTrendline(!swimStore.showTrendline)}><ShowChartIcon /></IconButton>
              </Tooltip>
            </>
          )}
          {/* Visual-only user avatar section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 2, borderLeft: '1px solid rgba(255, 255, 255, 0.1)', pl: 2 }}>
            <Avatar sx={{ bgcolor: 'var(--color-accent-blue-purple)', width: 48, height: 48 }}>
              {swimStore.currentUser?.name.charAt(0)}
            </Avatar>
            {!isMobile && (
              <Box>
                <Typography sx={{ fontWeight: 'bold' }}>{swimStore.currentUser?.name}</Typography>
                <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
                  {swimStore.currentUser?.isAdmin ? 'Admin' : 'Swimmer'}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* These components are now controlled by the header but appear below it */}
      {showFilters && <FilterCard />} 
      <ColumnManager anchorEl={anchorEl} onClose={handleColumnManagerClose} />
    </Box>
  );
});

export default Header;
