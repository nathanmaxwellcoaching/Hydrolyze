// SwimTimesChart.tsx
import { observer } from 'mobx-react-lite';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import swimStore from '../store/SwimStore';
import type { Swim } from '../store/SwimStore';
import moment from 'moment';
import { useState, useMemo } from 'react';
import { linearRegression, correlationCoefficient } from '../utils/statistics';

// --- HELPER FUNCTIONS ---

// Original function to group swims for the time-series chart
const groupSwimsIntoSeries = (swims: Swim[]) => {
  const groups: Record<string, { name: string; data: [number, number][] }> = {};
  swims.forEach((swim) => {
    const gearStr = swim.gear.length ? `(${swim.gear.join(', ')})` : '';
    const displayName = swim.swimmerEmail.split('@')[0];
    const seriesKey = `${displayName}-${swim.distance}m-${swim.stroke} ${gearStr}`.trim();
    if (!groups[seriesKey]) groups[seriesKey] = { name: seriesKey, data: [] };
    groups[seriesKey].data.push([new Date(swim.date).getTime(), swim.duration]);
  });
  return Object.entries(groups).map(([key, g]) => {
    g.data.sort((a, b) => a[0] - b[0]);
    return { name: key.length > 45 ? `${key.slice(0, 42)}…` : key, data: g.data };
  });
};

// New versatile function to prepare data for the second chart
const prepareChartData = (swims: Swim[], yMetric: 'SI' | 'IE', xAxis: 'Date' | 'Velocity') => {
    const groups: Record<string, { name: string; data: [number, number, Swim][] }> = {};

    swims.forEach(swim => {
        const yValue = yMetric === 'SI' ? swim.si : swim.ie;
        if (yValue == null) return;

        let xValue: number | null = null;
        if (xAxis === 'Date') {
            xValue = new Date(swim.date).getTime();
        } else if (xAxis === 'Velocity' && swim.velocity != null) {
            xValue = swim.velocity;
        }

        if (xValue !== null) {
            const gearKey = swim.gear.length > 0 ? swim.gear.join(' + ') : 'No Gear';
            const seriesKey = `${swim.stroke} - ${gearKey}`;
            if (!groups[seriesKey]) {
                groups[seriesKey] = { name: seriesKey, data: [] };
            }
            groups[seriesKey].data.push([xValue, yValue, swim]);
        }
    });

    return Object.values(groups).map(group => ({
        ...group,
        type: xAxis === 'Date' ? 'line' : 'scatter',
    }));
};


// --- CHART COMPONENT ---

