import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import moment from 'moment';

const StandardDeviationPage = observer(() => {
  const chartData = swimStore.sdChartData;

  const handleMetricChange = (event: any) => {
    swimStore.setSdChartYAxis(event.target.value);
  };

  const options: ApexOptions = {
    chart: {
      type: 'line',
      height: 350,
      background: 'transparent',
      fontFamily: 'JetBrains Mono Nerd Font, monospace',
    },
    theme: { mode: 'dark' },
    colors: ['var(--color-accent-green)'],
    grid: { borderColor: 'rgba(255, 255, 255, 0.08)', strokeDashArray: 4 },
    title: {
      text: 'Standard Deviation Over Time',
      align: 'center',
      style: {
        fontSize: '16px',
        color: 'var(--color-text-light)'
      }
    },
    xaxis: {
      type: 'datetime',
      labels: { formatter: (_, ts) => moment(ts).format('DD MMM'), style: { colors: 'var(--color-text-secondary)' } },
    },
    yaxis: {
      title: { text: swimStore.sdChartYAxis, style: { color: 'var(--color-text-secondary)' } },
      labels: {
        formatter: (val) => val.toFixed(2),
        style: { colors: 'var(--color-text-secondary)' },
      },
      min: chartData?.lower2SD,
    },
    tooltip: {
      theme: 'dark',
      x: { format: 'dd MMM yyyy' },
      y: { formatter: (val) => val.toFixed(2) },
    },
    annotations: {
      yaxis: [
        {
          y: chartData?.mean,
          borderColor: '#00E396',
          label: {
            borderColor: '#00E396',
            style: {
              color: '#fff',
              background: '#00E396'
            },
            text: `Mean: ${chartData?.mean.toFixed(2)}`
          }
        },
        {
          y: chartData?.upper2SD,
          borderColor: '#FF4560',
          label: {
            borderColor: '#FF4560',
            style: {
              color: '#fff',
              background: '#FF4560'
            },
            text: `+2 SD: ${chartData?.upper2SD.toFixed(2)}`
          }
        },
        {
          y: chartData?.lower2SD,
          borderColor: '#FF4560',
          label: {
            borderColor: '#FF4560',
            style: {
              color: '#fff',
              background: '#FF4560'
            },
            text: `-2 SD: ${chartData?.lower2SD.toFixed(2)}`
          }
        }
      ]
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Standard Deviation</Typography>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Metric</InputLabel>
        <Select
          value={swimStore.sdChartYAxis}
          onChange={handleMetricChange}
        >
          <MenuItem value="si">Swim Index</MenuItem>
          <MenuItem value="velocity">Velocity</MenuItem>
          <MenuItem value="ie">IE</MenuItem>
          <MenuItem value="averageStrokeRate">Average Stroke Rate</MenuItem>
          <MenuItem value="sl">Stroke Length</MenuItem>
          <MenuItem value="duration">Time Swum</MenuItem>
        </Select>
      </FormControl>
      {chartData && <Chart options={options} series={chartData.series} type="line" height={350} />}
    </Box>
  );
});

export default StandardDeviationPage;
