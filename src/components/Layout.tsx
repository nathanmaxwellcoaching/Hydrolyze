import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, useMediaQuery, useTheme, Drawer, CssBaseline } from '@mui/material';
import AppDrawer from './AppDrawer';
import Header from './Header';
import anime from 'animejs';

const drawerWidth = 260; // Increased drawer width for better spacing

const Layout = () => {
  const location = useLocation();
  const showHeader = location.pathname === '/';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const mainContentRef = useRef(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Animate page content on route change
  useEffect(() => {
    if (mainContentRef.current) {
      anime({
        targets: mainContentRef.current,
        opacity: [0, 1],
        translateY: [20, 0],
        easing: 'easeInOutQuad',
        duration: 600,
      });
    }
  }, [location.pathname]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'var(--color-background-main)' }}>
      <CssBaseline />
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
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
              background: 'var(--color-background-card)', // Use card background for drawer
              borderRight: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            },
          }}
        >
          <AppDrawer />
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, md: 3 }, // Responsive padding
          width: { md: `calc(100% - ${drawerWidth}px)` },
          overflow: 'hidden', // Prevents scrollbars from interfering with layout
        }}
      >
        {showHeader && <Header handleDrawerToggle={handleDrawerToggle} />}
        <Box ref={mainContentRef} sx={{ opacity: 0 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;