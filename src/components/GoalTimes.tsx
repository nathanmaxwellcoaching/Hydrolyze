import { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { supabase } from "../lib/supabaseClient";
import swimStore from "../store/SwimStore";
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
  useTheme,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import anime from "animejs";
import { type GoalTime } from "../store/SwimStore";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const strokes = ["Freestyle", "Backstroke", "Breaststroke", "Butterfly"];
const gearOptions = ["Pull Buoy", "Fins", "Paddles", "Snorkel", "NoGear"];

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const getColumnValue = (record: GoalTime, column: keyof GoalTime) => {
  switch (column) {
    case "swimmerName":
      return record.swimmerName || record.email;
    case "gear":
      return Array.isArray(record.gear) ? record.gear.join(", ") : record.gear;
    case "poolLength":
      return `${record.poolLength}m`;
    case "targetTime": {
      const totalSeconds = record.targetTime;
      if (totalSeconds === null || isNaN(totalSeconds)) {
        return "00:00";
      }
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }    default:
      return String(record[column]);
  }
};

const GoalTimes = observer(() => {
  const [showForm, setShowForm] = useState(false);
  const [stroke, setStroke] = useState<GoalTime["stroke"]>("Freestyle");
  const [distance, setDistance] = useState("");
  const [gear, setGear] = useState<string[]>([]);
  const [poolLength, setPoolLength] = useState<25 | 50>(25);
  const [time, setTime] = useState("");
  const [goalTimes, setGoalTimes] = useState<GoalTime[]>([]);

  const columnDisplayNames: Record<keyof GoalTime, string> = {
    UID: "ID",
    swimmerName: "Swimmer",
    stroke: "Stroke",
    distance: "Distance (m)",
    gear: "Gear",
    poolLength: "Pool Length (m)",
    goalTime: "Time (s)",
  };
  const [editState, setEditState] = useState<Record<string, Partial<GoalTime>>>(
    {}
  );
  const [filters, setFilters] = useState({
    swimmer: "",
    stroke: "",
    distance: "",
  });
  const pageRef = useRef(null);

  useEffect(() => {
    anime({
      targets: pageRef.current,
      opacity: [0, 1],
      translateY: [50, 0],
      easing: "easeInOutQuad",
      duration: 800,
    });
  }, []);



  const fetchGoalTimes = async () => {
    let query = supabase.from("goal_times").select("*");

    if (swimStore.currentUser?.isAdmin) {
      if (filters.swimmer) {
        query = query.eq("UID", filters.swimmer);
      }
      if (filters.stroke) {
        query = query.eq("stroke", filters.stroke);
      }
      if (filters.distance) {
        query = query.eq("distance", parseInt(filters.distance, 10));
      }
    } else if (swimStore.currentUser?.userType === "coach") {
      const swimmerUIDs = swimStore.swimmerUsers.map((u) => u.UID);
      if (swimmerUIDs.length > 0) {
        query = query.in("UID", swimmerUIDs);
        if (filters.swimmer) {
          query = query.eq("UID", filters.swimmer);
        }
        if (filters.stroke) {
          query = query.eq("stroke", filters.stroke);
        }
        if (filters.distance) {
          query = query.eq("distance", parseInt(filters.distance, 10));
        }
      } else {
        setGoalTimes([]);
        return;
      }
    } else if (swimStore.currentUser?.UID) {
      query = query.eq("UID", swimStore.currentUser.UID);
    } else {
      setGoalTimes([]);
      return;
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching goal times:", error);
    } else {
      console.log("Fetched goal times data:", data);
      const times: GoalTime[] = data.map((d: any) => {
        const swimmerName = swimStore.users.find((u) => u.UID === d.UID)?.name;
        return { ...d, swimmerName, targetTime: d.goalTime };
      });
      setGoalTimes(times);
    }
  };

  useEffect(() => {
    fetchGoalTimes();
  }, [swimStore.currentUser?.email, filters, swimStore.users.length]);

  const handleAddGoalTime = async () => {
    if (
      strokes.includes(stroke) &&
      !isNaN(parseInt(distance, 10)) &&
      parseInt(distance, 10) > 0 &&
      gear.every((g) => gearOptions.includes(g)) &&
      !isNaN(parseFloat(time)) &&
      parseFloat(time) > 0
    ) {
      if (!swimStore.currentUser) {
        console.error("Cannot add goal time, user not logged in.");
        return;
      }
      const { error } = await supabase.from("goal_times").insert({
        id: generateUUID(),
        UID: swimStore.currentUser.UID,
        stroke,
        distance: parseInt(distance, 10),
        gear,
        poolLength,
        goalTime: parseFloat(time),
      });
      if (error) {
        console.error("Error adding goal time:", error);
      } else {
        setStroke("Freestyle");
        setDistance("");
        setGear([]);
        setTime("");
        setShowForm(false);
        fetchGoalTimes();
      }
    }
  };

  const handleGearChange = (event: SelectChangeEvent<string[]>) => {
    const {
      target: { value },
    } = event;
    setGear(typeof value === "string" ? value.split(",") : value);
  };

  const handleDeleteGoalTime = async (id: string) => {
    const { error } = await supabase.from("goal_times").delete().eq("id", id);
    if (error) {
      console.error("Error deleting goal time:", error);
    } else {
      setGoalTimes(goalTimes.filter((time) => time.id !== id));
    }
  };

  const handleUpdateGoalTime = async (
    id: string,
    updatedData: Partial<GoalTime>
  ) => {
    const { error } = await supabase
      .from("goal_times")
      .update(updatedData)
      .eq("id", id);
    if (error) {
      console.error("Error updating goal time:", error);
    } else {
      setGoalTimes(
        goalTimes.map((time) =>
          time.id === id ? { ...time, ...updatedData } : time
        )
      );
    }
  };

  const handleEditChange = (id: string, field: keyof GoalTime, value: any) => {
    setEditState((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]:
          field === "stroke" && !strokes.includes(value)
            ? prev[id]?.[field]
            : value,
      },
    }));
  };

  const handleSave = async (id: string) => {
    const originalRecord = goalTimes.find((goalTime) => goalTime.id === id);
    const updatedData = editState[id];
    if (originalRecord && updatedData) {
      const updatedRecord = { ...originalRecord, ...updatedData };
      if (typeof updatedRecord.gear === "string")
        updatedRecord.gear = (updatedRecord.gear as any)
          .split(",")
          .map((item: string) => item.trim());
      await handleUpdateGoalTime(id, updatedRecord);
      setEditState((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };

  const handleStartEditing = (record: GoalTime) => {
    const gearAsString = Array.isArray(record.gear)
      ? record.gear.join(", ")
      : record.gear;
    setEditState((prev) => ({
      ...prev,
      [record.id]: { ...record, gear: gearAsString as any },
    }));
  };

  const isEditable = (key: string) =>
    !["id", "UID", "swimmerName"].includes(key);

  const handleAdminFilterApply = () => {
    swimStore.applyGoalTimeFilters(filters);
    fetchGoalTimes();
  };

  const handleAdminFilterClear = () => {
    setFilters({ swimmer: "", stroke: "", distance: "" });
    swimStore.clearGoalTimeFilters();
    fetchGoalTimes();
  };

  const availableColumns = Object.keys(columnDisplayNames).map((key) => ({
    id: key,
    label: columnDisplayNames[key as keyof GoalTime],
  }));

  const handleColumnChange = (event: SelectChangeEvent<string[]>) => {
    swimStore.setVisibleGoalTimeColumns(event.target.value as any);
  };

  const cardStyles = {
    p: 2,
    background: "var(--color-background-card-gradient)",
    color: "var(--color-text-primary)",
    borderRadius: "16px",
    border: "1px solid var(--color-border)",
    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
  };
  const formInputStyles = {
    my: 1,
    "& .MuiInputBase-root": {
      backgroundColor: "#191919",
      color: "#FFFFFF",
      borderRadius: "8px",
    },
    "& .MuiInputLabel-root": { color: "#a9a9a9" },
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "#444" },
      "&:hover fieldset": { borderColor: "var(--color-accent-orange)" },
    },
    "& .MuiSvgIcon-root": { color: "#a9a9a9" },
  };
  const editFieldSx = {
    "& .MuiInputBase-input": { color: "var(--color-text-primary)" },
    "& .MuiInput-underline:before": {
      borderBottomColor: "var(--color-text-secondary)",
    },
  };

  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box ref={pageRef} sx={{ opacity: 0 }}>
      <Paper sx={cardStyles}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Manage Goal Times
          </Typography>

          <IconButton
            onClick={() => setShowForm(!showForm)}
            sx={{ color: "var(--color-accent-orange)" }}
          >
            <AddCircleOutlineIcon />
          </IconButton>
        </Box>

        {(swimStore.currentUser?.isAdmin ||
          swimStore.currentUser?.userType === "coach") && (
          <Paper
            sx={{
              p: 2,
              mb: 2,
              background: "rgba(0,0,0,0.2)",
              borderRadius: "8px",
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Filters
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <FormControl
                size="small"
                sx={{ ...formInputStyles, minWidth: 160 }}
              >
                <InputLabel>Swimmer</InputLabel>

                <Select
                  value={filters.swimmer}
                  onChange={(e) =>
                    setFilters({ ...filters, swimmer: e.target.value })
                  }
                  label="Swimmer"
                >
                  <MenuItem value="">(All)</MenuItem>

                  {(swimStore.currentUser?.isAdmin
                    ? [
                        ...new Map(
                          goalTimes.map((item) => [
                            item.UID,
                            {
                              UID: item.UID,
                              name: item.swimmerName || item.UID,
                            },
                          ])
                        ).values(),
                      ]
                    : swimStore.swimmerUsers
                  ).map((user) => (
                    <MenuItem key={user.UID} value={user.UID}>
                      {user.name}
                    </MenuItem>
                  ))}                </Select>
              </FormControl>

              <Button
                variant="contained"
                onClick={handleAdminFilterApply}
                sx={{ backgroundColor: "var(--color-accent-orange)" }}
              >
                Apply
              </Button>

              <Button
                variant="outlined"
                onClick={handleAdminFilterClear}
                sx={{
                  color: "var(--color-text-secondary)",
                  borderColor: "var(--color-text-secondary)",
                }}
              >
                Clear
              </Button>

              {!isMobile && (
                <FormControl
                  sx={{ ...formInputStyles, minWidth: 120 }}
                  size="small"
                >
                  <InputLabel>Columns</InputLabel>

                  <Select
                    multiple
                    value={swimStore.visibleGoalTimeColumns}
                    onChange={handleColumnChange}
                    input={<OutlinedInput label="Columns" />}
                    renderValue={(selected) => selected.join(", ")}
                  >
                    {availableColumns.map((column) => (
                      <MenuItem key={column.id} value={column.id}>
                        <Checkbox
                          checked={swimStore.visibleGoalTimeColumns.includes(
                            column.id as any
                          )}
                          sx={{
                            color: "var(--color-text-secondary)",
                            "&.Mui-checked": {
                              color: "var(--color-accent-orange)",
                            },
                          }}
                        />
                        <ListItemText primary={column.label} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          </Paper>
        )}

        <Collapse in={showForm}>
          <Box
            sx={{
              mt: 2,
              p: 2,
              background: "rgba(0,0,0,0.2)",
              borderRadius: "8px",
            }}
          >
            <Typography variant="h6">Add New Goal Time</Typography>



            <FormControl fullWidth sx={formInputStyles}>
              <InputLabel>Stroke</InputLabel>
              <Select
                value={stroke}
                onChange={(e) =>
                  setStroke(e.target.value as GoalTime["stroke"])
                }
              >
                {strokes.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Distance (meters)"
              type="number"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              sx={formInputStyles}
            />

            <FormControl fullWidth sx={formInputStyles}>
              <InputLabel>Pool Length</InputLabel>
              <Select
                value={poolLength}
                onChange={(e) => setPoolLength(e.target.value as 25 | 50)}
              >
                <MenuItem value={25}>25m</MenuItem>
                <MenuItem value={50}>50m</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Time (seconds)"
              type="number"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              sx={formInputStyles}
            />

            <FormControl fullWidth sx={formInputStyles}>
              <InputLabel>Gear</InputLabel>
              <Select
                multiple
                value={gear}
                onChange={handleGearChange}
                input={<OutlinedInput label="Gear" />}
                renderValue={(selected) => selected.join(", ")}
              >
                {gearOptions.map((g) => (
                  <MenuItem key={g} value={g}>
                    <Checkbox
                      checked={gear.indexOf(g) > -1}
                      sx={{
                        color: "var(--color-text-secondary)",
                        "&.Mui-checked": {
                          color: "var(--color-accent-orange)",
                        },
                      }}
                    />
                    <ListItemText primary={g} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={handleAddGoalTime}
              sx={{ mt: 2, backgroundColor: "var(--color-accent-orange)" }}
            >
              Add Goal
            </Button>
          </Box>
        </Collapse>

        {isMobile ? (
          <Box ref={pageRef}>
            {" "}
            {/* Using Box as a ref container for animations */}
            <Stack spacing={2} sx={{ mt: 2 }}>
              {goalTimes.map((record) => (
                <Paper
                  key={record.id}
                  elevation={2}
                  sx={{
                    p: 2,

                    background: "var(--color-background-card-light)",

                    borderRadius: 3,

                    border: "1px solid rgba(255, 255, 255, 0.05)",

                    cursor: "pointer",

                    "&:hover": { backgroundColor: "rgba(113, 126, 187, 0.1)" },
                  }}
                  className="dashboard-item" // For existing animations
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    color="primary.main"
                  >
                    {record.swimmerName || record.email}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {record.stroke} - {record.distance}m - {record.poolLength}m
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Time: {getColumnValue(record, "targetTime")}
                  </Typography>

                  {record.gear && record.gear.length > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Gear: {getColumnValue(record, "gear")}
                    </Typography>
                  )}

                  <Accordion
                    elevation={0}
                    sx={{ background: "transparent", mt: 1 }}
                  >
                    <AccordionSummary
                      expandIcon={
                        <ExpandMoreIcon
                          sx={{ color: "var(--color-text-secondary)" }}
                        />
                      }
                      aria-controls={`panel-${record.id}-content`}
                      id={`panel-${record.id}-header`}
                      sx={{
                        minHeight: "36px",
                        "& .MuiAccordionSummary-content": { margin: "8px 0" },
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Actions
                      </Typography>
                    </AccordionSummary>

                    <AccordionDetails sx={{ pt: 0 }}>
                      <Stack spacing={0.5}>
                        {swimStore.visibleGoalTimeColumns
                          .filter(
                            (col) =>
                              ![
                                "swimmerName",
                                "stroke",
                                "distance",
                                "poolLength",
                                "time",
                                "gear",
                              ].includes(col)
                          )
                          .map((column) => (
                            <Box
                              key={column}
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography variant="body2" fontWeight="bold">
                                {columnDisplayNames[column] || column}:
                              </Typography>

                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {String(getColumnValue(record, column) ?? "-")}
                              </Typography>
                            </Box>
                          ))}

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            mt: 2,
                          }}
                        >
                          {editState[record.id] ? (
                            <Button
                              onClick={() => handleSave(record.id)}
                              variant="contained"
                              size="small"
                              sx={{
                                backgroundColor: "var(--color-accent-green)",
                                mr: 1,
                              }}
                            >
                              Save
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleStartEditing(record)}
                              variant="outlined"
                              size="small"
                              sx={{
                                borderColor: "var(--color-accent-yellow)",
                                color: "var(--color-accent-yellow)",
                                mr: 1,
                              }}
                            >
                              Edit
                            </Button>
                          )}

                          <Button
                            onClick={() => handleDeleteGoalTime(record.id)}
                            variant="contained"
                            size="small"
                            sx={{ backgroundColor: "var(--color-accent-red)" }}
                          >
                            Delete
                          </Button>
                        </Box>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                </Paper>
              ))}
            </Stack>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 600, mt: 2, overflowX: "auto" }}>
            <Table stickyHeader aria-label="manage goal times table">
              <TableHead>
                <TableRow>
                  {(Object.keys(columnDisplayNames) as Array<keyof GoalTime>)
                    .filter((column) =>
                      swimStore.visibleGoalTimeColumns.includes(column)
                    )
                    .map((column) => (
                      <TableCell
                        key={column}
                        sx={{
                          backgroundColor: "rgba(0,0,0,0.3)",
                          color: "var(--color-text-primary)",
                          fontWeight: "bold",
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        {columnDisplayNames[column]}
                      </TableCell>
                    ))}
                  <TableCell
                    sx={{
                      backgroundColor: "rgba(0,0,0,0.3)",
                      color: "var(--color-text-primary)",
                      fontWeight: "bold",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {goalTimes.map((record) => (
                  <TableRow
                    key={record.id}
                    sx={{
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
                    }}
                  >
                    {(Object.keys(columnDisplayNames) as Array<keyof GoalTime>)
                      .filter((column) =>
                        swimStore.visibleGoalTimeColumns.includes(column)
                      )
                      .map((column) => (
                        <TableCell
                          key={column}
                          sx={{
                            color: "var(--color-text-secondary)",
                            borderBottom: "1px solid var(--color-border)",
                          }}
                        >
                          {editState[record.id] && isEditable(column) ? (
                            column === "stroke" ? (
                              <Select
                                value={String(
                                  editState[record.id]?.[column] ?? ""
                                )}
                                onChange={(e) =>
                                  handleEditChange(
                                    record.id,
                                    column,
                                    e.target.value as GoalTime["stroke"]
                                  )
                                }
                                variant="standard"
                                sx={editFieldSx}
                              >
                                {strokes.map((s) => (
                                  <MenuItem key={s} value={s}>
                                    {s}
                                  </MenuItem>
                                ))}
                              </Select>
                            ) : (
                              <TextField
                                variant="standard"
                                sx={editFieldSx}
                                value={String(
                                  editState[record.id]?.[column] ?? ""
                                )}
                                onChange={(e) =>
                                  handleEditChange(
                                    record.id,
                                    column,
                                    e.target.value
                                  )
                                }
                              />
                            )
                          ) : (
                            String(
                              getColumnValue(
                                {
                                  ...record,
                                  swimmerName: record.swimmerName,
                                  stroke: record.stroke as GoalTime["stroke"],
                                },
                                column
                              )
                            )
                          )}
                        </TableCell>
                      ))}

                    <TableCell
                      sx={{ borderBottom: "1px solid var(--color-border)" }}
                    >
                      {editState[record.id] ? (
                        <Button
                          onClick={() => handleSave(record.id)}
                          variant="contained"
                          size="small"
                          sx={{
                            backgroundColor: "var(--color-accent-green)",
                            mr: 1,
                          }}
                        >
                          Save
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleStartEditing(record)}
                          variant="outlined"
                          size="small"
                          sx={{
                            borderColor: "var(--color-accent-yellow)",
                            color: "var(--color-accent-yellow)",
                            mr: 1,
                          }}
                        >
                          Edit
                        </Button>
                      )}

                      <Button
                        onClick={() => handleDeleteGoalTime(record.id)}
                        variant="contained"
                        size="small"
                        sx={{ backgroundColor: "var(--color-accent-red)" }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
});

export default GoalTimes;
