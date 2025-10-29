import { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Box, Typography, IconButton, Collapse, TextField, Select, MenuItem, InputLabel, FormControl, OutlinedInput, Checkbox, ListItemText, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useMediaQuery, useTheme, Stack, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import anime from 'animejs';
import { type GoalTime } from '../store/SwimStore';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAuth } from '../contexts/AuthContext';

const strokes = ["Freestyle", "Backstroke", "Breaststroke", "Butterfly"];
const gearOptions = ["Pull Buoy", "Fins", "Paddles", "Snorkel", "NoGear"];



const getColumnValue = (record: GoalTime, column: keyof GoalTime) => {
    switch (column) {
        case 'swimmerName':
            return record.swimmerName;
        case 'gear':
            return record.gear;
        case 'poolLength':
            return `${record.poolLength}m`;
        case 'time':
            const totalSeconds = parseFloat(record.time as any);
            if (isNaN(totalSeconds)) {
                return '00:00.00';
            }
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            return `${minutes.toString().padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`;
        default:
            return String(record[column]);
    }
};

const GoalTimes = observer(() => {
    const { userProfile } = useAuth();



    const cardStyles = { p: 2, background: 'var(--color-background-card-gradient)', color: 'var(--color-text-primary)', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)' };
    const formInputStyles = { my: 1, '& .MuiInputBase-root': { backgroundColor: '#191919', color: '#FFFFFF', borderRadius: '8px' }, '& .MuiInputLabel-root': { color: '#a9a9a9' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#444' }, '&:hover fieldset': { borderColor: 'var(--color-accent-orange)' } }, '& .MuiSvgIcon-root': { color: '#a9a9a9' } };
    const editFieldSx = { '& .MuiInputBase-input': { color: 'var(--color-text-primary)' }, '& .MuiInput-underline:before': { borderBottomColor: 'var(--color-text-secondary)' } };

        const theme = useTheme();

        const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    

        return (

                        <Box ref={pageRef} sx={{ opacity: 0 }}>

                            <Paper sx={cardStyles}>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>

                                    <Typography variant="h6" fontWeight="bold">Manage Goal Times</Typography>

                                </Box>

                </Paper>

            </Box>

        );

    
});

export default GoalTimes;
