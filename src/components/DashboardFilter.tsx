import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { FormControl, InputLabel, Select, MenuItem, Paper, Button, Grid } from '@mui/material';

const DashboardFilter = observer(() => {
    const [filters, setFilters] = useState({
        swimmer: '',
        stroke: '',
        distance: '',
        gear: [] as string[],
        poolLength: ''
    });

    const handleApply = () => {
        swimStore.applyFilters({
            swimmer: filters.swimmer || null,
            stroke: filters.stroke || null,
            distance: filters.distance ? parseInt(filters.distance) : null,
            gear: filters.gear.length > 0 ? filters.gear : null,
            poolLength: filters.poolLength ? parseInt(filters.poolLength) : null
        });
    };

    const handleClear = () => {
        setFilters({ swimmer: '', stroke: '', distance: '', gear: [], poolLength: '' });
        swimStore.clearFilters();
    };

    const formInputStyles = {
      '& .MuiInputBase-root': { backgroundColor: '#191919', color: '#FFFFFF', borderRadius: '8px' },
      '& .MuiInputLabel-root': { color: '#a9a9a9', '&.Mui-focused': { color: '#FFFFFF' } },
      '& .MuiOutlinedInput-root': {
        '& fieldset': { borderColor: '#444' },
        '&:hover fieldset': { borderColor: 'var(--color-accent-orange)' },
      },
      '& .MuiSvgIcon-root': { color: '#a9a9a9' },
    };

    return (
        <Paper sx={{ 
          p: 2, 
          mb: 3, 
          background: 'var(--color-background-card-gradient)', 
          borderRadius: '16px', 
          border: '1px solid var(--color-border)' 
        }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small" sx={formInputStyles}>
                        <InputLabel>Swimmer</InputLabel>
                        <Select value={filters.swimmer} label="Swimmer" onChange={e => setFilters({...filters, swimmer: e.target.value})}>
                            <MenuItem value=""><em>Any</em></MenuItem>
                            {swimStore.uniqueSwimmers.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small" sx={formInputStyles}>
                        <InputLabel>Stroke</InputLabel>
                        <Select value={filters.stroke} label="Stroke" onChange={e => setFilters({...filters, stroke: e.target.value})}>
                            <MenuItem value=""><em>Any</em></MenuItem>
                            {swimStore.uniqueStrokes.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small" sx={formInputStyles}>
                        <InputLabel>Distance</InputLabel>
                        <Select value={filters.distance} label="Distance" onChange={e => setFilters({...filters, distance: e.target.value})}>
                            <MenuItem value=""><em>Any</em></MenuItem>
                            {swimStore.uniqueDistances.map(d => <MenuItem key={d} value={d}>{`${d}m`}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small" sx={formInputStyles}>
                        <InputLabel>Gear</InputLabel>
                        <Select<string[]>
                            multiple
                            value={filters.gear}
                            label="Gear"
                            onChange={(e) => setFilters({ ...filters, gear: e.target.value as string[] })}
                            renderValue={(selected) => selected.join(', ')}
                        >
                            {swimStore.uniqueGear.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small" sx={formInputStyles}>
                        <InputLabel>Pool Length</InputLabel>
                        <Select value={filters.poolLength} label="Pool Length" onChange={e => setFilters({...filters, poolLength: e.target.value})}>
                            <MenuItem value=""><em>Any</em></MenuItem>
                            {swimStore.uniquePoolLengths.map(l => <MenuItem key={l} value={l}>{`${l}m`}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item container spacing={1} justifyContent="flex-end" xs={12} md={2}>
                    <Grid item>
                        <Button variant="contained" onClick={handleApply} sx={{ backgroundColor: 'var(--color-accent-orange)', '&:hover': { backgroundColor: '#e04402' } }}>Apply</Button>
                    </Grid>
                    <Grid item>
                        <Button variant="outlined" onClick={handleClear} sx={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-text-secondary)' }}>Clear</Button>
                    </Grid>
                </Grid>
            </Grid>
        </Paper>
    );
});

export default DashboardFilter;