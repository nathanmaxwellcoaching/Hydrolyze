
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { Popover, MenuItem, Checkbox, ListItemText, FormGroup } from '@mui/material';
import type { Swim } from '../store/SwimStore';

const columnDisplayNames: { [key: string]: string } = {
  id: 'ID',
  swimmer: 'Swimmer',
  distance: 'Distance',
  stroke: 'Stroke',
  duration: 'Time Swum (s)',
  targetTime: 'Target Time (s)',
  gear: 'Gear',
  date: 'Date & Time',
  poolLength: 'Pool Length',
  averageStrokeRate: 'Avg Stroke Rate',
  heartRate: 'Heart Rate',
  strokeLength: 'Stroke Length (SL)',
  swimIndex: 'Swim Index (SI)',
  ieRatio: 'IE Ratio',
};

const allColumns = Object.keys(columnDisplayNames) as (keyof Swim | 'strokeLength' | 'swimIndex' | 'ieRatio')[];
const mandatoryColumns = ['date', 'swimmer', 'duration'];

interface ColumnSelectorProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const ColumnSelector = observer(({ anchorEl, onClose }: ColumnSelectorProps) => {
  const open = Boolean(anchorEl);

  const handleToggle = (value: keyof Swim | 'strokeLength' | 'swimIndex' | 'ieRatio') => () => {
    if (mandatoryColumns.includes(value)) {
      return; // Do not allow toggling mandatory columns
    }

    const currentIndex = swimStore.visibleColumns.indexOf(value);
    const newChecked = [...swimStore.visibleColumns];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    swimStore.setVisibleColumns(newChecked);
  };

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
        {allColumns.map((key) => {
          const isMandatory = mandatoryColumns.includes(key);
          return (
            <MenuItem key={key} onClick={handleToggle(key)} disabled={isMandatory}>
              <Checkbox
                edge="start"
                checked={swimStore.visibleColumns.indexOf(key) > -1 || isMandatory}
                tabIndex={-1}
                disableRipple
                disabled={isMandatory}
                sx={{ color: isMandatory ? '#888' : '#B0B0B0' }}
              />
              <ListItemText primary={columnDisplayNames[key]} />
            </MenuItem>
          );
        })}
      </FormGroup>
    </Popover>
  );
});

export default ColumnSelector;