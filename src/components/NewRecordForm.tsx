import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import type { Swim } from '../store/SwimStore';
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
    const [formState, setFormState] = useState<Omit<Swim, 'id'>>({
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
    });
    const [strokeRateInput, setStrokeRateInput] = useState<string>('');

    const is_admin = swimStore.currentUser?.isAdmin;

    useEffect(() => {
        if (swimStore.currentUser && !is_admin) {
            const currentUserName = swimStore.currentUser.name;
            setFormState(prev => ({
                ...prev,
                swimmer: currentUserName
            }));
        }
    }, [swimStore.currentUser, is_admin]);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        const numericFields = ['distance', 'duration', 'targetTime', 'poolLength', 'heartRate'];
        
        setFormState(prev => ({
            ...prev,
            [name as string]: numericFields.includes(name as string) ? Number(value) : value
        }));
    };

    const handleStrokeRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setStrokeRateInput(value);

        const rates = value.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
        if (rates.length > 0) {
            const average = rates.reduce((sum, current) => sum + current, 0) / rates.length;
            setFormState(prev => ({ ...prev, averageStrokeRate: average }));
        } else {
            setFormState(prev => ({ ...prev, averageStrokeRate: undefined }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        swimStore.addSwim(formState);
        navigate('/');
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <Card sx={{
                p: 4,
                width: '100%',
                maxWidth: 600,
                animation: `${glow} 4s ease-in-out infinite`,
            }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Log New Swim Record
                </Typography>
                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Swimmer Name"
                        name="swimmer"
                        value={formState.swimmer}
                        onChange={handleChange}
                        disabled={!is_admin}
                        InputLabelProps={{ shrink: !!formState.swimmer }}
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
                    <TextField
                        fullWidth
                        margin="normal"
                        type="number"
                        label="Target Time (seconds)"
                        name="targetTime"
                        value={formState.targetTime || ''}
                        onChange={handleChange}
                    />
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
                            <MenuItem value="No Gear">No Gear</MenuItem>
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