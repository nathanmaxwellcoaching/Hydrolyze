import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Grid, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';

const DashboardFilter = observer(() => {
  const handleFilterChange = (filterName: string, value: any) => {
    const processedValue = value === 'Any' ? null : value;
    swimStore.applyFilters({ [filterName]: processedValue });
  };

  return (
    <Grid container spacing={2} sx={{ mb: 4 }} className="dashboard-item">
      {/* Swimmer Filter */}
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <FormControl fullWidth size="small">
          <InputLabel>Swimmer</InputLabel>
          <Select
            value={swimStore.activeFilters.swimmer || 'Any'}
            label="Swimmer"
            onChange={(e: SelectChangeEvent) => handleFilterChange('swimmer', e.target.value)}
          >
            <MenuItem value="Any">Any</MenuItem>
            {swimStore.uniqueSwimmers.map(swimmer => (
              <MenuItem key={swimmer} value={swimmer}>{swimmer}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Stroke Filter */}
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <FormControl fullWidth size="small">
          <InputLabel>Stroke</InputLabel>
          <Select
            value={swimStore.activeFilters.stroke || 'Any'}
            label="Stroke"
            onChange={(e: SelectChangeEvent) => handleFilterChange('stroke', e.target.value)}
          >
            <MenuItem value="Any">Any</MenuItem>
            {swimStore.uniqueStrokes.map(stroke => (
              <MenuItem key={stroke} value={stroke}>{stroke}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Distance Filter */}
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <FormControl fullWidth size="small">
          <InputLabel>Distance</InputLabel>
          <Select
            value={swimStore.activeFilters.distance || 'Any'}
            label="Distance"
            onChange={(e: SelectChangeEvent<number>) => handleFilterChange('distance', e.target.value)}
          >
            <MenuItem value="Any">Any</MenuItem>
            {swimStore.uniqueDistances.map(distance => (
              <MenuItem key={distance} value={distance}>{distance}m</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Pace Distance Filter */}
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <FormControl fullWidth size="small">
          <InputLabel>Pace Distance</InputLabel>
          <Select
            value={swimStore.activeFilters.paceDistance || 'Any'}
            label="Pace Distance"
            onChange={(e: SelectChangeEvent) => handleFilterChange('paceDistance', e.target.value)}
          >
            <MenuItem value="Any">Any</MenuItem>
            {swimStore.uniquePaceDistances.map(pd => (
              <MenuItem key={pd} value={pd}>{pd}m</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Pool Length Filter */}
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <FormControl fullWidth size="small">
          <InputLabel>Pool Length</InputLabel>
          <Select
            value={swimStore.activeFilters.poolLength || 'Any'}
            label="Pool Length"
            onChange={(e: SelectChangeEvent<number>) => handleFilterChange('poolLength', e.target.value)}
          >
            <MenuItem value="Any">Any</MenuItem>
            {swimStore.uniquePoolLengths.map(length => (
              <MenuItem key={length} value={length}>{length}m</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
});

export default DashboardFilter;
