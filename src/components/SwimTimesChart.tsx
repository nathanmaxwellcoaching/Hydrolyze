// SwimTimesChart.tsx
import { observer } from 'mobx-react-lite';
import Chart from 'react-apexcharts';
import swimStore from '../store/SwimStore';
import type { Swim, TrendlineStat } from '../store/SwimStore';
import moment from 'moment';
import { useEffect } from 'react';
import { linearRegression, correlationCoefficient } from '../utils/statistics';

const groupSwimsIntoSeries = (swims: Swim[]) => {
  const groups: Record<string, { name: string; data: [number, number][] }> = {};
  swims.forEach((swim) => {
    const gearStr = swim.gear.length ? `(${swim.gear.join(', ')})` : '';
    const displayName = swim.swimmer || swim.swimmerEmail.split('@')[0];
    const seriesKey = `${displayName}-${swim.distance}m-${swim.stroke} ${gearStr}`.trim();
    if (!groups[seriesKey]) groups[seriesKey] = { name: seriesKey, data: [] };
    groups[seriesKey].data.push([new Date(swim.date).getTime(), swim.duration]);
  });
  return Object.entries(groups).map(([key, g]) => {
    g.data.sort((a, b) => a[0] - b[0]);
    return { name: key.length > 45 ? `${key.slice(0, 42)}…` : key, data: g.data };
  });
};

const SwimTimesChart = observer(() => {
  const swimSeries = groupSwimsIntoSeries(swimStore.filteredSwims);
  useEffect(() => {
    const stats: TrendlineStat[] = [];
    swimSeries.forEach((s) => {
      if (s.data.length >= 2) {
        const first = s.data[0][0];
        const reg = s.data.map((d) => [(d[0] - first) / (1000 * 60 * 60 * 24), d[1]]);
        const { m, b } = linearRegression(reg);
        const r = correlationCoefficient(reg);
        stats.push({ name: s.name, equation: `y = ${m.toFixed(2)}x + ${b.toFixed(2)}`, rSquared: (r * r).toFixed(2) });
      }
    });
    swimStore.setTrendlineStats(stats);
  }, [swimSeries]);

  const seriesWithTrendlines = swimSeries.reduce((acc: any[], s) => {
    acc.push({ ...s, type: 'line' });
    if (swimStore.showTrendline && s.data.length >= 2) {
      const first = s.data[0][0];
      const reg = s.data.map((d) => [(d[0] - first) / (1000 * 60 * 60 * 24), d[1]]);
      const { m, b } = linearRegression(reg);
      const last = s.data[s.data.length - 1][0];
      acc.push({
        name: `${s.name} Trend`,
        data: [[first, b], [last, m * ((last - first) / (1000 * 60 * 60 * 24)) + b]],
        type: 'line',
        color: 'var(--color-accent-yellow)',
        strokeDashArray: 5,
      });
    }
    return acc;
  }, []);

  const all = swimStore.filteredSwims.map((s) => s.duration);
  const yMax = all.length ? Math.max(...all) + 5 : 100;
  const yMin = all.length ? Math.min(...all) - 5 : 0;

  const options: ApexCharts.ApexOptions = {
    chart: {
      background: 'transparent',
      toolbar: { show: true, tools: { download: true, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true }, autoSelected: 'zoom' },
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: { enabled: true, delay: 150 },
        dynamicAnimation: { enabled: true, speed: 350 },
      },
    },
    theme: { mode: 'dark' },
    colors: ['var(--color-accent-green)', 'var(--color-accent-light-blue)', 'var(--color-accent-mint)', 'var(--color-accent-cyan)', 'var(--color-accent-light-lavender)'],
    stroke: { curve: 'smooth', width: 3 },
    markers: { size: 5, hover: { size: 7 } },
    grid: { borderColor: 'rgba(255, 255, 255, 0.08)', strokeDashArray: 4 },
    xaxis: {
      type: 'datetime',
      labels: { formatter: (_: string, ts?: number) => moment(ts).format('DD MMM'), style: { colors: 'var(--color-text-secondary)' } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: {
      min: yMin < 0 ? 0 : yMin, max: yMax,
      title: { text: 'Time Swum (MM:SS)', style: { color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 500 } },
      labels: {
        formatter: (val: number) => {
          const m = Math.floor(val / 60).toString().padStart(2, '0');
          const s = (val % 60).toFixed(0).padStart(2, '0');
          return `${m}:${s}`;
        }, style: { colors: 'var(--color-text-secondary)' },
      },
    },
    legend: { position: 'bottom', horizontalAlign: 'center', fontSize: '12px', labels: { colors: 'var(--color-text-light)' }, itemMargin: { horizontal: 10, vertical: 4 } },
    tooltip: {
      theme: 'dark',
      custom: ({ seriesIndex, dataPointIndex, w }: any) => {
        const name = w.globals.series[seriesIndex];
        if (name.includes('Trend')) return '';
        const [x, y] = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
        const mins = Math.floor(y / 60).toString().padStart(2, '0');
        const secs = (y % 60).toFixed(1).padStart(4, '0');
        const color = w.globals.colors[seriesIndex];
        return `
          <div style="padding:12px;background:rgba(30,30,30,.7);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.1);border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.2)">
            <div style="display:flex;align-items:center;margin-bottom:8px"><span style="height:10px;width:10px;background:${color};border-radius:50%;display:inline-block;margin-right:8px"></span><strong>${name}</strong></div>
            <span style="color:var(--color-text-light);font-weight:bold;font-size:1.2em">${mins}:${secs}</span><br/>
            <span style="color:var(--color-text-secondary);font-size:.9em">${moment(x).format('DD MMM YYYY, HH:mm')}</span>
          </div>`;
      },
    },
    noData: { text: 'No swims match the selected filters', style: { color: 'var(--color-text-secondary)', fontSize: '18px' } },
  };

  return <Chart options={options} series={seriesWithTrendlines} type="line" height={400} />;
});

export default SwimTimesChart;