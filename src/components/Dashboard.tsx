
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Box, Typography, Paper, Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
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

// Helper function remains unchanged as it deals with logic, not presentation.
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

  // Staggered animation for all dashboard items on load.
  useEffect(() => {
    if (dashboardRef.current) {
      anime({
        targets: '.dashboard-item',
        opacity: [0, 1],
        translateY: [30, 0], // Slightly increased distance for a more noticeable effect
        delay: anime.stagger(100, { start: 100 }),
        easing: 'easeOutExpo', // A smoother, more modern easing function
        duration: 900,
      });
    }
  }, []);

  // Sub-value calculation for the SD card, logic unchanged.
  let sdSubValue = '';
  if (swimStore.averageAndSd) {
    const { average, standardDeviation, swimCount } = swimStore.averageAndSd;
    const plus2sd = (average + 2 * standardDeviation).toFixed(2);
    const minus2sd = (average - 2 * standardDeviation).toFixed(2);
    sdSubValue = `mean ± 2SDs (${minus2sd} - ${plus2sd}) | ${swimCount} swims`;
  }

  // Card styles for chart containers, updated for a more subtle look.
  const cardStyles = {
    p: { xs: 2, sm: 3 }, // Responsive padding
    height: '100%',
    backgroundColor: 'var(--color-background-card)',
    color: 'var(--color-text-light)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    // Using a different accent color for variety.
    borderTop: '3px solid var(--color-accent-light-blue)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 0 25px -10px var(--color-accent-light-blue)',
    }
  };

  return (
    // Added padding to the main container for better spacing on all screen sizes.
    <Box ref={dashboardRef} sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Section 1: Key Metric Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3} className="dashboard-item">
          <SummaryCard title="Personal Best" value={swimStore.personalBests ? `${swimStore.personalBests.duration}s` : 'N/A'} subValue={swimStore.personalBests ? new Date(swimStore.personalBests.date).toLocaleDateString() : '-'} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3} className="dashboard-item">
          <SummaryCard
            title="Achievement Rate"
            value={(() => { const avg = getAvgPercentDiff(); return avg !== null ? `Mean Δ ${avg.toFixed(2)}%` : 'N/A'; })()}
            subValue="vs. Target Time"
            customContent={
              swimStore.achievementZoneDistribution && swimStore.achievementZoneDistribution.length > 0 ? (
                <HorizontalProportionBar data={swimStore.achievementZoneDistribution} />
              ) : (
                <Typography variant="body2" sx={{color: 'var(--color-text-secondary)'}}>No target times set</Typography>
              )
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3} className="dashboard-item">
          <SummaryCard title="Avg Time Swum (s)" value={swimStore.averageAndSd ? swimStore.averageAndSd.average : 'N/A'} subValue={swimStore.averageAndSd ? `Based on ${swimStore.averageAndSd.swimCount} swims` : '-'} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3} className="dashboard-item">
          <SummaryCard title="Time Swum SD (s)" value={swimStore.averageAndSd ? swimStore.averageAndSd.standardDeviation : 'N/A'} subValue={sdSubValue} />
        </Grid>
      </Grid>

      {/* Section 2: Visualizations */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {swimStore.showSwimTimesChart && (
          <Grid item xs={12} lg={8} className="dashboard-item">
            <Paper sx={cardStyles}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ background: 'var(--gradient-energetic)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Lap Times ({swimStore.filterContext})
              </Typography>
              <SwimTimesChart />
            </Paper>
          </Grid>
        )}
        {swimStore.showDonutChart && (
          <Grid item xs={12} lg={4} className="dashboard-item">
            <DonutChart />
          </Grid>
        )}
      </Grid>

      {swimStore.showVelocityDistanceChart && (
        <Grid item xs={12} sx={{ mb: 4 }} className="dashboard-item">
          <VelocityDistanceChart />
        </Grid>
      )}

      {swimStore.showTrendlineDetails && (
        <Grid item xs={12} sx={{ mb: 4 }} className="dashboard-item">
          <TrendlineStats />
        </Grid>
      )}

      {/* Section 3: Data Tables & Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8} className="dashboard-item">
          <SwimRecordsTable />
        </Grid>
        <Grid item xs={12} lg={4} className="dashboard-item">
          <ActionPanel />
        </Grid>
      </Grid>
    </Box>
  );
});

export default Dashboard;


