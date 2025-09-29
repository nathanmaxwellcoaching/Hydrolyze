import { NavLink } from 'react-router-dom';
import { Drawer, Toolbar, List, ListItem, ListItemButton, ListItemText, Box, Typography, Avatar, Button, SvgIcon } from '@mui/material';
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import StorageIcon from '@mui/icons-material/Storage';

import StarIcon from '@mui/icons-material/Star';

const drawerWidth = 240;

interface NavItem {
  text: string;
  path: string;
  icon: React.ReactElement;
}

const navItems: NavItem[] = [
  { text: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { text: 'Log Swim', path: 'log', icon: <AddCircleOutlineIcon /> },
  { text: 'Lap Metrics', path: 'lap-metrics', icon: <AssessmentIcon /> },
  { text: 'Goal Times', path: 'goal-times', icon: <StarIcon /> },
];

const Sidebar = () => {
  const handleLogout = () => {
    swimStore.logout();
  };

  const adminNavItems: NavItem[] = [
    { text: 'Manage Records', path: 'manage-records', icon: <StorageIcon /> },
    { text: 'Manage Users', path: 'manage-users', icon: <StorageIcon /> },
  ];

  const userNavItems = navItems.slice();
  if (swimStore.currentUser && swimStore.currentUser.isAdmin) {
    userNavItems.push(...adminNavItems);
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: drawerWidth, 
          boxSizing: 'border-box', 
          backgroundColor: '#1A1A1A', 
          borderRight: '1px solid #333',
          color: '#FFFFFF'
        },
      }}
    >
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', p: 2, borderBottom: '1px solid #333' }}>
        <Avatar sx={{ width: 64, height: 64, mb: 1, border: '2px solid #444' }} />
        <Typography variant="h6">{swimStore.currentUser?.name}</Typography>
        <Typography variant="body2" sx={{ color: '#B0B0B0' }}>{swimStore.currentUser?.email}</Typography>
      </Toolbar>
      <Box sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: 'calc(100% - 160px)' }}>
        <List>
          {userNavItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton component={NavLink} to={item.path} sx={{ 
                color: '#B0B0B0',
                '&.active': {
                  color: '#FFFFFF',
                  backgroundColor: '#333'
                },
                '&:hover': {
                  backgroundColor: '#2C2C2C'
                }
              }}>
                <SvgIcon sx={{ mr: 2 }}>{item.icon}</SvgIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ marginTop: 'auto', p: 2 }}>
          <Button variant="contained" color="secondary" onClick={handleLogout} fullWidth>Logout</Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default observer(Sidebar);