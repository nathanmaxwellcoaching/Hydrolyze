import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import swimStore, { type Swim, type User, type GoalTime } from '../store/SwimStore';
import { db } from '../firebase-config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { 
  Autocomplete, Box, Typography, TextField, Button, Select, MenuItem, 
  FormControl, InputLabel, OutlinedInput, Grid, useTheme, useMediaQuery 
} from '@mui/material';
import moment from 'moment';

const NewRecordForm = observer(() => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Form state logic remains unchanged
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

  // Data loading effects remain unchanged
  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, 'users'));
      setAllUsers(snap.docs.map(d => ({ ...d.data(), id: d.id } as User)));
    };
    load();
  }, []);

  useEffect(() => {
    if (swimStore.currentUser) {
      setFormState(prev => ({ ...prev, swimmerName: swimStore.currentUser!.name }));
    }
  }, [swimStore.currentUser]);

  useEffect(() => {
    if (!formState.swimmerName) return;
    const userRec = allUsers.find(u => u.name === formState.swimmerName);
    if (!userRec) return;
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

  const targetTimeReady = Boolean(formState.swimmerName && formState.targetPace && formState.distance);

  useEffect(() => {
    const { swimmerName, targetPace, distance } = formState;
    if (!swimmerName || !targetPace || !distance || Object.keys(goalTimeMap).length === 0) return;
    const gearStr = formState.gear.length ? formState.gear.sort().join('-') : 'NoGear';
    const key = `${targetPace}-${formState.stroke}-${gearStr}`;
    const baseTime = goalTimeMap[key];
    if (baseTime == null) return;
    const scaled = baseTime / (targetPace / distance);
    const final = Number(scaled.toFixed(1));
    setFormState(prev => ({ ...prev, targetTime: final }));
  }, [formState.swimmerName, formState.targetPace, formState.distance, formState.stroke, formState.gear, goalTimeMap]);

  // Handlers logic remains unchanged
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    const numericFields = ['distance', 'duration', 'targetTime', 'poolLength', 'heartRate', 'targetPace'];
    setFormState(prev => ({ ...prev, [name]: numericFields.includes(name) ? Number(value) : value }));
  };

  const handleStrokeRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setStrokeRateInput(value);
    const rates = value.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    setFormState(prev => ({ ...prev, averageStrokeRate: rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { swimmerName } = formState;
    if (!swimmerName) { alert('Please select a swimmer.'); return; }
    const userRec = allUsers.find(u => u.name === swimmerName.trim());
    if (!userRec) { alert('No user found with that name'); return; }
    const swimRecord: any = { ...formState, swimmerEmail: userRec.email };
    delete swimRecord.swimmerName;
    //delete swimRecord.targetPace;  // Remove this line
    if (Number.isNaN(swimRecord.averageStrokeRate)) swimRecord.averageStrokeRate = null;
    if (Number.isNaN(swimRecord.heartRate)) swimRecord.heartRate = null;
    try {
      await swimStore.addSwim(swimRecord);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      alert('Could not save: ' + err.message);
    }
  };

  // ----------- STYLING REDESIGN ----------- //
  const formInputStyles = {
    '& .MuiInputBase-root': {
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      color: 'var(--color-text-light)',
      borderRadius: '8px',
    },
    '& .MuiInputLabel-root': { color: 'var(--color-text-secondary)', '&.Mui-focused': { color: 'var(--color-accent-green)' } },
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
      '&:hover fieldset': { borderColor: 'var(--color-accent-light-blue)' },
      '&.Mui-focused fieldset': { borderColor: 'var(--color-accent-green)', borderWidth: '2px' },
      '&.Mui-focused': { boxShadow: '0 0 15px rgba(113, 235, 75, 0.5)' },
    },
    '& .MuiSvgIcon-root': { color: 'var(--color-text-secondary)' },
  };

  const formContent = (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: isMobile ? 2 : 0, pb: isMobile ? 4 : 0 }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom 
        sx={{ 
          fontWeight: 'bold', 
          background: 'var(--gradient-energetic)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent' 
        }}>
        Log New Swim Record
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Autocomplete
            freeSolo
            options={allUsers}
            getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
            onInputChange={(_, val) => setFormState(p => ({ ...p, swimmerName: val }))}
            value={formState.swimmerName}
            disabled={!is_admin}
            renderInput={(params) => <TextField {...params} label="Swimmer Name" sx={formInputStyles} />}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth type="datetime-local" label="Date" name="date" value={formState.date} onChange={handleChange} InputLabelProps={{ shrink: true }} sx={formInputStyles} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth type="number" label="Distance (m)" name="distance" value={formState.distance} onChange={handleChange} sx={formInputStyles} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth sx={formInputStyles}>
            <InputLabel>Stroke</InputLabel>
            <Select name="stroke" value={formState.stroke} onChange={handleChange}>
              <MenuItem value="Freestyle">Freestyle</MenuItem>
              <MenuItem value="Backstroke">Backstroke</MenuItem>
              <MenuItem value="Breaststroke">Breaststroke</MenuItem>
              <MenuItem value="Butterfly">Butterfly</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth type="number" label="Time Swum (seconds)" name="duration" value={formState.duration} onChange={handleChange} sx={formInputStyles} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth sx={formInputStyles}>
            <InputLabel>Target Pace</InputLabel>
            <Select name="targetPace" value={formState.targetPace ?? ''} onChange={handleChange} label="Target Pace">
              {goalDistances.map(d => <MenuItem key={d} value={d}>{d} m</MenuItem>) } 
            </Select>
          </FormControl>
        </Grid>
        {targetTimeReady && (
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="number" label="Target Time (seconds) – suggested" name="targetTime" value={formState.targetTime || ''} onChange={handleChange} sx={formInputStyles} />
          </Grid>
        )}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth sx={formInputStyles}>
            <InputLabel>Gear Used</InputLabel>
            <Select multiple name="gear" value={formState.gear} onChange={handleChange} input={<OutlinedInput label="Gear Used" />} renderValue={(s) => (s as string[]).join(', ')}>
              {['Fins', 'Paddles', 'Pull Buoy', 'Snorkel', 'NoGear'].map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth sx={formInputStyles}>
            <InputLabel>Pool Length</InputLabel>
            <Select name="poolLength" value={formState.poolLength} onChange={handleChange}>
              <MenuItem value={25}>25m</MenuItem>
              <MenuItem value={50}>50m</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Average Stroke Rate" name="strokeRateInput" value={strokeRateInput} onChange={handleStrokeRateChange} helperText="Comma-separated values are averaged" sx={formInputStyles} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth type="number" label="Heart Rate (HR)" name="heartRate" value={formState.heartRate || ''} onChange={handleChange} sx={formInputStyles} />
        </Grid>
        <Grid item xs={12}>
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2, p: 1.5, backgroundColor: 'var(--color-cta-primary)', color: 'var(--color-text-light)', fontWeight: 'bold', borderRadius: '12px', transition: 'all 0.3s ease', '&:hover': { backgroundColor: 'var(--color-cta-primary-hover)', transform: 'scale(1.02)', boxShadow: '0 0 20px rgba(10, 78, 178, 0.7)' } }}>
            Add Record
          </Button>
        </Grid>
      </Grid>
    </Box>
  );

  if (isMobile) {
    return (
      <Box sx={{ height: 'calc(100vh - 56px)', overflowY: 'auto', background: 'var(--color-background-dark)' }}>
        {formContent}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 3 }}>
      <Box sx={{ p: 4, width: '100%', maxWidth: 800, background: 'var(--color-background-card)', borderRadius: '16px', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)' }}>
        {formContent}
      </Box>
    </Box>
  );
});

export default NewRecordForm;