
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Box, Card, Typography, TextField, Button, keyframes } from '@mui/material';
import PoolIcon from '@mui/icons-material/Pool'; // Using an MUI icon as a logo

const glow = keyframes`
  0% { box-shadow: 0 0 5px #9C27B0; }
  50% { box-shadow: 0 0 20px #9C27B0, 0 0 30px #9C27B0; }
  100% { box-shadow: 0 0 5px #9C27B0; }
`;

const PasswordScreen = observer(() => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (swimStore.authenticate(password)) {
      navigate('/', { replace: true });
    } else {
      setError(true);
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
            type="password"
            label="Password"
            variant="outlined"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            error={error}
            helperText={error ? 'Incorrect password' : ''}
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2, p: 1.5 }}>
            Enter
          </Button>
        </Box>
      </Card>
    </Box>
  );
});

export default PasswordScreen;
