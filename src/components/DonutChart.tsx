import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Paper, Typography, Box, ToggleButtonGroup, ToggleButton } from '@mui/material';

const DonutChart = observer(() => {
  const handleMetricChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMetric: 'records' | 'distance' | null,
  ) => {
    if (newMetric !== null) {
      swimStore.setStrokeDistributionMetric(newMetric);
    }
  };

  return (
    <Paper sx={{ 
        p: 2, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#1A1A1A', 
        color: '#FFFFFF' 
    }}>
        <Typography variant="h6" gutterBottom>Swim Stroke Distribution</Typography>
        <ToggleButtonGroup
          value={swimStore.strokeDistributionMetric}
          exclusive
          onChange={handleMetricChange}
          aria-label="text alignment"
          sx={{ mb: 2 }}
        >
          <ToggleButton value="records" aria-label="records" sx={{ color: '#FFFFFF' }}>
            Records
          </ToggleButton>
          <ToggleButton value="distance" aria-label="distance" sx={{ color: '#FFFFFF' }}>
            Distance
          </ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', height: '100%' }}>
              {/* Placeholder for the chart - actual implementation depends on MUI charts installation */}
              <Typography variant="body2" align="center">
                Chart would be displayed here
              </Typography>
            </div>
        </Box>
    </Paper>
  );
});

export default DonutChart;