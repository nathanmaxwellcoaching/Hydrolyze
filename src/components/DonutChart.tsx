import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Paper, Typography, Box, ToggleButtonGroup, ToggleButton } from '@mui/material';
import Chart from 'react-apexcharts';

const DonutChart = observer(() => {
  const handleMetricChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMetric: 'records' | 'distance' | null,
  ) => {
    if (newMetric !== null) {
      swimStore.setStrokeDistributionMetric(newMetric);
    }
  };

  const chartData = swimStore.strokeDistribution;
  const series = chartData.map(d => d.value);
  const labels = chartData.map(d => d.name);

  const options = {
    chart: {
      type: 'donut' as const,
      background: 'transparent',
    },
    labels,
    theme: {
      mode: 'dark' as const,
      palette: 'palette1' as const,
    },
    legend: {
      position: 'bottom' as const,
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
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
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            {series.length > 0 ? (
              <Chart options={options} series={series} type="donut" width="100%" />
            ) : (
              <Typography variant="body2" align="center">
                No data to display for the selected filters.
              </Typography>
            )}
        </Box>
    </Paper>
  );
});

export default DonutChart;