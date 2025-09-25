import { Paper, Typography, Button, Box } from '@mui/material';

const ActionPanel = () => (
    <Paper sx={{ 
        p: 2, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#1A1A1A', 
        color: '#FFFFFF', 
        textAlign: 'center' 
    }}>
        <Typography variant="h6" gutterBottom>Ready for your next swim?</Typography>
        <Typography sx={{ color: '#B0B0B0', mb: 2 }}>Log a new session or review your progress.</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" color="primary">Log a Swim</Button>
        </Box>
    </Paper>
)

export default ActionPanel;