const SwimTimesChart = observer(() => {
  const { filteredSwims } = swimStore;
  const [yMetric, setYMetric] = useState<'SI' | 'IE'>('SI');
  const [xAxis, setXAxis] = useState<'Date' | 'Velocity'>('Date');
  const [showTrendlines, setShowTrendlines] = useState(false);
  const [showStdDev, setShowStdDev] = useState(false);

  // Memoize data preparations
  const timeSeries = useMemo(() => groupSwimsIntoSeries(filteredSwims), [filteredSwims]);
  const dynamicSeries = useMemo(() => prepareChartData(filteredSwims, yMetric, xAxis), [filteredSwims, yMetric, xAxis]);

  const timeTrendStats = useMemo(() => {
    if (!showTrendlines) return [];
    return timeSeries.map(s => {
      if (s.data.length < 2) return null;
      const data = [...s.data].sort((a, b) => a[0] - b[0]);
      const first = data[0][0];
      const scale = 1000 * 60 * 60 * 24;
      const reg = data.map(d => [(d[0] - first) / scale, d[1]]);
      const r = correlationCoefficient(reg);
      return { name: s.name, rSquared: (r * r).toFixed(2) };
    }).filter((stat): stat is NonNullable<typeof stat> => stat !== null);
  }, [timeSeries, showTrendlines]);

  const stdDevSeries = useMemo(() => {
    if (!showStdDev || !swimStore.averageAndSd) return [];

    const { average, standardDeviation } = swimStore.averageAndSd;
    const upper = average + 2 * standardDeviation;
    const lower = average - 2 * standardDeviation;

    const allDates = timeSeries.flatMap(s => s.data.map(d => d[0]));
    if (allDates.length === 0) return [];

    const firstDate = Math.min(...allDates);
    const lastDate = Math.max(...allDates);

    return [
      {
        name: `+2 SD`,
        data: [[firstDate, upper], [lastDate, upper]],
        type: 'line',
        stroke: { dashArray: 5 },
        color: '#ff0000'
      },
      {
        name: `-2 SD`,
        data: [[firstDate, lower], [lastDate, lower]],
        type: 'line',
        stroke: { dashArray: 5 },
        color: '#ff0000'
      }
    ];
  }, [timeSeries, showStdDev, swimStore.averageAndSd]);

  const augmentedTimeSeries = useMemo(() => {
    const series: any[] = [...timeSeries];
    if (showTrendlines) {
      const trendlines = timeSeries.flatMap(s => {
        if (s.data.length < 2) return [];
        const data = [...s.data].sort((a, b) => a[0] - b[0]);
        const first = data[0][0];
        const scale = 1000 * 60 * 60 * 24;
        const reg = data.map(d => [(d[0] - first) / scale, d[1]]);
        const { m, b } = linearRegression(reg);
        const last = data[data.length - 1][0];
        return {
          name: `${s.name} Trend`,
          data: [[first, b], [last, m * ((last - first) / scale) + b]],
          type: 'line',
          stroke: { dashArray: 5 },
          color: 'var(--color-accent-yellow)'
        };
      });
      series.push(...trendlines);
    }
    if (showStdDev) {
      series.push(...stdDevSeries);
    }
    return series;
  }, [timeSeries, showTrendlines, showStdDev, stdDevSeries]);

  const augmentedDynamicSeries = useMemo(() => {
    if (!showTrendlines) return dynamicSeries;
    return dynamicSeries.reduce((acc: any[], s) => {
      acc.push({ ...s });
      if (s.data.length >= 2) {
        const data = [...s.data].sort((a, b) => a[0] - b[0]);
        const first = data[0][0];
        const scale = xAxis === 'Date' ? 1000 * 60 * 60 * 24 : 1;
        const reg = data.map(d => [(d[0] - first) / scale, d[1]]);
        const { m, b } = linearRegression(reg);
        const last = data[data.length - 1][0];
        acc.push({
          name: `${s.name} Trend`,
          data: [[first, b], [last, m * ((last - first) / scale) + b]],
          type: 'line',
          stroke: { dashArray: 5 },
          color: 'var(--color-accent-yellow)'
        });
      }
      return acc;
    }, []);
  }, [dynamicSeries, showTrendlines, xAxis]);

  const dynamicTrendStats = useMemo(() => {
    if (!showTrendlines) return [];
    return dynamicSeries.map(s => {
      if (s.data.length < 2) return null;
      const data = [...s.data].sort((a, b) => a[0] - b[0]);
      const first = data[0][0];
      const scale = xAxis === 'Date' ? 1000 * 60 * 60 * 24 : 1;
      const reg = data.map(d => [(d[0] - first) / scale, d[1]]);
      const r = correlationCoefficient(reg);
      return { name: s.name, rSquared: (r * r).toFixed(2) };
    }).filter((stat): stat is NonNullable<typeof stat> => stat !== null);
  }, [dynamicSeries, showTrendlines, xAxis]);

  const yMetricText = yMetric === 'SI' ? 'Swim Index (SI)' : 'Efficiency Index (IE)';
  const xAxisText = xAxis === 'Date' ? 'Date' : 'Velocity';
  const dynamicTitle = `${yMetricText} vs. ${xAxisText}`;

  // --- CHART OPTIONS ---

  const commonOptions: ApexOptions = {
    chart: {
      background: 'transparent',
      fontFamily: 'JetBrains Mono Nerd Font, monospace',
      toolbar: { show: true, tools: { download: true, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true }, autoSelected: 'zoom' },
      animations: { enabled: true, speed: 800, animateGradually: { enabled: true, delay: 150 }, dynamicAnimation: { enabled: true, speed: 350 } }
    },
    theme: { mode: 'dark' },
    colors: ['var(--color-accent-green)', 'var(--color-accent-light-blue)', 'var(--color-accent-mint)', 'var(--color-accent-cyan)', 'var(--color-accent-light-lavender)'],
    grid: { borderColor: 'rgba(255, 255, 255, 0.08)', strokeDashArray: 4 },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '12px',
      labels: { colors: 'var(--color-text-light)' },
      itemMargin: { horizontal: 10, vertical: 4 },
    },
    tooltip: { theme: 'dark', x: { format: 'dd MMM yyyy HH:mm' } },
    noData: { text: 'No swims match the selected filters', style: { color: 'var(--color-text-secondary)', fontSize: '18px' } },
  };

  const timeSeriesOptions: ApexOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, id: 'time-series-chart' },
    title: {
      text: 'Swim Duration Over Time',
      align: 'center',
      style: {
        fontSize: '16px',
        color: 'var(--color-text-light)'
      }
    },
    stroke: { curve: 'straight', width: 3 },
    markers: { size: 5, hover: { size: 7 } },
    xaxis: {
      type: 'datetime',
      labels: { formatter: (_, ts) => moment(ts).format('DD MMM'), style: { colors: 'var(--color-text-secondary)' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: { text: 'Time Swum (MM:SS)', style: { color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 500 } },
      labels: {
        formatter: (val) => `${Math.floor(val / 60).toString().padStart(2, '0')}:${(val % 60).toFixed(0).padStart(2, '0')}`,
        style: { colors: 'var(--color-text-secondary)' },
      },
    },
    tooltip: {
      ...commonOptions.tooltip,
      y: { formatter: (val) => `${Math.floor(val / 60).toString().padStart(2, '0')}:${(val % 60).toFixed(1).padStart(4, '0')}` }
    },
  };

  const dynamicChartOptions: ApexOptions = {
    ...commonOptions,
    chart: {
      ...commonOptions.chart,
      id: 'dynamic-chart',
      events: {
        dataPointSelection: (event, chartContext, config) => {
          const dataPointIndex = config.dataPointIndex;
          const seriesIndex = config.seriesIndex;
          const selectedSeries = augmentedDynamicSeries[seriesIndex];
          if (selectedSeries && selectedSeries.data && selectedSeries.data[dataPointIndex]) {
            const swim = selectedSeries.data[dataPointIndex][2] as Swim;
            swimStore.openRecordDetailModal(swim);
          }
        },
      },
    },
    title: {
      text: dynamicTitle,
      align: 'center',
      style: {
        fontSize: '16px',
        color: 'var(--color-text-light)'
      }
    },
    stroke: { curve: 'straight', width: xAxis === 'Date' ? 2 : 0 },
    markers: { size: 5, hover: { size: 7 } },
    xaxis: {
        type: xAxis === 'Date' ? 'datetime' : 'numeric',
        title: { text: xAxis === 'Date' ? 'Date' : 'Velocity (m/s)', style: { color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 500 } },
        labels: {
            style: { colors: 'var(--color-text-secondary)' },
            formatter: (val: string | number) => {
                if (xAxis === 'Date') return moment(val).format('DD MMM');
                return typeof val === 'number' ? val.toFixed(2) : val;
            }
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
    },
    yaxis: {
        title: { text: yMetric === 'SI' ? 'Swim Index (SI m²/stroke)' : 'Efficiency Index (IE)', style: { color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 500 } },
        labels: { style: { colors: 'var(--color-text-secondary)' }, formatter: (val) => val.toFixed(2) },
    },
    tooltip: {
        ...commonOptions.tooltip,
        x: {
            formatter: (val, { dataPointIndex, seriesIndex, w }) => {
                const swim = w.config.series[seriesIndex].data[dataPointIndex][2] as Swim;
                if (xAxis === 'Date') return moment(val).format('DD MMM YYYY');
                return `${Number(val).toFixed(2)} m/s (${moment(swim.date).format('DD MMM YYYY')})`;
            }
        },
        y: { formatter: (val) => val.toFixed(3) }
    },
  };


  return (
    <div>
      <div className="chart-container">
        <Chart options={timeSeriesOptions} series={augmentedTimeSeries} type="line" height={400} />
      </div>

      {dynamicSeries.length > 0 && (
        <div className="mt-4">
            <div className="chart-container">
                <Chart options={dynamicChartOptions} series={augmentedDynamicSeries} type={xAxis === 'Date' ? 'line' : 'scatter'} height={350} />
            </div>
            <div className="flex items-center justify-center space-x-4 mt-4 p-2 bg-gray-800/50 rounded-md">
                <div className="flex items-center space-x-2">
                    <label htmlFor="y-metric-select" className="text-sm text-gray-300">Y-Axis:</label>
                    <select
                        id="y-metric-select"
                        value={yMetric}
                        onChange={(e) => setYMetric(e.target.value as 'SI' | 'IE')}
                        className="form-select block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        <option value="SI">Swim Index (SI)</option>
                        <option value="IE">Efficiency Index (IE)</option>
                    </select>
                </div>
                <div className="flex items-center space-x-2">
                    <label htmlFor="x-axis-select" className="text-sm text-gray-300">X-Axis:</label>
                    <select
                        id="x-axis-select"
                        value={xAxis}
                        onChange={(e) => setXAxis(e.target.value as 'Date' | 'Velocity')}
                        className="form-select block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        <option value="Date">Date</option>
                        <option value="Velocity">Velocity</option>
                    </select>
                </div>
                <div className="flex items-center space-x-2">
                    <label htmlFor="trend-select" className="text-sm text-gray-300">Show Trendlines</label>
                    <input
                        id="trend-select"
                        type="checkbox"
                        checked={showTrendlines}
                        onChange={(e) => setShowTrendlines(e.target.checked)}
                        className="form-checkbox h-4 w-4 text-yellow-600 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <label htmlFor="std-dev-select" className="text-sm text-gray-300">Show 2x Standard Deviation</label>
                    <input
                        id="std-dev-select"
                        type="checkbox"
                        checked={showStdDev}
                        onChange={(e) => setShowStdDev(e.target.checked)}
                        className="form-checkbox h-4 w-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                    />
                </div>
            </div>
        </div>
      )}
      {showTrendlines && (timeTrendStats.length > 0 || dynamicTrendStats.length > 0) && (
        <Accordion defaultExpanded={false} sx={{
          mt: 2,
          backgroundColor: '#242424',
          border: '1px solid #333',
          borderRadius: 2,
          '& .MuiAccordionSummary-root': {
            backgroundColor: 'transparent',
            borderBottom: '1px solid #333',
          },
          '& .MuiAccordionDetails-root': {
            backgroundColor: 'transparent',
          },
          color: 'var(--color-text-light)'
        }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'var(--color-text-secondary)' }} />}>
            <b className="text-lg text-gray-300">Trendline Statistics</b>
          </AccordionSummary>
          <AccordionDetails>
            <h5 className="text-md text-gray-300 mt-2">Swim Duration Over Time</h5>
            <ul className="list-disc pl-5 text-sm text-gray-400">
              {timeTrendStats.map((stat, index) => (
                <li key={index}>{stat.name}: r² = {stat.rSquared}</li>
              ))}
            </ul>
            {dynamicTrendStats.length > 0 && (
              <>
                <h4 className="text-md text-gray-300 mt-2">{dynamicTitle}</h4>
                <ul className="list-disc pl-5 text-sm text-gray-400">
                  {dynamicTrendStats.map((stat, index) => (
                      <li key={index}>{stat.name}: r² = {stat.rSquared}</li>
                    ))}
                  </ul>
                </>
              )}
            </AccordionDetails>
          </Accordion>
        )}
    </div>
  );
});

export default SwimTimesChart;
