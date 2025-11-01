import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, useMediaQuery, useTheme, Drawer, CssBaseline } from '@mui/material';
import AppDrawer from './AppDrawer';
import Header from './Header';
import RecordDetailModal from './RecordDetailModal';
import { fadeInWithBlur } from '../themes/animations';

// A slightly wider drawer for a more modern, spacious feel.
const drawerWidth = 280;

const Layout = () => {
  const location = useLocation();
  // The header is now part of the main layout, not just the dashboard.
  const showSidebar = location.pathname !== '/login' && location.pathname !== '/register';
  const showHeader = showSidebar;
  const theme = useTheme();
  // Changed breakpoint to `lg` for a more tablet-friendly experience.
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const mainContentRef = useRef(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Use the new animation preset for page transitions.
  useEffect(() => {
    if (mainContentRef.current) {
      fadeInWithBlur(mainContentRef.current);
    }
    // Close mobile drawer on route change
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location.pathname, isMobile]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'var(--color-background-dark)' }}>
      <CssBaseline />
      {showSidebar && (
        <Box
          component="nav"
          sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0} }}
          aria-label="navigation drawer"
        >
          <Drawer
            variant={isMobile ? 'temporary' : 'permanent'}
            open={isMobile ? mobileOpen : true}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                // A deeper black for the drawer to create visual hierarchy.
                background: '#101010',
                // Using a subtle accent color for the border.
                borderRight: `1px solid rgba(113, 126, 187, 0.2)`,
                color: 'var(--color-text-light)',
              },
            }}
          >
            <AppDrawer />
          </Drawer>
        </Box>
      )}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          // Only apply padding if the header is shown, allowing login to be full-screen.
          p: showSidebar ? { xs: 1, sm: 2, md: 3 } : 0,
          width: showSidebar ? { lg: `calc(100% - ${drawerWidth}px)` } : '100%',
          overflowX: 'hidden',
        }}
      >
        {/* The header is now part of the main content flow for better positioning */}
        {showHeader && <Header handleDrawerToggle={handleDrawerToggle} />}
        <Box ref={mainContentRef} sx={{ opacity: 0 }}>
          <Outlet />
        </Box>
      </Box>
      <RecordDetailModal />
    </Box>
  );
};

export default Layout;
