import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, TextField, Button, Grid } from '@mui/material';
import anime from 'animejs';

const MetricCard = ({ title, value }: { title: string, value: string | number }) => (
  <Paper sx={{
    p: 3,
    height: '100%',
    background: 'var(--color-background-card-gradient)',
    color: 'var(--color-text-primary)',
    borderRadius: '16px',
    border: '1px solid var(--color-border)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    textAlign: 'center',
  }}>
    <Typography variant="body1" sx={{ color: 'var(--color-text-secondary)' }} gutterBottom>{title}</Typography>
    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{value}</Typography>
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

    const pageRef = useRef(null);

    useEffect(() => {
      anime({
        targets: pageRef.current,
        opacity: [0, 1],
        translateY: [50, 0],
        easing: 'easeInOutQuad',
        duration: 800,
      });
    }, []);

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
        } else {
            setSl(null);
            setSi(null);
            setIe(null);
        }
    };

    const formInputStyles = {
      '& .MuiInputBase-root': { backgroundColor: '#191919', color: '#FFFFFF', borderRadius: '8px' },
      '& .MuiInputLabel-root': { color: '#a9a9a9', '&.Mui-focused': { color: '#FFFFFF' } },
      '& .MuiOutlinedInput-root': {
        '& fieldset': { borderColor: '#444' },
        '&:hover fieldset': { borderColor: 'var(--color-accent-orange)' },
        '&.Mui-focused fieldset': { borderColor: 'var(--color-accent-orange)', borderWidth: '2px' },
      },
    };

    const cardStyles = {
      p: 3,
      background: 'var(--color-background-card-gradient)',
      color: 'var(--color-text-primary)',
      borderRadius: '16px',
      border: '1px solid var(--color-border)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      mb: 3,
    };

    return (
        <Box ref={pageRef} sx={{ opacity: 0 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: 'var(--color-text-primary)' }}>Lap Metrics Calculator</Typography>

            <Paper sx={cardStyles}>
                <Typography variant="h6" gutterBottom>What are these metrics?</Typography>
                <ul>
                    <li><Typography><strong>Stroke Length (SL)</strong> is a practical indicator of propelling efficiency.</Typography></li>
                    <li><Typography>The <strong>Stroke Index (SI)</strong> is considered an index of swimming efficiency. A higher SI indicates a more efficient technique.</Typography></li>
                    <li><Typography>The <strong>IE Ratio</strong> helps monitor the balance between technique and physiology to ensure training goals are met.</Typography></li>
                </ul>
            </Paper>

            <Paper sx={cardStyles}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={2.5}>
                        <TextField label="Distance (m)" type="number" value={distance} onChange={e => setDistance(e.target.value)} fullWidth sx={formInputStyles} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.5}>
                        <TextField label="Time (s)" type="number" value={time} onChange={e => setTime(e.target.value)} fullWidth sx={formInputStyles} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.5}>
                        <TextField label="Stroke Rate (strokes/min)" type="number" value={strokeRate} onChange={e => setStrokeRate(e.target.value)} fullWidth sx={formInputStyles} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.5}>
                        <TextField label="Heart Rate (bpm)" type="number" value={heartRate} onChange={e => setHeartRate(e.target.value)} fullWidth sx={formInputStyles} />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Button 
                          variant="contained" 
                          onClick={calculateMetrics} 
                          fullWidth
                          sx={{
                            p: 1.5,
                            height: '56px',
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
                          Calculate
                        </Button>
                    </Grid>
                </Grid>
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