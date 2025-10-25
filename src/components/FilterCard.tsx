import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem, Button, Box } from '@mui/material';
import { useEffect } from 'react';

const FilterCard = observer(() => {
  useEffect(() => {
    if (swimStore.currentUser?.isAdmin) {
      swimStore.loadUsers();
    }
  }, [swimStore.currentUser?.isAdmin]);

  return (
    <Card sx={{ backgroundColor: '#1A1A1A', color: '#FFFFFF', mt: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Filter Swims</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
          {swimStore.currentUser?.isAdmin && (
            <>
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#B0B0B0' }}>Swimmer (Email)</InputLabel>
              <Select
                value={swimStore.activeFilters.swimmerEmail || ''}
                sx={{ color: '#FFFFFF', '& .MuiSvgIcon-root': { color: '#B0B0B0' } }}
                onChange={(e) => swimStore.applyFilters({ swimmerEmail: e.target.value as string })}
              >
                <MenuItem value=""><em>All</em></MenuItem>
                {swimStore.users.map((user) => (
                  <MenuItem key={user.id} value={user.email}>{user.name} ({user.email})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
          )}
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#B0B0B0' }}>Distance</InputLabel>
            <Select
              value={swimStore.activeFilters.distance || ''}
              sx={{ color: '#FFFFFF', '& .MuiSvgIcon-root': { color: '#B0B0B0' } }}
              onChange={(e) => swimStore.applyFilters({ distance: e.target.value as number })}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {swimStore.uniqueDistances.map((distance) => (
                <MenuItem key={distance} value={distance}>{distance}m</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#B0B0B0' }}>Stroke</InputLabel>
            <Select
              value={swimStore.activeFilters.stroke || ''}
              sx={{ color: '#FFFFFF', '& .MuiSvgIcon-root': { color: '#B0B0B0' } }}
              onChange={(e) => swimStore.applyFilters({ stroke: e.target.value as string })}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {swimStore.uniqueStrokes.map((stroke) => (
                <MenuItem key={stroke} value={stroke}>{stroke}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#B0B0B0' }}>Gear</InputLabel>
            <Select
              multiple
              value={swimStore.activeFilters.gear || []}
              sx={{ color: '#FFFFFF', '& .MuiSvgIcon-root': { color: '#B0B0B0' } }}
              onChange={(e) => swimStore.applyFilters({ gear: e.target.value as string[] })}
            >
              {swimStore.uniqueGear.map((gear) => (
                <MenuItem key={gear} value={gear}>{gear}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#B0B0B0' }}>Pool Length</InputLabel>
            <Select
              value={swimStore.activeFilters.poolLength || ''}
              sx={{ color: '#FFFFFF', '& .MuiSvgIcon-root': { color: '#B0B0B0' } }}
              onChange={(e) => swimStore.applyFilters({ poolLength: e.target.value as number })}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {swimStore.uniquePoolLengths.map((length) => (
                <MenuItem key={length} value={length}>{length}m</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#B0B0B0' }}>Pace Distance</InputLabel>
            <Select
                value={swimStore.activeFilters.paceDistance || 'Any'}
                label="Pace Distance"
                onChange={(e) => swimStore.applyFilters({ paceDistance: e.target.value === 'Any' ? null : e.target.value })}
            >
                <MenuItem value="Any">Any</MenuItem>
                {(swimStore.activeFilters.distance
                  ? swimStore.uniquePaceDistances.filter(pd => pd && parseInt(pd, 10) >= swimStore.activeFilters.distance!)
                  : swimStore.uniquePaceDistances).map(pd => (
                    <MenuItem key={pd} value={pd}>{pd}m</MenuItem>
                ))}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => swimStore.clearFilters()} sx={{ color: '#B0B0B0' }}>Clear</Button>
        </Box>
      </CardContent>
    </Card>
  );
});

export default FilterCard;