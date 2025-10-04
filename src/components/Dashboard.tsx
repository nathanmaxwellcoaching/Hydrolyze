import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Box, Typography, Paper, Grid } from '@mui/material';
import SwimTimesChart from './SwimTimesChart';
import TrendlineStats from './TrendlineStats';
import SummaryCard from './SummaryCard';
import DonutChart from './DonutChart';
import ActionPanel from './ActionPanel';
import SwimRecordsTable from './SwimRecordsTable';
import VelocityDistanceChart from './VelocityDistanceChart';
import HorizontalProportionBar from './HorizontalProportionBar';
import { useEffect, useRef } from 'react';
import anime from 'animejs';

// Helper function (no changes needed)
const getAvgPercentDiff = () => {
  const swims = swimStore.filteredSwims.filter(s => s.targetTime && s.targetTime > 0);
  if (!swims.length) return null;
  const sum = swims.reduce((acc, s) => {
    const pct = ((s.duration - s.targetTime!) / s.targetTime!) * 100;
    return acc + pct;
  }, 0);
  return sum / swims.length;
};

const Dashboard = observer(() => {
  const dashboardRef = useRef(null);

  useEffect(() => {
    if (dashboardRef.current) {
      anime({
        targets: '.dashboard-item',
        opacity: [0, 1],
        translateY: [50, 0],
        delay: anime.stagger(100, { start: 200 }),
        easing: 'easeInOutQuad',
        duration: 800,
      });
    }
  }, []);

  let sdSubValue = '';
  if (swimStore.averageAndSd) {
    const { average, standardDeviation, swimCount } = swimStore.averageAndSd;
    const plus2sd = (average + 2 * standardDeviation).toFixed(2);
    const minus2sd = (average - 2 * standardDeviation).toFixed(2);
    sdSubValue = `mean ± 2SDs (${minus2sd} - ${plus2sd})  (${swimCount} swims)`;
  }

  const cardStyles = {
    p: 2,
    height: '100%',
    background: 'var(--color-background-card-gradient)',
    color: 'var(--color-text-primary)',
    borderRadius: '16px',
    border: '1px solid var(--color-border)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  };

  return (
    <Box ref={dashboardRef}>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={6} lg={3} className="dashboard-item">
          <SummaryCard title="Personal Best" value={swimStore.personalBests ? `${swimStore.personalBests.duration}s` : 'N/A'} subValue={swimStore.personalBests ? new Date(swimStore.personalBests.date).toLocaleDateString() : ''} />
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={3} className="dashboard-item">
          <SummaryCard
            title="Achievement Rate"
            value={(() => { const avg = getAvgPercentDiff(); return avg !== null ? `Mean Δ ${avg.toFixed(2)}%` : 'N/A'; })()}
            subValue="Average % Difference"
            customContent={
              swimStore.achievementZoneDistribution && swimStore.achievementZoneDistribution.length > 0 ? (
                <HorizontalProportionBar data={swimStore.achievementZoneDistribution} />
              ) : (
                <Typography variant="body2" color="text.secondary">N/A</Typography>
              )
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={3} className="dashboard-item">
          <SummaryCard title="Avg Time Swum (s)" value={swimStore.averageAndSd ? swimStore.averageAndSd.average : 'N/A'} subValue={swimStore.averageAndSd ? `Based on ${swimStore.averageAndSd.swimCount} swims` : ''} />
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={3} className="dashboard-item">
          <SummaryCard title="Time Swum SD (s)" value={swimStore.averageAndSd ? swimStore.averageAndSd.standardDeviation : 'N/A'} subValue={sdSubValue} />
        </Grid>
      </Grid>

      {/* Visual Charts and Action Panel */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {swimStore.showSwimTimesChart && (
          <Grid item xs={12} md={8} className="dashboard-item">
            <Paper sx={cardStyles}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Lap Times ({swimStore.filterContext})</Typography>
              <SwimTimesChart />
            </Paper>
          </Grid>
        )}
        <Grid item xs={12} md={swimStore.showSwimTimesChart ? 4 : 12} className="dashboard-item">
          {swimStore.showDonutChart && <DonutChart />} 
        </Grid>
      </Grid>

      {swimStore.showVelocityDistanceChart && (
        <Grid item xs={12} sx={{ mb: 3 }} className="dashboard-item">
          <VelocityDistanceChart />
        </Grid>
      )}

      {swimStore.showTrendlineDetails && (
        <Grid item xs={12} sx={{ mb: 3 }} className="dashboard-item">
          <TrendlineStats />
        </Grid>
      )} 

      {/* Data Tables */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8} className="dashboard-item">
          <SwimRecordsTable />
        </Grid>
        <Grid item xs={12} md={4} className="dashboard-item">
          <ActionPanel />
        </Grid>
      </Grid>
    </Box>
  );
});

export default Dashboard;