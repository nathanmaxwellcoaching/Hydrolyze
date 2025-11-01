import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import Calendar from 'react-calendar';
import { Box, Typography, Tooltip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import swimStore, { type StravaSession, type Swim } from '../store/SwimStore';
import './CalendarView.css';

// Icons
import WavesIcon from '@mui/icons-material/Waves';
import TimerIcon from '@mui/icons-material/Timer';
import FlagIcon from '@mui/icons-material/Flag';

// Helper to get a consistent, timezone-agnostic date key (YYYY-MM-DD)
const getDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const CalendarView = observer(() => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSwimmer, setSelectedSwimmer] = useState<string>('');

  useEffect(() => {
    swimStore.loadSwims();
    swimStore.loadStravaSessions();
  }, []);

  const dailyActivity = useMemo(() => {
    const activities = new Map<string, { hasStrava: boolean; hasSplit: boolean; hasRace: boolean }>();
    let swimmerIdentifiers: string[] = [];

    if (swimStore.currentUser?.userType === 'coach') {
      if (selectedSwimmer) {
        swimmerIdentifiers = [selectedSwimmer]; // selectedSwimmer is email, need to convert to UID
      } else {
        swimmerIdentifiers = swimStore.swimmerUsers.map(u => u.UID);
      }
    } else if (swimStore.currentUser?.UID) {
      swimmerIdentifiers = [swimStore.currentUser.UID];
    }

    if (swimmerIdentifiers.length === 0) return activities;

    swimStore.stravaSessions.forEach(session => {
      // Strava sessions still use swimmerEmail, so we need to find the UID from email
      const user = swimStore.users.find(u => u.email === session.swimmerEmail);
      if (user && swimmerIdentifiers.includes(user.UID)) {
        const dateKey = getDateKey(new Date(session.start_date));
        if (!activities.has(dateKey)) {
          activities.set(dateKey, { hasStrava: false, hasSplit: false, hasRace: false });
        }
        activities.get(dateKey)!.hasStrava = true;
      }
    });

    swimStore.swims.forEach(swim => {
      if (swimmerIdentifiers.includes(swim.UID)) {
        const dateKey = getDateKey(new Date(swim.date));
        if (!activities.has(dateKey)) {
          activities.set(dateKey, { hasStrava: false, hasSplit: false, hasRace: false });
        }
        if (swim.race) {
          activities.get(dateKey)!.hasRace = true;
        } else {
          activities.get(dateKey)!.hasSplit = true;
        }
      }
    });

    return activities;
  }, [swimStore.swims, swimStore.stravaSessions, swimStore.currentUser, selectedSwimmer]);

  const selectedDayActivities = useMemo(() => {
    if (!selectedDate || !swimStore.currentUser) return [];
    const selectedKey = getDateKey(selectedDate);
    let swimmerIdentifiers: string[] = [];

    if (swimStore.currentUser?.userType === 'coach') {
      if (selectedSwimmer) {
        swimmerIdentifiers = [selectedSwimmer];
      } else {
        swimmerIdentifiers = swimStore.swimmerUsers.map(u => u.UID);
      }
    } else if (swimStore.currentUser?.UID) {
      swimmerIdentifiers = [swimStore.currentUser.UID];
    }

    if (swimmerIdentifiers.length === 0) return [];

    const stravaActivities = swimStore.stravaSessions
      .filter(s => {
        const user = swimStore.users.find(u => u.email === s.swimmerEmail);
        return user && swimmerIdentifiers.includes(user.UID) && getDateKey(new Date(s.start_date)) === selectedKey;
      })
      .map(s => ({ ...s, type: 'Strava' }));

    const swimActivities = swimStore.swims
      .filter(s => swimmerIdentifiers.includes(s.UID) && getDateKey(new Date(s.date)) === selectedKey)
      .map(s => ({ ...s, type: s.race ? 'Race' : 'Split' }));

    return [...stravaActivities, ...swimActivities].sort((a, b) => new Date((a as any).start_date || (a as any).date).getTime() - new Date((b as any).start_date || (b as any).date).getTime());
  }, [selectedDate, swimStore.swims, swimStore.stravaSessions, swimStore.currentUser, selectedSwimmer]);

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dayActivity = dailyActivity.get(getDateKey(date));
      if (dayActivity) {
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5, mt: 1 }}>
            {dayActivity.hasStrava && <Tooltip title="Strava Session"><WavesIcon sx={{ fontSize: 22, color: 'var(--color-accent-cyan)' }} /></Tooltip>}
            {dayActivity.hasSplit && <Tooltip title="Pace Splits"><TimerIcon sx={{ fontSize: 22, color: 'var(--color-accent-green)' }} /></Tooltip>}
            {dayActivity.hasRace && <Tooltip title="Race Result"><FlagIcon sx={{ fontSize: 22, color: 'var(--color-accent-yellow)' }} /></Tooltip>}
          </Box>
        );
      }
    }
    return null;
  };

  const hasStravaCredentials = swimStore.currentUser?.stravaClientId && swimStore.currentUser?.stravaClientSecret;
  const hasSyncedStrava = swimStore.stravaSessions.some(s => s.swimmerEmail === swimStore.currentUser?.email);

  return (
    <Box sx={{ p: 3, color: 'var(--color-text-light)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', background: 'var(--gradient-calm)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Activity Calendar
        </Typography>
        {swimStore.currentUser?.userType === 'coach' && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Swimmer</InputLabel>
            <Select value={selectedSwimmer} onChange={(e) => setSelectedSwimmer(e.target.value)} label="Swimmer">
              <MenuItem value=""><em>All Swimmers</em></MenuItem>
              {swimStore.swimmerUsers.map(user => (
                <MenuItem key={user.UID} value={user.UID}>{user.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {hasStravaCredentials && !hasSyncedStrava && (
        <Alert severity="info" sx={{ mb: 2, backgroundColor: 'rgba(112, 166, 235, 0.1)', color: 'var(--color-text-light)' }}>
          Strava is connected, but no activities have been synced yet. Visit the Strava page to sync your workouts.
        </Alert>
      )}

      <Box className="calendar-container" sx={{ mt: 2 }}>
        <Calendar
          onClickDay={(date) => setSelectedDate(date)}
          tileContent={tileContent}
        />
      </Box>

      {selectedDate && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
            Activities for {selectedDate.toLocaleDateString()}
          </Typography>
          <Paper sx={{ background: 'var(--color-background-card)', borderRadius: '16px' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'var(--color-text-light)', fontWeight: 'bold' }}>Type</TableCell>
                    <TableCell sx={{ color: 'var(--color-text-light)', fontWeight: 'bold' }}>Details</TableCell>
                    <TableCell sx={{ color: 'var(--color-text-light)', fontWeight: 'bold' }} align="right">Distance</TableCell>
                    <TableCell sx={{ color: 'var(--color-text-light)', fontWeight: 'bold' }} align="right">Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedDayActivities.length > 0 ? (
                    selectedDayActivities.map((activity, index) => (
                      <TableRow 
                        key={index}
                        onClick={() => swimStore.openRecordDetailModal(activity)}
                        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' } }}
                      >
                        <TableCell sx={{ color: 'var(--color-text-secondary)' }}>{activity.type}</TableCell>
                        <TableCell sx={{ color: 'var(--color-text-secondary)' }}>
                          {(activity as StravaSession).name || `${(activity as Swim).stroke}`}
                        </TableCell>
                        <TableCell sx={{ color: 'var(--color-text-secondary)' }} align="right">
                          {`${activity.distance}m`}
                        </TableCell>
                        <TableCell sx={{ color: 'var(--color-text-secondary)' }} align="right">
                          {new Date(((activity as StravaSession).moving_time || (activity as Swim).duration) * 1000).toISOString().substr(11, 8)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ color: 'var(--color-text-secondary)' }}>
                        No activities recorded for this day.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}
    </Box>
  );
});

export default CalendarView;