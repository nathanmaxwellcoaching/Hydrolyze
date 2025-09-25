
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Popover, FormGroup, FormControlLabel, Checkbox } from '@mui/material';

interface ColumnManagerProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const ColumnManager = ({ anchorEl, onClose }: ColumnManagerProps) => {
  const open = Boolean(anchorEl);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
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
        <FormControlLabel
          control={
            <Checkbox
              checked={swimStore.showSwimTimesChart}
              onChange={(e) => swimStore.toggleSwimTimesChart(e.target.checked)}
              sx={{ color: '#B0B0B0' }}
            />
          }
          label="Lap Times Graph"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={swimStore.showTrendlineDetails}
              onChange={(e) => swimStore.toggleTrendlineDetails(e.target.checked)}
              sx={{ color: '#B0B0B0' }}
            />
          }
          label="Trendline Details"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={swimStore.showDonutChart}
              onChange={(e) => swimStore.toggleDonutChart(e.target.checked)}
              sx={{ color: '#B0B0B0' }}
            />
          }
          label="Swim Stroke Distribution"
        />
      </FormGroup>
    </Popover>
  );
};

export default observer(ColumnManager);
