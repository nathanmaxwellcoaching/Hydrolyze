import { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, Grid, CircularProgress } from '@mui/material';
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import StravaSwimChart from './StravaSwimChart';
import HrZoneDonutChart from './HrZoneDonutChart';


const StravaPage = observer(() => {
  const [loading, setLoading] = useState(false);

  const handleStravaAuth = () => {
    const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${swimStore.currentUser?.stravaClientId}&response_type=code&redirect_uri=${window.location.origin}/strava/callback&approval_prompt=force&scope=activity:read_all`;
    window.location.href = stravaAuthUrl;
  };

  const fetchStravaData = async () => {
    setLoading(true);
    await swimStore.loadStravaSessions();
    setLoading(false);
  };

  useEffect(() => {
    if (swimStore.currentUser?.stravaClientId) {
      fetchStravaData();
    }
  }, [swimStore.currentUser]);

  if (!swimStore.currentUser) {
    return <CircularProgress />;
  }

  const hrZoneData = swimStore.stravaSessions.reduce((acc, session) => {
    session.hrZoneTimes?.forEach(zone => {
      const existingZone = acc.find(z => z.name === zone.name);
      if (existingZone) {
        existingZone.value += zone.value;
      } else {
        acc.push({ ...zone });
      }
    });
    return acc;
  }, [] as { name: string; value: number; color: string }[]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Strava Integration</Typography>
      {!swimStore.currentUser.stravaClientId ? (
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography sx={{ mb: 2 }}>Connect your Strava account to automatically import your swim data.</Typography>
          <Button variant="contained" onClick={handleStravaAuth}>Connect with Strava</Button>
        </Paper>
      ) : (
        <Box>
          <Button variant="contained" onClick={fetchStravaData} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Refresh Strava Data'}
          </Button>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <StravaSwimChart swims={swimStore.stravaSessions} />
            </Grid>
            <Grid item xs={12}>
                <HrZoneDonutChart data={hrZoneData} />
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
});

export default StravaPage;
