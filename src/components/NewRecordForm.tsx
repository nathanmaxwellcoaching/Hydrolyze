
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import swimStore, { type Swim, type User, type GoalTime } from '../store/SwimStore';
import { db } from '../firebase-config';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import {
  Autocomplete, Box, Card, Typography, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, OutlinedInput
} from '@mui/material';
import moment from 'moment';
import anime from 'animejs';

const NewRecordForm = observer(() => {
  const navigate = useNavigate();
  const cardRef = useRef(null);

  /* ---------- form state ---------- */
  const [formState, setFormState] = useState<Omit<Swim, 'id' | 'swimmer'> & { swimmerName: string; targetPace?: number; swimmerEmail: string }>({
    date: moment().format('YYYY-MM-DDTHH:mm'),
    targetTime: undefined,
    duration: 0,
    gear: [],
    poolLength: 25,
    stroke: 'Freestyle',
    distance: 50,
    swimmerName: '',
    averageStrokeRate: undefined,
    heartRate: undefined,
    targetPace: undefined,
    swimmerEmail: '',
  });
  const [strokeRateInput, setStrokeRateInput] = useState<string>('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [goalDistances, setGoalDistances] = useState<number[]>([]);
  const [goalTimeMap, setGoalTimeMap] = useState<Record<string, number>>({});

  const is_admin = swimStore.currentUser?.isAdmin;

  /* ---------- animations ---------- */
  useEffect(() => {
    if (cardRef.current) {
      anime({
        targets: cardRef.current,
        opacity: [0, 1],
        translateY: [50, 0],
        duration: 800,
        easing: 'easeInOutQuad',
      });
      anime({
        targets: '.form-field',
        opacity: [0, 1],
        translateY: [20, 0],
        delay: anime.stagger(100, { start: 400 }),
        easing: 'easeInOutQuad',
      });
    }
  }, []);

  /* ---------- load all users ---------- */
  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, 'users'));
      setAllUsers(snap.docs.map(d => ({ ...d.data(), id: d.id } as User)));
    };
    load();
  }, []);

  /* ---------- pre-fill ANY user (admin can still change) ---------- */
  useEffect(() => {
    if (swimStore.currentUser) {
      setFormState(prev => ({ ...prev, swimmerName: swimStore.currentUser!.name }));
    }
  }, [swimStore.currentUser]);

  /* ---------- load goal_times for chosen swimmer ---------- */
  useEffect(() => {
    if (!formState.swimmerName) {
      setGoalDistances([]);
      setGoalTimeMap({});
      return;
    }
    const userRec = allUsers.find(u => u.name === formState.swimmerName);
    if (!userRec) {
      setGoalDistances([]);
      setGoalTimeMap({});
      return;
    }

    (async () => {
      const q = query(collection(db, 'goal_times'), where('email', '==', userRec.email));
      const snap = await getDocs(q);
      const distances: number[] = [];
      const map: Record<string, number> = {};

      snap.forEach(d => {
        const g = d.data() as GoalTime;
        const gearStr = g.gear.length ? g.gear.sort().join('-') : 'NoGear';
        const key = `${g.distance}-${g.stroke}-${gearStr}`;
        map[key] = g.time;
        distances.push(g.distance);
      });

      setGoalDistances([...new Set(distances)].sort((a, b) => a - b));
      setGoalTimeMap(map);
    })();
  }, [formState.swimmerName, allUsers]);

  /* ---------- readiness flag & auto-fill ---------- */
  const targetTimeReady = Boolean(formState.swimmerName && formState.targetPace && formState.distance);

  useEffect(() => {
    const { swimmerName, targetPace, distance } = formState;
    if (!swimmerName || !targetPace || !distance) return;
    if (Object.keys(goalTimeMap).length === 0) return;

    const gearStr = formState.gear.length ? formState.gear.sort().join('-') : 'NoGear';
    const key = `${targetPace}-${formState.stroke}-${gearStr}`;

    const baseTime = goalTimeMap[key];
    if (baseTime == null) {
      console.log('❌ no goal for composite key', key);
      return;
    }

    const scaled = baseTime / (targetPace / distance);
    const final = Number(scaled.toFixed(1));
    console.log('✅ writing targetTime:', final, 'key:', key);
    setFormState(prev => ({ ...prev, targetTime: final }));
  }, [formState.swimmerName, formState.targetPace, formState.distance, formState.stroke, formState.gear, goalTimeMap]);

  /* ---------- generic change handler ---------- */
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    const numericFields = ['distance', 'duration', 'targetTime', 'poolLength', 'heartRate', 'targetPace'];
    setFormState(prev => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) : value,
    }));
  };

  /* ---------- stroke-rate comma parser ---------- */
  const handleStrokeRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setStrokeRateInput(value);
    const rates = value.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    setFormState(prev => ({
      ...prev,
      averageStrokeRate: rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : undefined,
    }));
  };

  /* ---------- submit ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { swimmerName } = formState;
    if (!swimmerName) {
      alert('Please select a swimmer.');
      return;
    }

    const userRec = allUsers.find(u => u.name === swimmerName.trim());
    if (!userRec) {
      alert('No user found with that name');
      return;
    }

    const swimRecord: any = {
      ...formState,
      swimmerEmail: userRec.email,
    };
    delete swimRecord.swimmerName;
    delete swimRecord.targetPace;

    /* sanitise NaNs that Firestore rejects */
    if (Number.isNaN(swimRecord.averageStrokeRate)) swimRecord.averageStrokeRate = null;
    if (Number.isNaN(swimRecord.heartRate)) swimRecord.heartRate = null;

    try {
      await addDoc(collection(db, 'swimRecords'), swimRecord);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      alert('Could not save: ' + err.message);
    }
  };

  // Common styles for form inputs
  const formInputStyles = {
    '& .MuiInputBase-root': {
      backgroundColor: '#191919',
      color: '#FFFFFF',
      borderRadius: '8px',
      transition: 'box-shadow 0.3s ease-in-out',
      '&:hover': {
        boxShadow: '0 0 10px rgba(252, 76, 2, 0.5)',
      },
      '&.Mui-focused': {
        boxShadow: '0 0 15px rgba(252, 76, 2, 0.8)',
      },
    },
    '& .MuiInputLabel-root': {
      color: '#a9a9a9',
      '&.Mui-focused': {
        color: '#FFFFFF',
      },
    },
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: '#444',
      },
      '&:hover fieldset': {
        borderColor: '#FC4C02',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#FC4C02',
        borderWidth: '2px',
      },
    },
    '& .MuiSvgIcon-root': {
      color: '#a9a9a9',
    },
  };

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#0B0B0F',
      py: 4,
      '@media (max-width: 768px)': {
        alignItems: 'flex-end',
        py: 0,
      },
    }}>
      <Card
        ref={cardRef}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 600,
          background: 'linear-gradient(135deg, #121212, #0A1A37)',
          color: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          opacity: 0, // Initial state for anime.js
          '@media (max-width: 768px)': {
            maxWidth: '100%',
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            height: '90vh',
            overflowY: 'auto',
          },
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', background: 'linear-gradient(90deg, #FC4C02, #FFD700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Log New Swim Record
        </Typography>

        <form onSubmit={handleSubmit}>
          {/* ----  swimmer selector  ---- */}
          <Autocomplete
            freeSolo
            options={allUsers}
            getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
            onInputChange={(_, newInputValue) => {
              setFormState(prev => ({ ...prev, swimmerName: newInputValue }));
            }}
            onChange={(_, newValue) => {
              const swimmerName = typeof newValue === 'string' ? newValue : newValue?.name || '';
              setFormState(prev => ({ ...prev, swimmerName }));
            }}
            value={formState.swimmerName}
            disabled={!is_admin}
            renderInput={(params) => (
              <TextField {...params} label="Swimmer Name" margin="normal" sx={formInputStyles} className="form-field" />
            )}
            className="form-field"
          />

          <TextField
            fullWidth
            margin="normal"
            type="datetime-local"
            label="Date"
            name="date"
            value={formState.date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            sx={formInputStyles}
            className="form-field"
          />
          <TextField
            fullWidth
            margin="normal"
            type="number"
            label="Distance (m)"
            name="distance"
            value={formState.distance}
            onChange={handleChange}
            sx={formInputStyles}
            className="form-field"
          />
          <FormControl fullWidth margin="normal" sx={formInputStyles} className="form-field">
            <InputLabel>Stroke</InputLabel>
            <Select name="stroke" value={formState.stroke} onChange={handleChange}>
              <MenuItem value="Freestyle">Freestyle</MenuItem>
              <MenuItem value="Backstroke">Backstroke</MenuItem>
              <MenuItem value="Breaststroke">Breaststroke</MenuItem>
              <MenuItem value="Butterfly">Butterfly</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            type="number"
            label="Time Swum (seconds)"
            name="duration"
            value={formState.duration}
            onChange={handleChange}
            sx={formInputStyles}
            className="form-field"
          />

          {/* ----  Target Pace dropdown (EVERYONE)  ---- */}
          <FormControl fullWidth margin="normal" sx={formInputStyles} className="form-field">
            <InputLabel>Target Pace</InputLabel>
            <Select name="targetPace" value={formState.targetPace ?? ''} onChange={handleChange} label="Target Pace">
              {goalDistances.map(d => (
                <MenuItem key={d} value={d}>{d} m</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* ----  Target Time (appears only when ready)  ---- */}
          {targetTimeReady && (
            <TextField
              fullWidth
              margin="normal"
              type="number"
              label="Target Time (seconds) – suggested"
              name="targetTime"
              value={formState.targetTime || ''}
              onChange={handleChange}
              sx={formInputStyles}
              className="form-field"
            />
          )}

          <FormControl fullWidth margin="normal" sx={formInputStyles} className="form-field">
            <InputLabel>Gear Used</InputLabel>
            <Select
              multiple
              name="gear"
              value={formState.gear}
              onChange={handleChange}
              input={<OutlinedInput label="Gear Used" />}
              renderValue={(selected) => (selected as string[]).join(', ')}
            >
              <MenuItem value="Fins">Fins</MenuItem>
              <MenuItem value="Paddles">Paddles</MenuItem>
              <MenuItem value="Pull Buoy">Pull Buoy</MenuItem>
              <MenuItem value="Snorkel">Snorkel</MenuItem>
              <MenuItem value="NoGear">No Gear</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" sx={formInputStyles} className="form-field">
            <InputLabel>Pool Length</InputLabel>
            <Select name="poolLength" value={formState.poolLength} onChange={handleChange}>
              <MenuItem value={25}>25m</MenuItem>
              <MenuItem value={50}>50m</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            label="Average Stroke Rate"
            name="strokeRateInput"
            value={strokeRateInput}
            onChange={handleStrokeRateChange}
            helperText="Enter comma separated values to automatically calculate average"
            sx={formInputStyles}
            className="form-field"
          />
          <TextField
            fullWidth
            margin="normal"
            type="number"
            label="Heart Rate (HR)"
            name="heartRate"
            value={formState.heartRate || ''}
            onChange={handleChange}
            sx={formInputStyles}
            className="form-field"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            className="form-field"
            sx={{
              mt: 3,
              p: 1.5,
              backgroundColor: '#FC4C02',
              color: '#FFFFFF',
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
            Add Record
          </Button>
        </form>
      </Card>
    </Box>
  );
});

export default NewRecordForm;
