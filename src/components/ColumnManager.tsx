
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Popover, FormGroup, FormControlLabel, Checkbox } from '@mui/material';

interface ColumnManagerProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const SwimTimesChartCheckbox = () => (
  <Checkbox
    checked={swimStore.showSwimTimesChart}
    onChange={(e) => swimStore.toggleSwimTimesChart(e.target.checked)}
    sx={{ color: '#B0B0B0' }}
  />
);

const TrendlineDetailsCheckbox = () => (
  <Checkbox
    checked={swimStore.showTrendlineDetails}
    onChange={(e) => swimStore.toggleTrendlineDetails(e.target.checked)}
    sx={{ color: '#B0B0B0' }}
  />
);

const DonutChartCheckbox = () => (
  <Checkbox
    checked={swimStore.showDonutChart}
    onChange={(e) => swimStore.toggleDonutChart(e.target.checked)}
    sx={{ color: '#B0B0B0' }}
  />
);

const VelocityDistanceChartCheckbox = () => (
  <Checkbox
    checked={swimStore.showVelocityDistanceChart}
    onChange={(e) => swimStore.toggleVelocityDistanceChart(e.target.checked)}
    sx={{ color: '#B0B0B0' }}
  />
);

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
          control={<SwimTimesChartCheckbox />}
          label="Lap Times Graph"
        />
        <FormControlLabel
          control={<TrendlineDetailsCheckbox />}
          label="Trendline Details"
        />
        <FormControlLabel
          control={<DonutChartCheckbox />}
          label="Swim Stroke Distribution"
        />
        <FormControlLabel
          control={<VelocityDistanceChartCheckbox />}
          label="Velocity vs Distance"
        />
      </FormGroup>
    </Popover>
  );
};

export default observer(ColumnManager);
