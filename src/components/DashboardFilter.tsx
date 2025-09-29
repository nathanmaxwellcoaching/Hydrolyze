import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { FormControl, InputLabel, Select, MenuItem, Paper, Button } from '@mui/material';
import { Grid } from '@mui/material';
import type { FormControlProps, ButtonProps } from '@mui/material';

const PillFormControl = (props: FormControlProps) => (
    <FormControl {...props} variant="outlined" sx={{ ...props.sx, '& .MuiOutlinedInput-root': { borderRadius: 50 } }} />
);

const PillButton = (props: ButtonProps) => (
    <Button {...props} sx={{ ...props.sx, borderRadius: 50, textTransform: 'none' }} />
);

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

    return (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: '#242424' }}>
            <Grid container spacing={2} alignItems="center">
                <Grid
                    item
                    xs={12}
                    sm={6}
                    md={2}>
                    <PillFormControl fullWidth size="small">
                        <InputLabel>Swimmer</InputLabel>
                        <Select value={filters.swimmer} label="Swimmer" onChange={e => setFilters({...filters, swimmer: e.target.value})}>
                            <MenuItem value=""><em>Any</em></MenuItem>
                            {swimStore.uniqueSwimmers.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                    </PillFormControl>
                </Grid>
                <Grid
                    item
                    xs={12}
                    sm={6}
                    md={2}>
                    <PillFormControl fullWidth size="small">
                        <InputLabel>Stroke</InputLabel>
                        <Select value={filters.stroke} label="Stroke" onChange={e => setFilters({...filters, stroke: e.target.value})}>
                            <MenuItem value=""><em>Any</em></MenuItem>
                            {swimStore.uniqueStrokes.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                    </PillFormControl>
                </Grid>
                <Grid
                    item
                    xs={12}
                    sm={6}
                    md={2}>
                    <PillFormControl fullWidth size="small">
                        <InputLabel>Distance</InputLabel>
                        <Select value={filters.distance} label="Distance" onChange={e => setFilters({...filters, distance: e.target.value})}>
                            <MenuItem value=""><em>Any</em></MenuItem>
                            {swimStore.uniqueDistances.map(d => <MenuItem key={d} value={d}>{`${d}m`}</MenuItem>)}
                        </Select>
                    </PillFormControl>
                </Grid>
                <Grid
                    item
                    xs={12}
                    sm={6}
                    md={2}>
                    <PillFormControl fullWidth size="small">
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
                    </PillFormControl>
                </Grid>
                <Grid
                    item
                    xs={12}
                    sm={6}
                    md={2}>
                    <PillFormControl fullWidth size="small">
                        <InputLabel>Pool Length</InputLabel>
                        <Select value={filters.poolLength} label="Pool Length" onChange={e => setFilters({...filters, poolLength: e.target.value})}>
                            {swimStore.uniquePoolLengths.map(l => <MenuItem key={l} value={l}>{`${l}m`}</MenuItem>)}
                        </Select>
                    </PillFormControl>
                </Grid>
                <Grid
                    item
                    container
                    spacing={1}
                    justifyContent="flex-end"
                    xs={12}
                    md={2}>
                    <Grid item>
                        <PillButton variant="contained" onClick={handleApply}>Apply</PillButton>
                    </Grid>
                    <Grid item>
                        <PillButton variant="outlined" onClick={handleClear}>Clear</PillButton>
                    </Grid>
                </Grid>
            </Grid>
        </Paper>
    );
});

export default DashboardFilter;
