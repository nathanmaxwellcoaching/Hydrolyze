import { NavLink, useNavigate } from 'react-router-dom';
import { Toolbar, List, ListItem, ListItemButton, ListItemText, Box, Typography, Button, SvgIcon } from '@mui/material';
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import StorageIcon from '@mui/icons-material/Storage';
import PeopleIcon from '@mui/icons-material/People';
import GroupIcon from '@mui/icons-material/Group';
import StarIcon from '@mui/icons-material/Star';
import LogoutIcon from '@mui/icons-material/Logout';
import PoolIcon from '@mui/icons-material/Pool';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useEffect } from 'react';
import anime from 'animejs';

const AppDrawer = observer(() => {
  console.log('CurrentUser in AppDrawer:', swimStore.currentUser);
  const navigate = useNavigate();

  const handleLogout = () => {
    swimStore.logout();
    navigate('/login'); // Redirect to login after logout
  };

  // Navigation items configuration
  const navItems = [
    { text: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { text: 'Calendar', path: '/calendar', icon: <CalendarMonthIcon /> },
    { text: 'Log Swim', path: '/log', icon: <AddCircleOutlineIcon /> },
    { text: 'Lap Metrics', path: '/lap-metrics', icon: <AssessmentIcon /> },
    { text: 'Goal Times', path: '/goal-times', icon: <StarIcon /> },
  ];

  if (swimStore.currentUser?.stravaClientId && swimStore.currentUser?.stravaClientSecret) {
    navItems.splice(1, 0, { text: 'Strava', path: '/strava', icon: <StarIcon /> });
  }

  if (swimStore.currentUser?.userType === 'coach') {
    navItems.push({ text: 'Swimmers', path: '/swimmers', icon: <PeopleIcon /> });
  }

  if (swimStore.currentUser?.userType === 'swimmer') {
    navItems.push({ text: 'Coaches', path: '/coaches', icon: <GroupIcon /> });
  }

  if (swimStore.currentUser?.isAdmin) {
    navItems.push({ text: 'Manage Records', path: '/manage-records', icon: <StorageIcon /> });
    navItems.push({ text: 'Manage Users', path: '/manage-users', icon: <PeopleIcon /> });
  }

  // Staggered animation for nav items on load
  useEffect(() => {
    anime({
      targets: '.nav-item',
      translateX: [-280, 0],
      opacity: [0, 1],
      delay: anime.stagger(100, { start: 200 }),
      easing: 'easeOutExpo',
    });
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Drawer Header with App Logo/Name */}
      <Toolbar sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <PoolIcon sx={{ fontSize: 40, color: 'var(--color-accent-cyan)' }} />
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 'bold', 
            background: 'var(--gradient-energetic)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}>
          SwimTracker
        </Typography>
      </Toolbar>

      {/* Navigation List */}
      <List sx={{ p: 1, flexGrow: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding className="nav-item" sx={{ opacity: 0 }}>
            <ListItemButton
              component={NavLink}
              to={item.path}
              end // Ensure exact match for active style
              sx={{
                color: 'var(--color-text-secondary)',
                borderRadius: '12px',
                m: 0.5,
                py: 1.5,
                transition: 'all 0.3s ease',
                ' & .MuiSvgIcon-root': {
                  color: 'var(--color-text-secondary)',
                  transition: 'color 0.3s',
                },
                '&:hover': {
                  backgroundColor: 'rgba(113, 235, 75, 0.1)', // Light green hover
                  color: 'var(--color-text-light)',
                  ' & .MuiSvgIcon-root': {
                    color: 'var(--color-accent-green)',
                  },
                },
                // Style for the active navigation link
                '&.active': {
                  background: 'var(--gradient-energetic)',
                  color: 'var(--color-text-light)',
                  boxShadow: '0 0 20px rgba(113, 235, 75, 0.6)',
                  ' & .MuiSvgIcon-root': {
                    color: 'var(--color-text-light)',
                  },
                }
              }}
            >
              <SvgIcon sx={{ mr: 2 }}>{item.icon}</SvgIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: '600' }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Logout Button at the bottom */}
      <Box sx={{ p: 2 }}>
        <Button
          variant="contained"
          onClick={handleLogout}
          fullWidth
          startIcon={<LogoutIcon />}
          sx={{
            // Styling consistent with other primary CTAs
            backgroundColor: 'var(--color-cta-primary)',
            color: 'var(--color-text-light)',
            fontWeight: 'bold',
            p: 1.5,
            borderRadius: '12px',
            transition: 'transform 0.2s ease, box-shadow 0.3s ease, background-color 0.3s ease',
            '&:hover': {
              backgroundColor: 'var(--color-cta-primary-hover)',
              transform: 'scale(1.03)',
              boxShadow: '0 0 20px rgba(10, 78, 178, 0.7)',
            },
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
});

export default AppDrawer;