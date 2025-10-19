import { useEffect, useState } from 'react';
import axios from 'axios';
import { observer } from 'mobx-react-lite';
import { auth } from '../firebase-config';
import swimStore, { type StravaSession } from '../store/SwimStore';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Box, IconButton, Popover, FormGroup, MenuItem, Checkbox, ListItemText } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import StravaSwimChart from './StravaSwimChart';

const columnDisplayNames: { [key: string]: string } = {
  start_date: 'Date',
  name: 'Name',
  distance: 'Distance',
  moving_time: 'Moving Time',
  average_heartrate: 'Avg HR',
  max_heartrate: 'Max HR',
};

const allColumns: (keyof StravaSession)[] = ['start_date', 'name', 'distance', 'moving_time', 'average_heartrate', 'max_heartrate'];

const StravaPage = observer(() => {
  const [swims, setSwims] = useState<StravaSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [visibleColumns, setVisibleColumns] = useState<(keyof StravaSession)[]>(['distance', 'start_date']);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const response = await axios.get('/strava/swims', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setSwims(response.data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    const user = auth.currentUser;
    if (user?.uid) {
      window.location.href = `/auth/strava/${encodeURIComponent(user.uid)}`;
    } else {
      console.error('No user logged in');
    }
  };

  const handleColumnSelectorClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleColumnSelectorClose = () => setAnchorEl(null);

  const handleColumnToggle = (column: keyof StravaSession) => () => {
    const currentIndex = visibleColumns.indexOf(column);
    const newVisibleColumns = [...visibleColumns];

    if (currentIndex === -1) {
      newVisibleColumns.push(column);
    } else {
      newVisibleColumns.splice(currentIndex, 1);
    }

    setVisibleColumns(newVisibleColumns);
  };

  if (loading) return <div>Loading...</div>;

  if (error)
    return (
      <div>
        <p>Please connect your Strava account.</p>
        <button onClick={handleLogin}>Connect with Strava</button>
      </div>
    );

  return (
    <Paper sx={{ 
      p: { xs: 2, sm: 3 },
      background: 'var(--color-background-card)', 
      color: 'var(--color-text-light)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    }} >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ background: 'var(--gradient-calm)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Strava Swims
        </Typography>
        <IconButton onClick={handleColumnSelectorClick} sx={{ color: 'var(--color-text-secondary)', '&:hover': { color: 'var(--color-accent-green)' } }}>
          <SettingsIcon />
        </IconButton>
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleColumnSelectorClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <FormGroup sx={{ p: 2, backgroundColor: '#2C2C2C', color: '#FFFFFF' }}>
            {allColumns.map((column) => (
              <MenuItem key={column} onClick={handleColumnToggle(column as keyof StravaSession)}>
                <Checkbox
                  edge="start"
                  checked={visibleColumns.indexOf(column as keyof StravaSession) > -1}
                  tabIndex={-1}
                  disableRipple
                  sx={{ color: '#B0B0B0' }}
                />
                <ListItemText primary={columnDisplayNames[column] || column} />
              </MenuItem>
            ))}
          </FormGroup>
        </Popover>
      </Box>
      <StravaSwimChart swims={swims} />
      <TableContainer sx={{ maxHeight: 440, overflowX: 'auto' }}>
        <Table stickyHeader aria-label="strava swim records table">
          <TableHead>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableCell key={column} sx={{ backgroundColor: '#101010', color: 'var(--color-text-light)', fontWeight: 'bold', fontSize: '0.9rem', borderBottom: '2px solid var(--color-accent-blue-purple)', py: 1.5 }}>
                  {columnDisplayNames[column] || column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {swims.map((swim) => (
              <TableRow 
                key={swim.id} 
                onClick={() => swimStore.openRecordDetailModal(swim)}
                sx={{ 
                  '&:last-child td, &:last-child th': { border: 0 }, 
                  transition: 'background-color 0.2s ease-in-out', 
                  '&:hover': { backgroundColor: 'rgba(113, 126, 187, 0.2)', cursor: 'pointer' } 
                }}
              >
                {visibleColumns.map((column) => (
                  <TableCell key={column} sx={{ color: 'var(--color-text-secondary)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', py: 1.5 }}>
                    {column === 'start_date' ? new Date(swim[column]).toLocaleDateString() : swim[column]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
});

export default StravaPage;
