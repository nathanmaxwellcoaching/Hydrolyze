import { Paper, Typography, Box } from '@mui/material';
import Chart from 'react-apexcharts';
import { observer } from 'mobx-react-lite';

interface HrZoneDonutChartProps {
  data: { name: string; value: number; color: string }[];
}

const HrZoneDonutChart = observer(({ data }: HrZoneDonutChartProps) => {
  const series = data.map(d => d.value);
  const labels = data.map(d => d.name);
  const colors = data.map(d => d.color);

  const options = {
    chart: {
      type: 'donut' as const,
      background: 'transparent',
    },
    labels,
    colors,
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
        <Typography variant="h6" gutterBottom>HR Zone Distribution</Typography>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            {series.length > 0 ? (
              <Chart options={options} series={series} type="donut" width="100%" />
            ) : (
              <Typography variant="body2" align="center">
                No HR zone data to display.
              </Typography>
            )}
        </Box>
    </Paper>
  );
});

export default HrZoneDonutChart;
