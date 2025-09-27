import { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { collection, doc, deleteDoc, updateDoc, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase-config';
import swimStore from '../store/SwimStore';
import { Box, Typography, IconButton, Collapse, TextField, Select, MenuItem, InputLabel, FormControl, OutlinedInput, Checkbox, ListItemText, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
const strokes = ["Freestyle", "Backstroke", "Breaststroke", "Butterfly"];
const gearOptions = ["Pull Buoy", "Fins", "Paddles", "Snorkel", "Kickboard", "No Gear"];

interface GoalTime {
  id: string;
  email: string;
  stroke: string;
  distance: number;
  gear: string[];
  time: number;
}

// NEW: Define column display names
const columnDisplayNames: Record<keyof GoalTime, string> = {
  id: 'ID',
  email: 'Email', // Add email to align with availableColumns
  stroke: 'Stroke',
  distance: 'Distance',
  gear: 'Gear',
  time: 'Time (s)',
};

// NEW: Function to get the column value
const getColumnValue = (record: GoalTime, column: keyof GoalTime) => {
    switch (column) {
        case 'gear':
            return Array.isArray(record.gear) ? record.gear.join(', ') : record.gear;
        default:
            return String(record[column]);
    }
};

const GoalTimes = () => {
    const [showForm, setShowForm] = useState(false);
    const [stroke, setStroke] = useState('');
    const [distance, setDistance] = useState('');
    const [gear, setGear] = useState<string[]>([]);
    const [time, setTime] = useState('');
    const [goalTimes, setGoalTimes] = useState<GoalTime[]>([]);
    const [editState, setEditState] = useState<Record<string, Partial<GoalTime>>>({});
    const [email, setEmail] = useState(swimStore.currentUser?.email || '');
    const [filters, setFilters] = useState({
        swimmer: '',
        stroke: '',
        distance: '',
    });
    useEffect(() => {
        if (swimStore.currentUser?.email) {
            setEmail(swimStore.currentUser.email);
        }
    }, [swimStore.currentUser?.email]);

    const fetchGoalTimes = async () => {
        let q;
        if (swimStore.currentUser?.isAdmin) {
            let queryConstraints = [];

            if (filters.swimmer) {
                queryConstraints.push(where("email", "==", filters.swimmer));
            }
            if (filters.stroke) {
                queryConstraints.push(where("stroke", "==", filters.stroke));
            }
            if (filters.distance) {
                queryConstraints.push(where("distance", "==", parseInt(filters.distance, 10)));
            }
            q = query(collection(db, "goal_times"), ...queryConstraints);
        } else if (swimStore.currentUser?.email) {
            q = query(collection(db, "goal_times"), where("email", "==", swimStore.currentUser.email));
        } else {
            setGoalTimes([]);
            return;
        }

        const querySnapshot = await getDocs(q);
        const times: GoalTime[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            let timeValue = null;

            for (const key in data) {
                if (key !== 'id' && key !== 'email' && key !== 'stroke' && key !== 'distance' && key !== 'gear') {
                    timeValue = data[key];
                    break;
                }
            }
            times.push({ id: doc.id, email: data.email, ...data, time: timeValue } as GoalTime);
        });
        setGoalTimes(times);
    };

    useEffect(() => {
        fetchGoalTimes();
    }, [swimStore.currentUser?.email, filters]);

    const handleAddGoalTime = async () => {
        if (strokes.includes(stroke) && !isNaN(parseInt(distance, 10)) && parseInt(distance, 10) > 0 && gear.every(g => gearOptions.includes(g)) && !isNaN(parseFloat(time)) && parseFloat(time) > 0) {
            const fieldName = `${distance}-${stroke}-${gear.join('-')}`;
            const emailToUse = swimStore.currentUser?.isAdmin ? email : swimStore.currentUser?.email || '';

            await addDoc(collection(db, "goal_times"), {
                email: emailToUse,
                stroke,
                distance: parseInt(distance, 10),
                gear,
                [fieldName]: parseFloat(time),
            });
            setStroke('');
            setDistance('');
            setGear([]);
            setTime('');
            setShowForm(false);
            fetchGoalTimes();
        }
    };

    const handleGearChange = (event: SelectChangeEvent<string[]>) => {
        const {
            target: { value },
        } = event;
        setGear(
            typeof value === 'string' ? value.split(',') : value,
        );
    };

    const handleDeleteGoalTime = async (id: string) => {
        try {
            const goalTimeDoc = doc(db, "goal_times", id);
            await deleteDoc(goalTimeDoc);
            setGoalTimes(goalTimes.filter((time) => time.id !== id));
        } catch (error) {
            console.error("Error deleting goal time:", error);
            // TODO: Implement proper error handling (e.g., display an error message)
        }
    };

    const handleUpdateGoalTime = async (id: string, updatedData: Partial<GoalTime>) => {
        try {
            const goalTimeDoc = doc(db, "goal_times", id);
            const currentTimeData = goalTimes.find(time => time.id === id);
            let timeKey = null;

            if (currentTimeData) {
                for (const key in currentTimeData) {
                    if (key !== 'id' && key !== 'email' && key !== 'stroke' && key !== 'distance' && key !== 'gear' && key !== 'time') {
                        timeKey = key;
                        break;
                    }
                }
            }

            if (!timeKey) {
                console.error("Time Key not found in database");
                return;
            }

            const updatePayload: any = {
                stroke: updatedData.stroke,
                distance: updatedData.distance,
                gear: updatedData.gear,
                [timeKey]: updatedData.time, // use the existing time key
            };

            await updateDoc(goalTimeDoc, updatePayload);

            setGoalTimes(goalTimes.map(time => time.id === id ? { ...time, ...updatedData } : time));
        } catch (error) {
            console.error("Error updating goal time:", error);
            // TODO: Implement proper error handling
        }
    };

    const handleEditChange = (id: string, field: keyof GoalTime, value: any) => {
        setEditState(prev => ({
            ...prev,
            [id]: {
                ...(prev[id] || {}),
                [field]: value,
            },
        }));
    };

    const handleSave = async (id: string) => {
        const originalRecord = goalTimes.find(goalTime => goalTime.id === id);
        const updatedData = editState[id];

        if (originalRecord && updatedData) {
            const updatedRecord = { ...originalRecord, ...updatedData };

            // Fix for gear handling - ensure gear is properly typed
            if (typeof updatedRecord.gear === 'string') {
                updatedRecord.gear = (updatedRecord.gear as any).split(',').map((item: string) => item.trim());
            }

            await handleUpdateGoalTime(id, updatedRecord);
            setEditState(prev => {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            });
        }
    };

    const handleStartEditing = (record: GoalTime) => {
        const gearAsString = Array.isArray(record.gear) ? record.gear.join(', ') : record.gear;
        setEditState(prev => ({
            ...prev,
            [record.id]: { ...record, gear: gearAsString as any },
        }));
    };

    const isEditable = (key: string) => !['id', 'email'].includes(key);

    const handleAdminFilterApply = () => {
        swimStore.applyGoalTimeFilters(filters);
        console.log("Filtering goal times with:", filters);
        fetchGoalTimes();
    };

    const handleAdminFilterClear = () => {
        setFilters({ swimmer: '', stroke: '', distance: '' });
        swimStore.clearGoalTimeFilters();
        console.log("Clearing goal time filters");
        fetchGoalTimes();
    };
    const availableColumns = [
      { id: 'id', label: 'ID' },
      { id: 'email', label: 'Email' },
      { id: 'stroke', label: 'Stroke' },
      { id: 'distance', label: 'Distance' },
      { id: 'gear', label: 'Gear' },
      { id: 'time', label: 'Time (s)' },
    ];

    const handleColumnChange = (event: SelectChangeEvent<string[]>) => {
        const {
            target: { value },
        } = event;
        swimStore.setVisibleGoalTimeColumns(value as any);
    };

    return (
        <Paper sx={{ p: 2, backgroundColor: '#1A1A1A', color: '#FFFFFF' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#FFFFFF' }}>Manage Goal Times</Typography>
                {swimStore.currentUser?.isAdmin && (
                    <>
                        <FormControl sx={{ m: 1, minWidth: 120 }}>
                            <InputLabel id="multiple-checkbox-label">Columns</InputLabel>
                            <Select
                                labelId="multiple-checkbox-label"
                                id="multiple-checkbox"
                                multiple
                                value={swimStore.visibleGoalTimeColumns}
                                onChange={handleColumnChange}
                                input={<OutlinedInput label="Columns" />}
                                renderValue={(selected) => selected.join(', ')}
                            >
                                {availableColumns.map((column) => (
                                    <MenuItem key={column.id} value={column.id}>
                                        <Checkbox checked={swimStore.visibleGoalTimeColumns.includes(column.id as any)} />
                                        <ListItemText primary={column.label} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          {/* Swimmer dropdown */}
                          <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel>Swimmer (Email)</InputLabel>
                            <Select
                              value={filters.swimmer}
                              onChange={(e) => setFilters({ ...filters, swimmer: e.target.value })}
                              label="Swimmer (Email)"
                            >
                              <MenuItem value="">(All)</MenuItem>
                              {[...new Set(goalTimes.map((g) => g.email))].map((em) => (
                                <MenuItem key={em} value={em}>{em}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          {/* Stroke dropdown */}
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Stroke</InputLabel>
                            <Select
                              value={filters.stroke}
                              onChange={(e) => setFilters({ ...filters, stroke: e.target.value })}
                              label="Stroke"
                            >
                              <MenuItem value="">(All)</MenuItem>
                              {strokes.map((s) => (
                                <MenuItem key={s} value={s}>{s}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          {/* Distance dropdown */}
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Distance</InputLabel>
                            <Select
                              value={filters.distance}
                              onChange={(e) => setFilters({ ...filters, distance: e.target.value })}
                              label="Distance"
                            >
                              <MenuItem value="">(All)</MenuItem>
                              {[...new Set(goalTimes.map((g) => String(g.distance)))]
                                .sort((a, b) => Number(a) - Number(b))
                                .map((d) => (
                                  <MenuItem key={d} value={d}>{d} m</MenuItem>
                                ))}
                            </Select>
                          </FormControl>

                          <Button variant="contained" onClick={handleAdminFilterApply}>Apply</Button>
                          <Button variant="outlined" onClick={handleAdminFilterClear}>Clear</Button>
                        </Box>
                    </>
                )}
                <IconButton onClick={() => setShowForm(!showForm)} color="inherit">
                    <AddCircleOutlineIcon />
                </IconButton>
            </Box>
            <Collapse in={showForm}>
                <Box sx={{ mt: 2, p: 2, border: '1px solid #ccc', borderRadius: '4px' }}>
                    <Typography variant="h6">Add New Goal Time</Typography>
                    {swimStore.currentUser?.isAdmin && (
                        <TextField
                            fullWidth
                            label="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            sx={{ mt: 2 }}
                        />
                    )}
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Stroke</InputLabel>
                        <Select
                            value={stroke}
                            onChange={(e) => setStroke(e.target.value)}
                        >
                            {strokes.map((s) => (
                                <MenuItem key={s} value={s}>{s}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        label="Distance (meters)"
                        type="number"
                        value={distance}
                        onChange={(e) => setDistance(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Time (seconds)"
                        type="number"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Gear</InputLabel>
                        <Select
                            multiple
                            value={gear}
                            onChange={handleGearChange}
                            input={<OutlinedInput label="Gear" />}
                            renderValue={(selected) => selected.join(', ')}
                        >
                            {gearOptions.map((g) => (
                                <MenuItem key={g} value={g}>
                                    <Checkbox checked={gear.indexOf(g) > -1} />
                                    <ListItemText primary={g} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button variant="contained" onClick={handleAddGoalTime} sx={{ mt: 2 }}>Add Goal</Button>
                </Box>
            </Collapse>
            <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader aria-label="manage goal times table">
<TableHead>
  <TableRow>
    {/* ID – explicit */}
    {swimStore.currentUser?.isAdmin && swimStore.visibleGoalTimeColumns.includes('id') && (
      <TableCell key="id" sx={{ backgroundColor: '#2C2C2C', color: '#FFFFFF' }}>
        {columnDisplayNames.id}
      </TableCell>
    )}
    {/* remaining columns – id excluded */}
    {(Object.keys(columnDisplayNames) as Array<keyof GoalTime>)
      .filter(column => column !== 'id' && swimStore.visibleGoalTimeColumns.includes(column))
      .map(column => (
        <TableCell key={column} sx={{ backgroundColor: '#2C2C2C', color: '#FFFFFF' }}>
          {columnDisplayNames[column]}
        </TableCell>
      ))}
    <TableCell sx={{ backgroundColor: '#2C2C2C', color: '#FFFFFF' }}>Actions</TableCell>
  </TableRow>
</TableHead>
<TableBody>
  {goalTimes.map((record) => (
    <TableRow key={record.id}>
      {/* Conditionally render the ID cell */}
      {swimStore.currentUser?.isAdmin && swimStore.visibleGoalTimeColumns.includes('id') && (
        <TableCell key="id" sx={{ color: '#B0B0B0' }}>
          {String(getColumnValue(record, 'id'))}
        </TableCell>
      )}
    {(Object.keys(columnDisplayNames) as Array<keyof GoalTime>)
      .filter(column => column !== 'id' && swimStore.visibleGoalTimeColumns.includes(column))
      .map(column => (
        <TableCell key={column} sx={{ color: '#B0B0B0' }}>
          {/*  STROKE  –  dropdown  */}
          {editState[record.id] && column === 'stroke' ? (
            <FormControl size="small" fullWidth>
              <Select
                value={(editState[record.id]?.stroke as string) ?? ''}
                onChange={(e) => handleEditChange(record.id, 'stroke', e.target.value)}
              >
                {strokes.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}

          {/*  GEAR  –  multi-select dropdown  */}
          {editState[record.id] && column === 'gear' ? (
            <FormControl size="small" fullWidth>
              <Select
                multiple
                value={Array.isArray(editState[record.id]?.gear)
                  ? (editState[record.id]?.gear as string[])
                  : []}
                onChange={(e) =>
                  handleEditChange(
                    record.id,
                    'gear',
                    typeof e.target.value === 'string'
                      ? e.target.value.split(',')
                      : e.target.value
                  )
                }
                input={<OutlinedInput />}
                renderValue={(selected) => (selected as string[]).join(', ')}
              >
                {gearOptions.map((g) => (
                  <MenuItem key={g} value={g}>
                    <Checkbox checked={
                      (Array.isArray(editState[record.id]?.gear)
                        ? (editState[record.id]?.gear as string[])
                        : []
                      ).includes(g)
                    } />
                    <ListItemText primary={g} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}

          {/*  EVERYTHING ELSE  –  plain text field  */}
          {editState[record.id] && column !== 'stroke' && column !== 'gear' && isEditable(column) ? (
            <TextField
              value={String(editState[record.id]?.[column] ?? '')}
              onChange={(e) => handleEditChange(record.id, column, e.target.value)}
              sx={{
                '& .MuiInputBase-input': { color: '#FFFFFF' },
                '& .MuiInput-underline:before': { borderBottomColor: '#B0B0B0' },
              }}
              variant="standard"
            />
          ) : null}

          {/*  READ-ONLY MODE  */}
          {!editState[record.id] && String(getColumnValue(record, column))}
        </TableCell>
      ))}
      <TableCell>
        {editState[record.id] ? (
          <Button onClick={() => handleSave(record.id)} variant="contained" color="primary" size="small">Save</Button>
        ) : (
          <Button onClick={() => handleStartEditing(record)} variant="outlined" size="small">Edit</Button>
        )}
        <Button onClick={() => handleDeleteGoalTime(record.id)} variant="contained" color="secondary" size="small" sx={{ ml: 1 }}>Delete</Button>
      </TableCell>
    </TableRow>
  ))}
</TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default observer(GoalTimes);
