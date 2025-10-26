import { useState, useMemo } from 'react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import moment from 'moment';
import { Box, Button, ButtonGroup } from '@mui/material';
import type { StravaSession } from '../store/SwimStore';
import swimStore from '../store/SwimStore';

type TimeGroup = 'day' | 'week' | 'month';

const groupSwimsByTime = (swims: StravaSession[], groupBy: TimeGroup) => {
  const format = groupBy === 'day' ? 'YYYY-MM-DD' : groupBy === 'week' ? 'YYYY-WW' : 'YYYY-MM';
  const groupedData = swims.reduce((acc, swim) => {
    const date = moment(swim.start_date).format(format);
    if (!acc[date]) {
      acc[date] = { distance: 0, sessions: [] };
    }
    acc[date].distance += swim.distance;
    acc[date].sessions.push(swim);
    return acc;
  }, {} as Record<string, { distance: number; sessions: StravaSession[] }>);

  return Object.entries(groupedData)
    .map(([date, data]) => ({
      x: date,
      y: data.distance,
      sessions: data.sessions,
    }))
    .sort((a, b) => moment(a.x).diff(moment(b.x)));
};

const StravaSwimChart = ({ swims }: { swims: StravaSession[] }) => {
  const [timeGroup, setTimeGroup] = useState<TimeGroup>('day');

  const chartData = useMemo(() => groupSwimsByTime(swims, timeGroup), [swims, timeGroup]);

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      background: 'transparent',
      fontFamily: 'JetBrains Mono Nerd Font, monospace',
      events: {
        dataPointSelection: (event, chartContext, config) => {
          const dataPointIndex = config.dataPointIndex;
          const seriesIndex = config.seriesIndex;
          const selectedDataPoint = chartData[dataPointIndex];
          if (selectedDataPoint && selectedDataPoint.sessions.length > 0) {
            // For simplicity, select the first session in the group
            swimStore.openRecordDetailModal(selectedDataPoint.sessions[0]);
          }
        },
      },
    },
    theme: { mode: 'dark' },
    colors: ['var(--color-accent-green)'],
    grid: { borderColor: 'rgba(255, 255, 255, 0.08)' },
    xaxis: {
      categories: chartData.map(d => d.x),
      labels: { style: { colors: 'var(--color-text-secondary)' } },
    },
    yaxis: {
      title: { text: 'Distance (m)', style: { color: 'var(--color-text-secondary)' } },
      labels: { style: { colors: 'var(--color-text-secondary)' } },
    },
    tooltip: { theme: 'dark' },
  };

  const series = [
    {
      name: 'Distance',
      data: chartData.map(d => d.y),
    },
  ];

  return (
    <Box>
      <ButtonGroup variant="outlined" aria-label="outlined button group">
        <Button onClick={() => setTimeGroup('day')} disabled={timeGroup === 'day'}>Day</Button>
        <Button onClick={() => setTimeGroup('week')} disabled={timeGroup === 'week'}>Week</Button>
        <Button onClick={() => setTimeGroup('month')} disabled={timeGroup === 'month'}>Month</Button>
      </ButtonGroup>
      <Chart options={options} series={series} type="bar" height={350} />
    </Box>
  );
};

export default StravaSwimChart;