
import { NavLink } from 'react-router-dom';
import { Toolbar, List, ListItem, ListItemButton, ListItemText, Box, Typography, Avatar, Button, SvgIcon } from '@mui/material';
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import StorageIcon from '@mui/icons-material/Storage';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import LogoutIcon from '@mui/icons-material/Logout';
import { useEffect } from 'react';
import anime from 'animejs';

const AppDrawer = observer(() => {
  const handleLogout = () => {
    swimStore.logout();
  };

  const navItems = [
    { text: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { text: 'Log Swim', path: '/log', icon: <AddCircleOutlineIcon /> },
    { text: 'Lap Metrics', path: '/lap-metrics', icon: <AssessmentIcon /> },
    { text: 'Goal Times', path: '/goal-times', icon: <StarIcon /> },
  ];

  if (swimStore.currentUser && swimStore.currentUser.isAdmin) {
    navItems.push({ text: 'Manage Records', path: '/manage-records', icon: <StorageIcon /> });
    navItems.push({ text: 'Manage Users', path: '/manage-users', icon: <PeopleIcon /> });
  }

  useEffect(() => {
    anime({
      targets: '.nav-item',
      translateX: [-250, 0],
      delay: anime.stagger(100, { start: 200 }),
      easing: 'easeInOutQuad',
    });
  }, []);

  return (
    <>
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        flexDirection: 'column', 
        p: 2, 
        background: 'linear-gradient(135deg, #121212, #0A1A37)', 
        borderBottom: '1px solid var(--color-border)' 
      }}>
        <Avatar sx={{ 
          width: 80, 
          height: 80, 
          mb: 1.5, 
          border: '3px solid transparent',
          background: 'linear-gradient(#121212, #121212) padding-box, linear-gradient(135deg, var(--color-accent-orange), var(--color-accent-yellow)) border-box'
        }} />
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{swimStore.currentUser?.name}</Typography>
        <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>{swimStore.currentUser?.email}</Typography>
      </Toolbar>
      <Box sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <List sx={{ p: 1 }}>
          {navItems.map((item) => (
            <ListItem key={item.text} disablePadding className="nav-item">
              <ListItemButton 
                component={NavLink} 
                to={item.path} 
                sx={{ 
                  color: 'var(--color-text-secondary)',
                  borderRadius: '8px',
                  m: 0.5,
                  '& .MuiSvgIcon-root': {
                    color: 'var(--color-text-secondary)',
                    transition: 'color 0.3s',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(252, 76, 2, 0.1)',
                    color: 'var(--color-text-primary)',
                    '& .MuiSvgIcon-root': {
                      color: 'var(--color-accent-orange)',
                    },
                  },
                  '&.active': {
                    backgroundColor: 'var(--color-accent-orange)',
                    color: 'var(--color-text-primary)',
                    boxShadow: '0 0 15px rgba(252, 76, 2, 0.5)',
                    '& .MuiSvgIcon-root': {
                      color: 'var(--color-text-primary)',
                    },
                  }
              }}>
                <SvgIcon sx={{ mr: 2 }}>{item.icon}</SvgIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: '500' }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ marginTop: 'auto', p: 2 }}>
          <Button 
            variant="contained" 
            onClick={handleLogout} 
            fullWidth
            startIcon={<LogoutIcon />}
            sx={{
              backgroundColor: 'var(--color-accent-orange)',
              color: 'var(--color-text-primary)',
              fontWeight: 'bold',
              p: 1.5,
              borderRadius: '8px',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: '#e04402',
                transform: 'scale(1.02)',
                boxShadow: '0 0 20px rgba(252, 76, 2, 0.7)',
              },
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>
    </>
  );
});

export default AppDrawer;
