
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Box, Card, Typography, TextField, Button, keyframes } from '@mui/material';
import PoolIcon from '@mui/icons-material/Pool'; // Using an MUI icon as a logo

const glow = keyframes`
  0% { box-shadow: 0 0 5px #9C27B0; }
  50% { box-shadow: 0 0 20px #9C27B0, 0 0 30px #9C27B0; }
  100% { box-shadow: 0 0 5px #9C27B0; }
`;

const LoginScreen = observer(() => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Card
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          textAlign: 'center',
          animation: `${glow} 4s ease-in-out infinite`,
        }}
      >
        <PoolIcon sx={{ fontSize: 60, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 2 }}>
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
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="password"
            label="Password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2, p: 1.5 }}>
            Login
          </Button>

        </Box>
      </Card>
    </Box>
  );
});

export default LoginScreen;
