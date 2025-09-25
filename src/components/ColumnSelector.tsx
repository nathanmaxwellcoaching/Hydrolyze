import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import swimStore from '../store/SwimStore';
import { IconButton, Menu, MenuItem, Checkbox, ListItemText } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
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

const ColumnSelector = observer(() => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleToggle = (value: keyof Swim | 'strokeLength' | 'swimIndex' | 'ieRatio') => () => {
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
    <div>
      <IconButton
        aria-label="settings"
        aria-controls="column-menu"
        aria-haspopup="true"
        onClick={handleClick}
      >
        <SettingsIcon />
      </IconButton>
      <Menu
        id="column-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        {allColumns.map((key) => (
          <MenuItem key={key} onClick={handleToggle(key)}>
            <Checkbox
              edge="start"
              checked={swimStore.visibleColumns.indexOf(key) > -1}
              tabIndex={-1}
              disableRipple
            />
            <ListItemText primary={columnDisplayNames[key]} />
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
});

export default ColumnSelector;