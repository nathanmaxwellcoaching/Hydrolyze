
import { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Grid } from '@mui/material';
import { keyframes } from '@mui/system';

const glow = keyframes`
  0% { box-shadow: 0 0 3px #9C27B0; }
  50% { box-shadow: 0 0 15px #9C27B0, 0 0 20px #9C27B0; }
  100% { box-shadow: 0 0 3px #9C27B0; }
`;

const MetricCard = ({ title, value }: { title: string, value: string | number }) => (
  <Paper sx={{
    p: 3,
    height: '100%',
    animation: `${glow} 5s ease-in-out infinite`,
  }}>
    <Typography variant="body2" gutterBottom>{title}</Typography>
    <Typography variant="h5">{value}</Typography>
  </Paper>
);

const LapMetrics = () => {
    const [distance, setDistance] = useState('');
    const [time, setTime] = useState('');
    const [strokeRate, setStrokeRate] = useState('');
    const [heartRate, setHeartRate] = useState('');

    const [sl, setSl] = useState<number | null>(null);
    const [si, setSi] = useState<number | null>(null);
    const [ie, setIe] = useState<number | null>(null);

    const calculateMetrics = () => {
        const dist = parseFloat(distance);
        const t = parseFloat(time);
        const sr = parseFloat(strokeRate);
        const hr = parseFloat(heartRate);

        if (dist && t && sr && hr) {
            const vSwim = dist / t;
            const strokeLength = vSwim / (sr / 60); // Assuming SR is in strokes per minute
            const strokeIndex = strokeLength * vSwim;
            const ieRatio = hr / strokeIndex;

            setSl(strokeLength);
            setSi(strokeIndex);
            setIe(ieRatio);
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Lap Metrics</Typography>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6">What are these metrics?</Typography>
                <ul>
                    <li><Typography>Stroke Length (SL) is a practical indicator of propelling efficiency</Typography></li>
                    <li><Typography>The Stroke Index (SI) is considered an index of swimming efficiency. Kinematic changes, reflecting optimization of interaction with the water, are reflected in SI. A higher SI indicates that a swimmer has a more efficient technique</Typography></li>
                    <li><Typography>The IE ratio is a metric used in swim training to observe if the desired balance between technique and physiology is maintained and if the goal of the training session is reached</Typography></li>
                </ul>
            </Paper>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField label="Distance (m)" type="number" value={distance} onChange={e => setDistance(e.target.value)} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField label="Time (s)" type="number" value={time} onChange={e => setTime(e.target.value)} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField label="Stroke Rate (strokes/min)" type="number" value={strokeRate} onChange={e => setStrokeRate(e.target.value)} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField label="Heart Rate (bpm)" type="number" value={heartRate} onChange={e => setHeartRate(e.target.value)} fullWidth />
                    </Grid>
                </Grid>
                <Button variant="contained" onClick={calculateMetrics} sx={{ mt: 2 }}>Calculate</Button>
            </Paper>

            {sl !== null && si !== null && ie !== null && (
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                        <MetricCard title="Stroke Length (m/stroke)" value={sl.toFixed(2)} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <MetricCard title="Stroke Index" value={si.toFixed(2)} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <MetricCard title="IE Ratio" value={ie.toFixed(2)} />
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default LapMetrics;
