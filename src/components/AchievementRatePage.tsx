import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { Box, Typography } from '@mui/material';
import moment from 'moment';

const AchievementRatePage = observer(() => {
  const swimsWithTarget = swimStore.filteredSwims.filter(s => s.targetTime && s.targetTime > 0);

  const series = [
    {
      name: 'Achievement Rate',
      data: swimsWithTarget.map(s => [
        new Date(s.date).getTime(),
        ((s.duration - s.targetTime!) / s.targetTime!) * 100
      ]),
    },
  ];

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
      text: 'Achievement Rate Over Time',
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
      title: { text: 'Difference from Target (%)', style: { color: 'var(--color-text-secondary)' } },
      labels: {
        formatter: (val) => `${val.toFixed(2)}%`,
        style: { colors: 'var(--color-text-secondary)' },
      },
    },
    tooltip: {
      theme: 'dark',
      x: { format: 'dd MMM yyyy' },
      y: { formatter: (val) => `${val.toFixed(2)}%` },
    },
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Achievement Rate</Typography>
      <Chart options={options} series={series} type="line" height={350} />
    </Box>
  );
});

export default AchievementRatePage;
