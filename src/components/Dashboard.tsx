import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Box, Typography, Paper, Grid, useMediaQuery, useTheme, Stack, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SwimTimesChart from './SwimTimesChart';
import SummaryCard from './SummaryCard';
import DonutChart from './DonutChart';
import ActionPanel from './ActionPanel';
import SwimRecordsTable from './SwimRecordsTable';
import VelocityDistanceChart from './VelocityDistanceChart';
import HorizontalProportionBar from './HorizontalProportionBar';
import { useEffect, useRef } from 'react';
import anime from 'animejs';
import { Link } from 'react-router-dom';

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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box ref={dashboardRef} sx={{ p: { xs: 2, sm: 3 }, mx: 'auto' }}>
      {isMobile ? (
        <Box sx={{ maxWidth: '420px', mx: 'auto' }}>
          {/* Section 1: Key Metric Summary Cards */}
          <Stack spacing={2} sx={{ mb: 4 }}>
            {/* Personal Best Card */}
            <Paper elevation={3} className="dashboard-item" sx={{ ...cardStyles, borderRadius: 4, p: 2 }}>
              <Typography variant="subtitle1" color="text.secondary">Personal Best</Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ color: 'success.main' }}>
                {swimStore.personalBests ? `${swimStore.personalBests.duration}s` : 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {swimStore.personalBests ? new Date(swimStore.personalBests.date).toLocaleDateString() : '-'}
              </Typography>
            </Paper>

            {/* Achievement Rate Card */}
            <Link to="/achievement-rate" style={{ textDecoration: 'none' }}>
              <Paper elevation={3} className="dashboard-item" sx={{ ...cardStyles, borderRadius: 4, p: 2 }}>
                <Typography variant="subtitle1" color="text.secondary">Achievement Rate</Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'success.main' }}>
                  {(() => { const avg = getAvgPercentDiff(); return avg !== null ? `Mean Δ ${avg.toFixed(2)}%` : 'N/A'; })()}
                </Typography>
                <Typography variant="body2" color="text.secondary">vs. Target Time</Typography>
                {swimStore.achievementZoneDistribution && swimStore.achievementZoneDistribution.length > 0 ? (
                  <HorizontalProportionBar data={swimStore.achievementZoneDistribution} />
                ) : (
                  <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>No target times set</Typography>
                )}
              </Paper>
            </Link>

            {/* Average Time & SD Card (Combined for mobile) */}
            <Link to="/standard-deviation" style={{ textDecoration: 'none' }}>
            <Paper elevation={3} className="dashboard-item" sx={{ ...cardStyles, borderRadius: 4, p: 2 }}>
              <Typography variant="subtitle1" color="text.secondary">Average Time & SD (s)</Typography>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Average</Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'success.main' }}>
                    {swimStore.averageAndSd ? swimStore.averageAndSd.average : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">SD</Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'success.main' }}>
                    {swimStore.averageAndSd ? swimStore.averageAndSd.standardDeviation : 'N/A'}
                  </Typography>
                </Box>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {swimStore.averageAndSd ? `Based on ${swimStore.averageAndSd.swimCount} swims` : '-'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {sdSubValue}
              </Typography>
            </Paper>
            </Link>
          </Stack>

          {/* Section 2: Visualizations */}
          <Stack spacing={2} sx={{ mb: 4 }}>
            {swimStore.showSwimTimesChart && (
              <Accordion elevation={3} className="dashboard-item" sx={{ ...cardStyles, borderRadius: 4 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'var(--color-text-light)' }} />}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'var(--color-text-light)' }}>
                    Swim Times Chart: {swimStore.filterContext}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {swimStore.outlierSwims.length > 0 && (
                    <Paper sx={{ p: 2, mb: 2, border: '2px solid red' }}>
                      <Typography variant="h6" color="error">Action Required</Typography>
                      <Typography color="error">
                        The last repetition/lap falls outside the historical ±2 SD threshold for {swimStore.filterContext}. Immediate intervention or focused post-session evaluation is strongly recommended.
                      </Typography>
                    </Paper>
                  )}
                  {/* Chart will automatically be responsive due to parent width and ApexCharts config */}
                  <SwimTimesChart />
                  {/* TODO: Add responsive options to SwimTimesChart component: sparkline: true, width='100%', height='35vh' */}
                </AccordionDetails>
              </Accordion>
            )}

            {swimStore.showDonutChart && (
              <Accordion elevation={3} className="dashboard-item" sx={{ ...cardStyles, borderRadius: 4 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'var(--color-text-light)' }} />}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'var(--color-text-light)' }}>
                    Swim Duration Distribution
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <DonutChart />
                  {/* TODO: Add responsive options to DonutChart component: width='100%', height='35vh' */}
                </AccordionDetails>
              </Accordion>
            )}

            {swimStore.showVelocityDistanceChart && (
              <Accordion elevation={3} className="dashboard-item" sx={{ ...cardStyles, borderRadius: 4 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'var(--color-text-light)' }} />}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'var(--color-text-light)' }}>
                    Velocity Distance Chart
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <VelocityDistanceChart />
                  {/* TODO: Add responsive options to VelocityDistanceChart component: width='100%', height='35vh' */}
                </AccordionDetails>
              </Accordion>
            )}
          </Stack>

          {/* Section 3: Data Tables & Actions */}
          <Stack spacing={2}>
            <Paper elevation={3} className="dashboard-item" sx={{ ...cardStyles, borderRadius: 4, p: 2 }}>
              <SwimRecordsTable />
            </Paper>
            <ActionPanel />
          </Stack>
        </Box>
      ) : (
        // Original Desktop Layout
        <>
          {/* Section 1: Key Metric Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} lg={3} className="dashboard-item">
              <SummaryCard title="Personal Best" value={swimStore.personalBests ? `${swimStore.personalBests.duration}s` : 'N/A'} subValue={swimStore.personalBests ? new Date(swimStore.personalBests.date).toLocaleDateString() : '-'} />
            </Grid>
            <Grid item xs={12} sm={6} lg={3} className="dashboard-item">
              <Link to="/achievement-rate" style={{ textDecoration: 'none' }}>
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
              </Link>
            </Grid>
            <Grid item xs={12} sm={6} lg={3} className="dashboard-item">
              <SummaryCard title="Avg Time Swum (s)" value={swimStore.averageAndSd ? swimStore.averageAndSd.average : 'N/A'} subValue={swimStore.averageAndSd ? `Based on ${swimStore.averageAndSd.swimCount} swims` : '-'} />
            </Grid>
            <Grid item xs={12} sm={6} lg={3} className="dashboard-item">
              <Link to="/standard-deviation" style={{ textDecoration: 'none' }}>
                <SummaryCard title="Time Swum SD (s)" value={swimStore.averageAndSd ? swimStore.averageAndSd.standardDeviation : 'N/A'} subValue={sdSubValue} />
              </Link>
            </Grid>
          </Grid>

          {/* Section 2: Visualizations */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {swimStore.showSwimTimesChart && (
              <Grid item xs={12} lg={8} className="dashboard-item">
                <Paper sx={cardStyles}>
                  <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ background: 'var(--gradient-energetic)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {swimStore.filterContext}
                  </Typography>
                  {swimStore.outlierSwims.length > 0 && (
                    <Paper sx={{ p: 2, mb: 2, border: '2px solid red' }}>
                      <Typography variant="h6" color="error">Action Required</Typography>
                      <Typography color="error">
                        The last repetition/lap falls outside the historical ±2 SD threshold for {swimStore.filterContext}. Immediate intervention or focused post-session evaluation is strongly recommended.
                      </Typography>
                    </Paper>
                  )}
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

          {/* Section 3: Data Tables & Actions */}
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8} className="dashboard-item">
              <SwimRecordsTable />
            </Grid>
            <Grid item xs={12} lg={4} className="dashboard-item">
              <ActionPanel />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
});

export default Dashboard;