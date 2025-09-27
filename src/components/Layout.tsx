import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, useMediaQuery, useTheme, Drawer, CssBaseline } from '@mui/material';
import AppDrawer from './AppDrawer';
import Header from './Header';

const drawerWidth = 240;

const Layout = () => {
  const location = useLocation();
  const showHeader = location.pathname === '/';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, backgroundColor: '#1A1A1A', color: '#FFFFFF', borderRight: '1px solid #333' },
            }}
          >
            <AppDrawer />
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, backgroundColor: '#1A1A1A', color: '#FFFFFF', borderRight: '1px solid #333' },
            }}
            open
          >
            <AppDrawer />
          </Drawer>
        )}
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { md: `calc(100% - ${drawerWidth}px)` } }}
      >
        {showHeader && <Header handleDrawerToggle={handleDrawerToggle} />}
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
