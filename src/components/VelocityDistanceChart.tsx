
import { observer } from 'mobx-react-lite';
import Chart from 'react-apexcharts';
import swimStore from '../store/SwimStore';
import { Paper, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useEffect, useRef } from 'react';
import anime from 'animejs';

// Color palette for dynamic series
const seriesColors = ['#71EB4B', '#70A6EB', '#EB4B71', '#EBEB4B', '#A64BEB', '#4BEBEB'];

const VelocityDistanceChart = observer(() => {
  const chartRef = useRef(null);

  // Animate chart on data change
  useEffect(() => {
    if (chartRef.current) {
      anime({
        targets: chartRef.current,
        opacity: [0, 1],
        duration: 800,
        easing: 'easeOutExpo',
      });
    }
  }, [swimStore.velocityDistanceData]);

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
    stroke_length: 'Stroke Length (m)',
  };

  const chartTitles = {
    v_swim: 'Velocity vs. Distance',
    stroke_index: 'Stroke Index vs. Distance',
    ie_ratio: 'IE Ratio vs. Distance',
    stroke_length: 'Stroke Length vs. Distance',
  };

  // The data from the store is already in the correct series format
  const series = swimStore.velocityDistanceData;

  const options: any = {
    chart: {
      background: 'transparent',
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeout', speed: 800 },
    },
    theme: { mode: 'dark' as const },
    // Assign colors dynamically based on the number of series
    colors: series.map((_, index) => seriesColors[index % seriesColors.length]),
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 4,
        columnWidth: '55%',
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    grid: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      strokeDashArray: 3,
    },
    legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'left',
        labels: { colors: 'var(--color-text-secondary)' },
        itemMargin: { horizontal: 10, vertical: 5 },
    },
    xaxis: {
      type: 'category' as const,
      title: {
        text: 'Distance (m)',
        style: { color: 'var(--color-text-secondary)', fontSize: '12px' },
      },
      labels: {
        style: { colors: 'var(--color-text-secondary)' },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: {
        text: yAxisTitles[swimStore.velocityChartYAxis],
        style: { color: 'var(--color-text-secondary)', fontSize: '12px' },
      },
      labels: {
        style: { colors: 'var(--color-text-secondary)' },
      },
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val: number) => val.toFixed(2)
      }
    },
    noData: {
      text: 'No data available for the selected filters.',
      style: { color: 'var(--color-text-secondary)', fontSize: '16px' },
    },
  };

  return (
    <Paper sx={{ 
      p: 2, 
      height: '100%', 
      background: 'var(--color-background-card-gradient)', 
      color: 'var(--color-text-primary)',
      borderRadius: '16px',
      border: '1px solid var(--color-border)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>{chartTitles[swimStore.velocityChartYAxis]}</Typography>
      <ToggleButtonGroup
        value={swimStore.velocityChartYAxis}
        exclusive
        onChange={handleMetricChange}
        aria-label="y-axis metric"
        sx={{ 
          mb: 2,
          '& .MuiToggleButton-root': {
            color: 'var(--color-text-secondary)',
            border: '1px solid rgba(255, 255, 255, 0.23)',
            textTransform: 'none',
            '&.Mui-selected': {
              color: 'var(--color-text-primary)',
              backgroundColor: 'var(--color-accent-orange)',
              fontWeight: 'bold',
              border: '1px solid var(--color-accent-orange)',
              '&:hover': {
                backgroundColor: '#e04402',
              }
            },
            '&:hover': {
              backgroundColor: 'rgba(252, 76, 2, 0.1)',
            }
          }
        }}
      >
        <ToggleButton value="v_swim" aria-label="velocity">Velocity</ToggleButton>
        <ToggleButton value="stroke_index" aria-label="stroke index">Stroke Index</ToggleButton>
        <ToggleButton value="ie_ratio" aria-label="ie ratio">IE Ratio</ToggleButton>
        <ToggleButton value="stroke_length" aria-label="stroke length">Stroke Length</ToggleButton>
      </ToggleButtonGroup>
      <div ref={chartRef}>
        <Chart options={options} series={series} type="bar" height={350} />
      </div>
    </Paper>
  );
});

export default VelocityDistanceChart;
