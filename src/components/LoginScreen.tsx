
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Box, Card, Typography, TextField, Button, keyframes } from '@mui/material';
import PoolIcon from '@mui/icons-material/Pool';
import anime from 'animejs';
import { fadeInWithBlur } from '../themes/animations';

// A smoother, more vibrant gradient animation for the background.
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const LoginScreen = observer(() => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const cardRef = useRef(null);

  // Use the new, smoother animation preset.
  useEffect(() => {
    fadeInWithBlur(cardRef.current);
    fadeInWithBlur('.form-element', anime.stagger(100, { start: 200 }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await swimStore.login(email, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else {
        setError('An error occurred during login.');
      }
      anime({ targets: cardRef.current, translateX: ['-5px', '5px', 0], duration: 300, easing: 'easeInOutSine' });
    }
  };

  // Updated styles for form inputs to match the new design system.
  const formInputStyles = {
    '& .MuiInputBase-root': {
      backgroundColor: 'rgba(0, 0, 0, 0.2)', // Dark, slightly transparent background
      color: 'var(--color-text-light)',
      borderRadius: '8px',
      transition: 'background-color 0.3s, box-shadow 0.3s',
    },
    '& .MuiInputLabel-root': {
      color: 'var(--color-text-secondary)',
      '&.Mui-focused': { color: 'var(--color-accent-green)' },
    },
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
      '&:hover fieldset': { borderColor: 'var(--color-accent-light-blue)' },
      '&.Mui-focused fieldset': {
        borderColor: 'var(--color-accent-green)',
        borderWidth: '2px',
      },
      '&.Mui-focused': {
        boxShadow: '0 0 15px rgba(113, 235, 75, 0.5)', // Green glow on focus
      },
    },
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        // Use the energetic gradient for a more dynamic background
        background: 'var(--gradient-energetic)',
        backgroundSize: '400% 400%',
        animation: `${gradientAnimation} 20s ease infinite`,
      }}
    >
      <Card
        ref={cardRef}
        sx={{
          p: { xs: 3, sm: 4 }, // Responsive padding
          width: '100%',
          maxWidth: 420,
          textAlign: 'center',
          // Glassmorphism effect: semi-transparent background with blur
          background: 'rgba(18, 18, 18, 0.75)',
          backdropFilter: 'blur(12px) saturate(180%)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          opacity: 0, // Initial state for anime.js
        }}
      >
        <PoolIcon sx={{ fontSize: 60, color: 'var(--color-accent-cyan)', mb: 2 }} className="form-element" />
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          className="form-element"
          sx={{
            fontWeight: 'bold',
            // Applying a gradient to the text for a standout effect
            background: 'var(--gradient-energetic)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          SwimTracker
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            type="email"
            label="Email"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2, ...formInputStyles }}
            className="form-element"
          />
          <TextField
            fullWidth
            type="password"
            label="Password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={formInputStyles}
            className="form-element"
          />
          {error && <Typography color="error" sx={{ mt: 2, fontWeight: '500' }}>{error}</Typography>}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            className="form-element"
            sx={{
              mt: 3,
              p: 1.5,
              // Using the primary CTA color for the main action button
              backgroundColor: 'var(--color-cta-primary)',
              color: 'var(--color-text-light)',
              fontWeight: 'bold',
              borderRadius: '8px',
              transition: 'transform 0.2s ease, box-shadow 0.3s ease, background-color 0.3s ease',
              '&:hover': {
                backgroundColor: 'var(--color-cta-primary-hover)',
                transform: 'scale(1.03)',
                // Adding a glow effect on hover for better feedback
                boxShadow: '0 0 25px rgba(10, 78, 178, 0.8)',
              },
            }}
          >
            Login
          </Button>
          <Button
            fullWidth
            variant="outlined"
            className="form-element"
            onClick={() => navigate('/register')}
            sx={{
              mt: 1.5,
              p: 1.5,
              borderColor: 'var(--color-accent-light-blue)',
              color: 'var(--color-accent-light-blue)',
              fontWeight: 'bold',
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: 'rgba(10, 126, 178, 0.1)',
                borderColor: 'var(--color-accent-cyan)',
              },
            }}
          >
            Sign Up
          </Button>
        </Box>
      </Card>
    </Box>
  );
});

export default LoginScreen;
