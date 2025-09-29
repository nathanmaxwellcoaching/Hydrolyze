import { observer } from 'mobx-react-lite';
import Chart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';
import swimStore from '../store/SwimStore';
import { Paper, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';

const VelocityDistanceChart = observer(() => {
  const theme = useTheme();

  const handleMetricChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMetric: 'v_swim' | 'stroke_index' | 'ie_ratio' | 'stroke_length' | null,
  ) => {
    if (newMetric !== null) {
      swimStore.setVelocityChartYAxis(newMetric);
    }
  };

  const yAxisTitles = {
    v_swim: 'Velocity (m/s)',
    stroke_index: 'Stroke Index',
    ie_ratio: 'IE Ratio',
    stroke_length: 'Stroke Length',
  };

  const chartTitles = {
    v_swim: 'Velocity vs Distance',
    stroke_index: 'Stroke Index vs Distance',
    ie_ratio: 'IE Ratio vs Distance',
    stroke_length: 'Stroke Length vs Distance',
  };

  const options = {
    chart: {
      background: 'transparent',
      toolbar: { show: true },
    },
    theme: { mode: 'dark' as const },
    xaxis: {
      type: 'category' as const,
      title: {
        text: 'Distance (m)',
        style: { color: theme.palette.text.secondary },
      },
      labels: {
        style: { colors: theme.palette.text.secondary },
      },
    },
    yaxis: {
      title: {
        text: yAxisTitles[swimStore.velocityChartYAxis],
        style: { color: theme.palette.text.secondary },
      },
      labels: {
        style: { colors: theme.palette.text.secondary },
      },
    },
    noData: {
      text: 'No data available for the selected filters.',
      style: { color: theme.palette.text.secondary, fontSize: '16px' },
    },
  };

  const series = [{
    name: yAxisTitles[swimStore.velocityChartYAxis],
    data: swimStore.velocityDistanceData,
  }];

  return (
    <Paper sx={{ p: 2, height: '100%', backgroundColor: '#1A1A1A', color: '#FFFFFF' }}>
      <Typography variant="h6" gutterBottom>{chartTitles[swimStore.velocityChartYAxis]}</Typography>
      <ToggleButtonGroup
        value={swimStore.velocityChartYAxis}
        exclusive
        onChange={handleMetricChange}
        aria-label="y-axis metric"
        sx={{ mb: 2 }}
      >
        <ToggleButton value="v_swim" aria-label="velocity" sx={{ color: '#FFFFFF' }}>
          Velocity
        </ToggleButton>
        <ToggleButton value="stroke_index" aria-label="stroke index" sx={{ color: '#FFFFFF' }}>
          Stroke Index
        </ToggleButton>
        <ToggleButton value="ie_ratio" aria-label="ie ratio" sx={{ color: '#FFFFFF' }}>
          IE Ratio
        </ToggleButton>
        <ToggleButton value="stroke_length" aria-label="stroke length" sx={{ color: '#FFFFFF' }}>
          Stroke Length
        </ToggleButton>
      </ToggleButtonGroup>
      <Chart options={options} series={series} type="bar" height={350} />
    </Paper>
  );
});

export default VelocityDistanceChart;