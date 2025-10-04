
import { observer } from 'mobx-react-lite';
import Chart from 'react-apexcharts';
import swimStore from '../store/SwimStore';
import type { Swim, TrendlineStat } from '../store/SwimStore';
import moment from 'moment';
import { useEffect } from 'react';
import { linearRegression, correlationCoefficient } from '../utils/statistics';

// Helper to group swims into series (no changes needed here)
const groupSwimsIntoSeries = (swims: Swim[]) => {
    const groups: { [key: string]: { name: string, data: any[] } } = {};
    swims.forEach(swim => {
        const gearString = swim.gear.length > 0 ? `(${swim.gear.join(', ')})` : '';
        const groupKey = `${swim.swimmer}-${swim.distance}m-${swim.stroke} ${gearString}`;
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

    const seriesWithTrendlines = swimSeries.reduce((acc: any[], s) => {
        acc.push({ ...s, type: 'line' }); // Specify type for original series

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
                color: 'var(--color-accent-yellow)', // Style trendline
                strokeDashArray: 5,
            });
        }
        return acc;
    }, []);

    const allDurations = swimStore.filteredSwims.map(s => s.duration);
    const yMax = allDurations.length > 0 ? Math.max(...allDurations) + 5 : 100;
    const yMin = allDurations.length > 0 ? Math.min(...allDurations) - 5 : 0;

    const options: any = {
        chart: {
            background: 'transparent',
            toolbar: { show: true, tools: { download: false } },
            animations: { 
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            },
        },
        theme: { mode: 'dark' as const },
        colors: ['#FC4C02', '#16EC06', '#FFDE00', '#00B2FF', '#FF0100'], // Strava, Green, Yellow, Blue, Red
        stroke: { curve: 'smooth', width: 3 },
        markers: { size: 5 },
        grid: {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            strokeDashArray: 3,
        },
        xaxis: {
            type: 'datetime' as const,
            labels: {
                formatter: (_value: string, timestamp?: number) => moment(timestamp).format('DD MMM'),
                style: { colors: 'var(--color-text-secondary)' },
            },
            axisBorder: { show: false },
            axisTicks: { color: 'rgba(255, 255, 255, 0.1)' },
        },
        yaxis: {
            min: yMin < 0 ? 0 : yMin,
            max: yMax,
            title: {
                text: 'Time Swum (MM:SS)',
                style: { color: 'var(--color-text-secondary)', fontSize: '12px' },
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

                return `
                    <div style="padding: 10px; background: #191919; border: 1px solid var(--color-border); border-radius: 8px;">
                        <strong>${seriesName}</strong><br/>
                        <span style="color: var(--color-text-primary); font-weight: bold; font-size: 1.1em;">${minutes}:${seconds}</span><br/>
                        <span style="color: var(--color-text-secondary); font-size: 0.9em;">${date}</span>
                    </div>
                `;
            }
        },
        noData: {
            text: 'No swims match the selected filters',
            style: { color: 'var(--color-text-secondary)', fontSize: '16px' },
        },
        legend: {
            labels: { colors: 'var(--color-text-secondary)' },
            position: 'top',
            horizontalAlign: 'right',
            markers: { radius: 12 },
            itemMargin: { horizontal: 10 },
        },
    };

    return <Chart options={options} series={seriesWithTrendlines} type="line" height={400} />;
});

export default SwimTimesChart;
