import { observer } from 'mobx-react-lite';
import Chart from 'react-apexcharts';
import swimStore from '../store/SwimStore';
import type { Swim, TrendlineStat } from '../store/SwimStore';
import moment from 'moment';
import { useEffect } from 'react';
import { linearRegression, correlationCoefficient } from '../utils/statistics';

// Helper to group swims into series (logic is unchanged)
const groupSwimsIntoSeries = (swims: Swim[]) => {
    const groups: { [key: string]: { name: string, data: any[] } } = {};
    swims.forEach(swim => {
        const gearString = swim.gear.length > 0 ? `(${swim.gear.join(', ')})` : '';
        const groupKey = `${swim.swimmer}-${swim.distance}m-${swim.stroke} ${gearString}`.trim();
        if (!groups[groupKey]) {
            groups[groupKey] = { name: groupKey, data: [] };
        }
        groups[groupKey].data.push([new Date(swim.date).getTime(), swim.duration]);
    });
    for (const key in groups) {
        groups[key].data.sort((a, b) => a[0] - b[0]);
    }
    return Object.values(groups);
};

const SwimTimesChart = observer(() => {
    const swimSeries = groupSwimsIntoSeries(swimStore.filteredSwims);

    // Effect for calculating trendline stats (logic is unchanged)
    useEffect(() => {
        const stats: TrendlineStat[] = [];
        swimSeries.forEach(s => {
            if (s.data.length >= 2) {
                const firstTimestamp = s.data[0][0];
                const regressionData = s.data.map(d => [(d[0] - firstTimestamp) / (1000 * 60 * 60 * 24), d[1]]);
                const regression = linearRegression(regressionData);
                const r = correlationCoefficient(regressionData);
                const rSquared = (r * r).toFixed(2);
                stats.push({ name: s.name, equation: `y = ${regression.m.toFixed(2)}x + ${regression.b.toFixed(2)}`, rSquared: rSquared });
            }
        });
        swimStore.setTrendlineStats(stats);
    }, [swimSeries]);

    // Logic for adding trendlines to the series (unchanged)
    const seriesWithTrendlines = swimSeries.reduce((acc: any[], s) => {
        acc.push({ ...s, type: 'line' });

        if (swimStore.showTrendline && s.data.length >= 2) {
            const firstTimestamp = s.data[0][0];
            const regressionData = s.data.map(d => [(d[0] - firstTimestamp) / (1000 * 60 * 60 * 24), d[1]]);
            const { m, b } = linearRegression(regressionData);
            const trendline = (x: number) => m * x + b;
            const firstX = s.data[0][0];
            const lastX = s.data[s.data.length - 1][0];
            const firstXInDays = 0;
            const lastXInDays = (lastX - firstX) / (1000 * 60 * 60 * 24);

            acc.push({
                name: `${s.name} Trend`,
                data: [[firstX, trendline(firstXInDays)], [lastX, trendline(lastXInDays)]],
                type: 'line',
                // Use the new accent yellow for trendlines
                color: 'var(--color-accent-yellow)',
                strokeDashArray: 5,
            });
        }
        return acc;
    }, []);

    const allDurations = swimStore.filteredSwims.map(s => s.duration);
    const yMax = allDurations.length > 0 ? Math.max(...allDurations) + 5 : 100;
    const yMin = allDurations.length > 0 ? Math.min(...allDurations) - 5 : 0;

    // ----------- CHART OPTIONS REDESIGN ----------- //
    const options: any = {
        chart: {
            background: 'transparent',
            toolbar: { show: true, tools: { download: true, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true }, autoSelected: 'zoom' },
            animations: {
                enabled: true,
                easing: 'easeOutExpo', // Smoother easing
                speed: 800,
                animateGradually: { enabled: true, delay: 150 },
                dynamicAnimation: { enabled: true, speed: 350 }
            },
        },
        theme: { mode: 'dark' as const },
        // Using the new, vibrant color palette
        colors: [
            'var(--color-accent-green)', 'var(--color-accent-light-blue)', 'var(--color-accent-mint)', 'var(--color-accent-cyan)', 'var(--color-accent-light-lavender)',
        ],
        stroke: { curve: 'smooth', width: 3 },
        markers: { size: 5, hover: { size: 7 } },
        grid: {
            borderColor: 'rgba(255, 255, 255, 0.08)', // More subtle grid lines
            strokeDashArray: 4,
        },
        xaxis: {
            type: 'datetime' as const,
            labels: {
                formatter: (_value: string, timestamp?: number) => moment(timestamp).format('DD MMM'),
                style: { colors: 'var(--color-text-secondary)' },
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            min: yMin < 0 ? 0 : yMin,
            max: yMax,
            title: {
                text: 'Time Swum (MM:SS)',
                style: { color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 500 },
            },
            labels: {
                formatter: (val: number) => {
                    const roundedVal = Math.round(val);
                    const minutes = Math.floor(roundedVal / 60).toString().padStart(2, '0');
                    const seconds = (roundedVal % 60).toString().padStart(2, '0');
                    return `${minutes}:${seconds}`;
                },
                style: { colors: 'var(--color-text-secondary)' },
            },
        },
        // Redesigned tooltip with glassmorphism effect
        tooltip: {
            theme: 'dark',
            custom: function({ seriesIndex, dataPointIndex, w }: any) {
                if (!w.globals.initialSeries[seriesIndex] || w.globals.initialSeries[seriesIndex].data[dataPointIndex] === undefined) return '';

                const { seriesName } = w.globals.series[seriesIndex];
                if (seriesName.includes('Trend')) return null;

                const swimData = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
                const duration = swimData[1];
                const date = moment(swimData[0]).format('DD MMM YYYY, HH:mm');
                const minutes = Math.floor(duration / 60).toString().padStart(2, '0');
                const seconds = (duration % 60).toFixed(1).padStart(4, '0');
                const color = w.globals.colors[seriesIndex];

                return `
                    <div style="padding: 12px; background: rgba(30, 30, 30, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                            <span style="height: 10px; width: 10px; background-color: ${color}; border-radius: 50%; display: inline-block; margin-right: 8px;"></span>
                            <strong>${seriesName}</strong>
                        </div>
                        <span style="color: var(--color-text-light); font-weight: bold; font-size: 1.2em;">${minutes}:${seconds}</span><br/>
                        <span style="color: var(--color-text-secondary); font-size: 0.9em;">${date}</span>
                    </div>
                `;
            }
        },
        noData: {
            text: 'No swims match the selected filters',
            style: { color: 'var(--color-text-secondary)', fontSize: '18px' },
        },
        legend: {
            labels: { colors: 'var(--color-text-light)' },
            position: 'top',
            horizontalAlign: 'right',
            fontSize: '14px',
            markers: { radius: 12 },
            itemMargin: { horizontal: 15 },
            offsetY: -10,
        },
    };

    return <Chart options={options} series={seriesWithTrendlines} type="line" height={400} />;
});

export default SwimTimesChart;