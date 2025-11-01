import { observer } from 'mobx-react-lite';
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Slide,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { type TransitionProps } from '@mui/material/transitions';
import { forwardRef, Fragment, type ReactElement, type Ref } from 'react';
import swimStore, { type Swim, type StravaSession } from './../store/SwimStore';

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: ReactElement;
  },
  ref: Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Helper to format keys and values for display
const formatKey = (key: string) => {
  return key
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
};

const handleDelete = async () => {
  if (!swimStore.selectedRecordForDetail) return;

  const recordId = swimStore.selectedRecordForDetail.id;
  const isStrava = 'moving_time' in swimStore.selectedRecordForDetail;

  if (window.confirm(`Are you sure you want to delete this ${isStrava ? 'Strava session' : 'swim record'}?`)) {
    if (isStrava) {
      // Assuming a deleteStravaSession method exists in swimStore
      // swimStore.deleteStravaSession(recordId);
      console.log("Deleting Strava session:", recordId); // Placeholder
    } else {
      await swimStore.deleteSwim(recordId);
    }
    swimStore.closeRecordDetailModal();
  }
};

const formatValue = (key: string, value: any) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ') || 'None';

  if (key.includes('heartrate')) {
    return `${value} bpm`;
  }

  if (key.includes('averageStrokeRate')) {
    return `${value} spm`;
  }

  if (key.includes('distance')) {
    return `${value}m`;
  }

  if (key === 'duration' || key === 'time' || key === 'moving_time' || key === 'elapsed_time' || key === 'targetTime') {
    // Assuming these are in seconds, format as HH:MM:SS
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const seconds = value % 60;
    return [
      hours > 0 ? String(hours).padStart(2, '0') : null,
      String(minutes).padStart(2, '0'),
      String(seconds).padStart(2, '0'),
    ].filter(Boolean).join(':');
  }

  if (key.includes('date') || key.includes('at')) {
    return new Date(value).toLocaleString();
  }

  return String(value);
};

const RecordDetailModal = observer(() => {
  const { isRecordDetailModalOpen, selectedRecordForDetail, closeRecordDetailModal } = swimStore;

  const isStrava = selectedRecordForDetail && 'moving_time' in selectedRecordForDetail;
  const record = selectedRecordForDetail;

  const renderRecordDetails = () => {
    if (!record) return null;

    return Object.entries(record).map(([key, value]) => {
      if (key === 'id' || key === 'swimmerEmail') return null; // Hide internal IDs

      return (
        <Fragment key={key}>
          <ListItem>
            <ListItemText 
              primary={formatKey(key)} 
              secondary={formatValue(key, value)} 
              primaryTypographyProps={{ fontWeight: 'bold', color: 'var(--color-text-light)' }}
              secondaryTypographyProps={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}
            />
          </ListItem>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        </Fragment>
      );
    });
  };

  return (
    <Dialog
      fullScreen
      open={isRecordDetailModalOpen}
      onClose={closeRecordDetailModal}
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          background: 'var(--color-background-dark)',
          color: 'var(--color-text-light)'
        }
      }}
    >
      <AppBar sx={{ position: 'relative', background: 'var(--color-background-card)' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={closeRecordDetailModal} aria-label="close">
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            {record ? (isStrava ? (record as StravaSession).name : `${(record as Swim).stroke} ${(record as Swim).distance}m`) : 'Record Details'}
          </Typography>
          {(swimStore.currentUser?.isAdmin || (record && record.swimmerEmail === swimStore.currentUser?.email)) && (
            <IconButton edge="end" color="inherit" onClick={handleDelete} aria-label="delete">
              <DeleteIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 3 }}>
        <Paper sx={{ background: 'var(--color-background-card)', p: 2, borderRadius: '16px' }}>
          <List>
            {renderRecordDetails()}
          </List>
        </Paper>
      </Box>
    </Dialog>
  );
});

export default RecordDetailModal;
