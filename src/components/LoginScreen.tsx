import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Box, Card, Typography, TextField, Button, keyframes } from '@mui/material';
import PoolIcon from '@mui/icons-material/Pool';
import anime from 'animejs';

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

  useEffect(() => {
    anime({
      targets: cardRef.current,
      opacity: [0, 1],
      scale: [0.9, 1],
      duration: 800,
      easing: 'easeInOutQuad',
    });
    anime({
      targets: '.form-element',
      opacity: [0, 1],
      translateY: [20, 0],
      delay: anime.stagger(100, { start: 400 }),
      easing: 'easeInOutQuad',
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const success = await swimStore.login(email, password);
      if (success) {
        navigate('/', { replace: true });
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred during login.');
    }
  };

  const formInputStyles = {
    '& .MuiInputBase-root': {
      backgroundColor: '#191919',
      color: '#FFFFFF',
      borderRadius: '8px',
    },
    '& .MuiInputLabel-root': { color: '#a9a9a9', '&.Mui-focused': { color: '#FFFFFF' } },
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: '#444' },
      '&:hover fieldset': { borderColor: 'var(--color-accent-orange)' },
      '&.Mui-focused fieldset': { borderColor: 'var(--color-accent-orange)', borderWidth: '2px' },
    },
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(-45deg, #0B0B0F, #0A1A37, #121212, #0B0B0F)',
        backgroundSize: '400% 400%',
        animation: `${gradientAnimation} 15s ease infinite`,
      }}
    >
      <Card
        ref={cardRef}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          textAlign: 'center',
          background: 'rgba(18, 18, 18, 0.85)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          opacity: 0, // Initial state for anime.js
        }}
      >
        <PoolIcon sx={{ fontSize: 60, color: 'var(--color-accent-orange)', mb: 2 }} className="form-element" />
        <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 2, fontWeight: 'bold', color: 'var(--color-text-primary)' }} className="form-element">
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
          {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
          <Button 
            type="submit" 
            fullWidth 
            variant="contained" 
            className="form-element"
            sx={{
              mt: 3,
              p: 1.5,
              backgroundColor: 'var(--color-accent-orange)',
              color: 'var(--color-text-primary)',
              fontWeight: 'bold',
              borderRadius: '8px',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: '#e04402',
                transform: 'scale(1.02)',
                boxShadow: '0 0 20px rgba(252, 76, 2, 0.7)',
              },
            }}
          >
            Login
          </Button>
        </Box>
      </Card>
    </Box>
  );
});

export default LoginScreen;