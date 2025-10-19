import { Paper, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';

const ActionPanel = () => (
    <Paper sx={{
        p: 3, // Use consistent padding
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-background-card)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37)',
        textAlign: 'center',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
        }
    }}>
        <Typography variant="h5" gutterBottom>Ready for your next swim?</Typography>
        <Typography sx={{ color: 'var(--color-text-secondary)', mb: 2 }}>Log a new session or review your progress.</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
            <Link to="/log">
                <Button variant="contained" sx={{ backgroundColor: 'var(--color-cta-primary)', '&:hover': { backgroundColor: 'var(--color-cta-primary-hover)' } }}>Log a Swim</Button>
            </Link>
        </Box>
    </Paper>
)

export default ActionPanel;