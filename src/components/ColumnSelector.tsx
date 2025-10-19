import { observer } from 'mobx-react-lite';
import swimStore, { CANONICAL_COLUMN_ORDER } from '../store/SwimStore';
import { Popover, MenuItem, Checkbox, ListItemText, FormGroup } from '@mui/material';
import type { Swim } from '../store/SwimStore';

// Using a more specific type for keys to ensure type safety.
const columnDisplayNames: { [key in keyof Swim]?: string } = {
  id: 'ID',
  date: 'Date & Time',
  swimmerEmail: 'Swimmer',
  distance: 'Distance (m)',
  stroke: 'Stroke',
  duration: 'Time (s)',
  targetTime: 'Target (s)',
  gear: 'Gear',
  poolLength: 'Pool (m)',
  averageStrokeRate: 'Avg SR',
  heartRate: 'HR',
  paceDistance: 'Pace Dist.',
  velocity: 'Velocity (m/s)',
  sl: 'SL (m/str)',
  si: 'SI',
  ie: 'IE Ratio',
};

// Use the canonical order from the store as the single source of truth.
const allColumns = CANONICAL_COLUMN_ORDER;
const mandatoryColumns: (keyof Swim)[] = ['date', 'swimmerEmail', 'duration'];

interface ColumnSelectorProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const ColumnSelector = observer(({ anchorEl, onClose }: ColumnSelectorProps) => {
  const open = Boolean(anchorEl);

  // The 'value' parameter is now correctly typed as keyof Swim.
  const handleToggle = (value: keyof Swim) => () => {
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
              {/* Use the display name or fall back to the key itself */}
              <ListItemText primary={columnDisplayNames[key] || key} />
            </MenuItem>
          );
        })}
      </FormGroup>
    </Popover>
  );
});

export default ColumnSelector;