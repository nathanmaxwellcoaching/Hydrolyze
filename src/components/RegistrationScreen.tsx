import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Box, Card, Typography, TextField, Button, keyframes, FormControlLabel, Checkbox, Collapse, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import PoolIcon from '@mui/icons-material/Pool';
import anime from 'animejs';
import { fadeInWithBlur } from '../themes/animations';

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const RegistrationScreen = observer(() => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'swimmer' | 'coach'>('swimmer');
  const [showStravaFields, setShowStravaFields] = useState(false);
  const [stravaClientId, setStravaClientId] = useState('');
  const [stravaClientSecret, setStravaClientSecret] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const cardRef = useRef(null);

  useEffect(() => {
    fadeInWithBlur(cardRef.current);
    fadeInWithBlur('.form-element', anime.stagger(100, { start: 200 }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await swimStore.register(name, email, password, userType, stravaClientId, stravaClientSecret);
      navigate('/');
    } catch (err: any) {
      if (err instanceof Error) {
        if (err.message.includes("User already registered")) {
          setError('This email address is already in use.');
        } else if (err.message.includes("invalid format")) {
          setError('Please enter a valid email address.');
        } else if (err.message.includes("should be at least 6 characters")) {
          setError('The password is too weak. Please use at least 6 characters.');
        } else {
          setError(err.message);
        }
      }
    }
  };

  const formInputStyles = {
    '& .MuiInputBase-root': {
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
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
        boxShadow: '0 0 15px rgba(113, 235, 75, 0.5)',
      },
    },
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--gradient-energetic)',
        backgroundSize: '400% 400%',
        animation: `${gradientAnimation} 20s ease infinite`,
        py: 4, // Add padding for smaller screens
      }}
    >
      <Card
        ref={cardRef}
        sx={{
          p: { xs: 3, sm: 4 },
          width: '100%',
          maxWidth: 420,
          textAlign: 'center',
          background: 'rgba(18, 18, 18, 0.75)',
          backdropFilter: 'blur(12px) saturate(180%)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          opacity: 0,
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
            background: 'var(--gradient-energetic)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Create Account
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Name"
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2, ...formInputStyles }}
            className="form-element"
          />
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
            sx={{ ...formInputStyles }}
            className="form-element"
          />
          <FormControl fullWidth sx={{ mt: 2, ...formInputStyles }} className="form-element">
            <InputLabel>User Type</InputLabel>
            <Select
              value={userType}
              onChange={(e) => setUserType(e.target.value as 'swimmer' | 'coach')}
              label="User Type"
            >
              <MenuItem value="swimmer">Swimmer</MenuItem>
              <MenuItem value="coach">Coach</MenuItem>
            </Select>
          </FormControl>
          {userType === 'swimmer' && (
            <>
              <FormControlLabel
                control={<Checkbox checked={showStravaFields} onChange={(e) => setShowStravaFields(e.target.checked)} sx={{ color: 'var(--color-text-secondary)' }} />}
                label="Connect Strava (Optional)"
                className="form-element"
                sx={{ mt: 1, color: 'var(--color-text-secondary)' }}
              />
              <Collapse in={showStravaFields}>
                <TextField
                  fullWidth
                  label="Strava Client ID"
                  variant="outlined"
                  value={stravaClientId}
                  onChange={(e) => setStravaClientId(e.target.value)}
                  sx={{ mt: 2, ...formInputStyles }}
                  className="form-element"
                />
                <TextField
                  fullWidth
                  label="Strava Client Secret"
                  variant="outlined"
                  value={stravaClientSecret}
                  onChange={(e) => setStravaClientSecret(e.target.value)}
                  sx={{ mt: 2, ...formInputStyles }}
                  className="form-element"
                />
              </Collapse>
            </>
          )}
          {error && <Typography color="error" sx={{ mt: 2, fontWeight: '500' }}>{error}</Typography>}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            className="form-element"
            sx={{
              mt: 3,
              p: 1.5,
              backgroundColor: 'var(--color-cta-primary)',
              color: 'var(--color-text-light)',
              fontWeight: 'bold',
              borderRadius: '8px',
              transition: 'transform 0.2s ease, box-shadow 0.3s ease, background-color 0.3s ease',
              '&:hover': {
                backgroundColor: 'var(--color-cta-primary-hover)',
                transform: 'scale(1.03)',
                boxShadow: '0 0 25px rgba(10, 78, 178, 0.8)',
              },
            }}
          >
            Register
          </Button>
          <Button
            fullWidth
            variant="outlined"
            className="form-element"
            onClick={() => navigate('/login')}
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
            Already have an account? Login
          </Button>
        </Box>
      </Card>
    </Box>
  );
});

export default RegistrationScreen;
