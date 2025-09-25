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

const Dashboard = observer(() => {
  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Personal Best" value={swimStore.personalBests ? `${swimStore.personalBests.duration}s` : 'N/A'} subValue={swimStore.personalBests ? new Date(swimStore.personalBests.date).toLocaleDateString() : ''} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Achievement Rate" value={swimStore.achievementRates ? `${swimStore.achievementRates.percentageMetOrBeat}% Met/Beat` : 'N/A'} subValue={swimStore.achievementRates ? `${swimStore.achievementRates.successfulAttempts}/${swimStore.achievementRates.totalAttempts}` : ''} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Avg Time Swum (s)" value={swimStore.averageAndSd ? swimStore.averageAndSd.average : 'N/A'} subValue={swimStore.averageAndSd ? `Based on ${swimStore.averageAndSd.swimCount} swims` : ''} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Time Swum SD (s)" value={swimStore.averageAndSd ? swimStore.averageAndSd.standardDeviation : 'N/A'} subValue={swimStore.averageAndSd ? `Based on ${swimStore.averageAndSd.swimCount} swims` : ''} />
        </Grid>
      </Grid>

      {/* Visual Charts and Action Panel */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {swimStore.showSwimTimesChart && (
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h5" gutterBottom>Lap Times ({swimStore.filterContext})</Typography>
              <SwimTimesChart />
            </Paper>
          </Grid>
        )}
        <Grid item xs={12} md={swimStore.showSwimTimesChart ? 4 : 12}>
          {swimStore.showDonutChart && <DonutChart />}
        </Grid>
      </Grid>

      {swimStore.showVelocityDistanceChart && (
        <Grid item xs={12} sx={{ mb: 3 }}>
          <VelocityDistanceChart />
        </Grid>
      )}

      {swimStore.showTrendlineDetails && <TrendlineStats />}

      {/* Data Tables */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <SwimRecordsTable />
        </Grid>
        <Grid item xs={12} md={4}>
          <ActionPanel />
        </Grid>
      </Grid>
    </Box>
  );
});

export default Dashboard;