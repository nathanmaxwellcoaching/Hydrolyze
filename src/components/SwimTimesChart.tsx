import { observer } from 'mobx-react-lite';
import Chart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';
import swimStore from '../store/SwimStore';
import type { Swim, TrendlineStat } from '../store/SwimStore';
import moment from 'moment';
import { useEffect } from 'react';
import { linearRegression, correlationCoefficient } from '../utils/statistics';

// Helper to group swims into series
const groupSwimsIntoSeries = (swims: Swim[]) => {
    const groups: { [key: string]: { name: string, data: any[] } } = {};

    swims.forEach(swim => {
        const gearString = swim.gear.length > 0 ? `(${swim.gear.join(', ')})` : '';
        const groupKey = `${swim.swimmer}-${swim.distance}m-${swim.stroke} ${gearString}`;

        if (!groups[groupKey]) {
            groups[groupKey] = {
                name: groupKey,
                data: [],
            };
        }
        groups[groupKey].data.push([new Date(swim.date).getTime(), swim.duration]);
    });

    // Sort data points within each series by date
    for (const key in groups) {
        groups[key].data.sort((a, b) => a[0] - b[0]);
    }

    return Object.values(groups);
};

const SwimTimesChart = observer(() => {
    const theme = useTheme();
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

                stats.push({
                    name: s.name,
                    equation: `y = ${regression.m.toFixed(2)}x + ${regression.b.toFixed(2)}`,
                    rSquared: rSquared,
                });
            }
        });
        swimStore.setTrendlineStats(stats);
    }, [swimSeries]);

    const seriesWithTrendlines = swimSeries.reduce((acc: any[], s) => {
        acc.push(s); // Add original series

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
                data: [
                    [firstX, trendline(firstXInDays)],
                    [lastX, trendline(lastXInDays)],
                ],
                type: 'line',
                color: theme.palette.primary.light,
            });
        }
        return acc;
    }, []);

    const allDurations = swimStore.filteredSwims.map(s => s.duration);
    const yMax = allDurations.length > 0 ? Math.max(...allDurations) + 1 : 100;
    const yMin = allDurations.length > 0 ? Math.min(...allDurations) - 1 : 0;


    const options = {
        chart: {
            background: 'transparent',
            toolbar: { show: true },
            animations: { enabled: true },
        },
        theme: { mode: 'dark' as const },
        stroke: { curve: 'straight' as const, width: 2 },
        markers: { size: 4 },
        xaxis: {
            type: 'datetime' as const,
            labels: {
                formatter: (_value: string, timestamp?: number) => {
                    return timestamp ? moment(timestamp).format('DD/MM/YY HH:mm') : '';
                },
                style: { colors: theme.palette.text.secondary },
            },
        },
        yaxis: {
            min: yMin < 0 ? 0 : yMin,
            max: yMax,
            title: {
                text: 'Time Swum (MM:SS)',
                style: { color: theme.palette.text.secondary },
            },
            labels: {
                formatter: (val: number) => {
                    const roundedVal = Math.round(val);
                    const minutes = Math.floor(roundedVal / 60).toString().padStart(2, '0');
                    const seconds = (roundedVal % 60).toString().padStart(2, '0');
                    return `${minutes}:${seconds}`;
                },
                style: { colors: theme.palette.text.secondary },
            },
        },
        tooltip: {
            custom: function({ seriesIndex, dataPointIndex, w }: any) {
                if (!w.globals.initialSeries[seriesIndex] || w.globals.initialSeries[seriesIndex].data[dataPointIndex] === undefined) {
                    return '';
                }

                const swimData = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
                const duration = swimData[1];
                const date = moment(swimData[0]).format('DD/MM/YYYY HH:mm');
                const seriesName = w.globals.seriesNames[seriesIndex];

                if (seriesName.includes('Trend')) {
                    return null;
                }

                const minutes = Math.floor(duration / 60).toString().padStart(2, '0');
                const seconds = (duration % 60).toString().padStart(2, '0');

                return `
                    <div style="padding: 10px; background: #2D2D2D; border-radius: 8px; box-shadow: 0 0 15px ${theme.palette.primary.main};">
                        <strong>${seriesName}</strong><br/>
                        <span>Time: ${minutes}:${seconds}</span><br/>
                        <span>Date: ${date}</span>
                    </div>
                `;
            }
        },
        noData: {
            text: 'No swims match the selected filters',
            style: { color: theme.palette.text.secondary, fontSize: '16px' },
        },
        legend: {
            labels: {
                useSeriesColors: true
            }
        },
        annotations: {},
    };

    return <Chart options={options} series={seriesWithTrendlines} type="line" height={400} />;
});

export default SwimTimesChart;