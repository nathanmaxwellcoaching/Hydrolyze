import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import swimStore, { type Swim, type User, type GoalTime } from '../store/SwimStore';
import { db } from '../firebase-config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  Box, Card, Typography, TextField, Button, keyframes, Select, MenuItem,
  FormControl, InputLabel, OutlinedInput
} from '@mui/material';
import moment from 'moment';

const glow = keyframes`
  0% { box-shadow: 0 0 5px #9C27B0; }
  50% { box-shadow: 0 0 20px #9C27B0, 0 0 30px #9C27B0; }
  100% { box-shadow: 0 0 5px #9C27B0; }
`;

const NewRecordForm = observer(() => {
  const navigate = useNavigate();

  /* ---------- form state ---------- */
  const [formState, setFormState] = useState<Omit<Swim, 'id'> & { targetPace?: number }>({
    date: moment().format('YYYY-MM-DDTHH:mm'),
    targetTime: undefined,
    duration: 0,
    gear: [],
    poolLength: 25,
    stroke: 'Freestyle',
    distance: 50,
    swimmer: '',
    averageStrokeRate: undefined,
    heartRate: undefined,
    targetPace: undefined,
  });
  const [strokeRateInput, setStrokeRateInput] = useState<string>('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [goalDistances, setGoalDistances] = useState<number[]>([]);
  const [goalTimeMap, setGoalTimeMap] = useState<Record<string, number>>({});

  const is_admin = swimStore.currentUser?.isAdmin;

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
      setFormState(prev => ({ ...prev, swimmer: swimStore.currentUser!.name }));
    }
  }, [swimStore.currentUser]);

  /* ---------- load goal_times for chosen swimmer ---------- */
  useEffect(() => {
    if (!formState.swimmer) {
      setGoalDistances([]);
      setGoalTimeMap({});
      return;
    }
    const userRec = allUsers.find(u => u.name === formState.swimmer);
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
        map[key] = d.data()[key] as number;
        distances.push(g.distance);
      });

      setGoalDistances([...new Set(distances)].sort((a, b) => a - b));
      setGoalTimeMap(map);
    })();
  }, [formState.swimmer, allUsers]);

  /* ---------- readiness flag & auto-fill ---------- */
  const targetTimeReady = Boolean(formState.swimmer && formState.targetPace && formState.distance);

  useEffect(() => {
    const { swimmer, targetPace, distance } = formState;
    if (!swimmer || !targetPace || !distance) return;
    if (Object.keys(goalTimeMap).length === 0) return;

    const gearStr = formState.gear.length
      ? formState.gear.sort().join('-')
      : 'NoGear';
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
  }, [
    formState.swimmer,
    formState.targetPace,
    formState.distance,
    formState.stroke,
    formState.gear,
    goalTimeMap
  ]);

  /* ---------- generic change handler ---------- */
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    const numericFields = ['distance', 'duration', 'targetTime', 'poolLength', 'heartRate', 'targetPace'];
    setFormState(prev => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) : value
    }));
  };

  /* ---------- stroke-rate comma parser ---------- */
  const handleStrokeRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setStrokeRateInput(value);
    const rates = value.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    setFormState(prev => ({
      ...prev,
      averageStrokeRate: rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : undefined
    }));
  };

  /* ---------- submit ---------- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    swimStore.addSwim(formState);
    navigate('/');
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
      <Card sx={{ p: 4, width: '100%', maxWidth: 600, animation: `${glow} 4s ease-in-out infinite` }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Log New Swim Record
        </Typography>

        <form onSubmit={handleSubmit}>
          {/* ----  swimmer selector  ---- */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Swimmer Name</InputLabel>
            <Select
              name="swimmer"
              value={formState.swimmer}
              onChange={handleChange}
              disabled={!is_admin}
              label="Swimmer Name"
            >
              {allUsers.map(u => (
                <MenuItem key={u.id} value={u.name}>{u.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            type="datetime-local"
            label="Date"
            name="date"
            value={formState.date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            margin="normal"
            type="number"
            label="Distance (m)"
            name="distance"
            value={formState.distance}
            onChange={handleChange}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Stroke</InputLabel>
            <Select
              name="stroke"
              value={formState.stroke}
              onChange={handleChange}
            >
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
          />

          {/* ----  Target Pace dropdown (EVERYONE)  ---- */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Target Pace</InputLabel>
            <Select
              name="targetPace"
              value={formState.targetPace ?? ''}
              onChange={handleChange}
              label="Target Pace"
            >
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
            />
          )}

          <FormControl fullWidth margin="normal">
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

          <FormControl fullWidth margin="normal">
            <InputLabel>Pool Length</InputLabel>
            <Select
              name="poolLength"
              value={formState.poolLength}
              onChange={handleChange}
            >
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
          />
          <TextField
            fullWidth
            margin="normal"
            type="number"
            label="Heart Rate (HR)"
            name="heartRate"
            value={formState.heartRate || ''}
            onChange={handleChange}
          />

          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, p: 1.5 }}>
            Add Record
          </Button>
        </form>
      </Card>
    </Box>
  );
});

export default NewRecordForm;