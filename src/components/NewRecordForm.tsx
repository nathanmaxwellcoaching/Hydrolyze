import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  Autocomplete,
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  OutlinedInput,
  Grid,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import moment from "moment";

import { observer } from "mobx-react-lite";
import swimStore, { type Swim, type User } from "../store/SwimStore";

const computeSwimMetrics = (swim: Partial<Swim>) => {
  const { distance, duration, averageStrokeRate, heartRate } = swim;
  const metrics: { velocity?: number; sl?: number; si?: number; ie?: number } =
    {};

      if (distance && duration && duration > 0) {
        metrics.velocity = distance / duration;
  
        if (averageStrokeRate && averageStrokeRate > 0) {
          const totalStrokes = averageStrokeRate * (duration / 60);
          if (totalStrokes > 0) {
            metrics.sl = distance / totalStrokes;
            if (metrics.velocity && metrics.sl) {
              metrics.si = metrics.velocity * metrics.sl;
              if (heartRate && metrics.si > 0) {
                metrics.ie = heartRate / metrics.si;
              }
            }
          }
        }
      }  return metrics;
};

const NewRecordForm = observer(() => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [formState, setFormState] = useState<
    Omit<Swim, "id" | "swimmer"> & {
      swimmerName: string;
      targetPace?: number;
      // swimmerEmail: string; // Removed
      UID: string; // Added
      notes?: string;
      paceDistance?: number; // Changed from string to number
    }
  >({
    date: moment().format("YYYY-MM-DDTHH:mm"),
    targetTime: undefined,
    duration: 0,
    gear: [],
    poolLength: 25,
    stroke: "Freestyle",
    distance: 50,
    swimmerName: "",
    averageStrokeRate: undefined,
    heartRate: undefined,
    targetPace: undefined,
    // swimmerEmail: "", // Removed
    UID: "", // Added
    notes: "",
    paceDistance: undefined, // Changed from "" to undefined
  });
  const [strokeRateInput, setStrokeRateInput] = useState<string>("");
  const [durationInput, setDurationInput] = useState<string>("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [goalDistances, setGoalDistances] = useState<number[]>([]);
  const [goalTimeMap, setGoalTimeMap] = useState<Record<string, number>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [race, setRace] = useState(false); // Renamed from isRace
  const [showNotesField, setShowNotesField] = useState(false);

  const targetTimeReady = Boolean(
    formState.swimmerName &&
      formState.distance &&
      (race || formState.targetPace) // Renamed from isRace
  );



  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from("users").select("*");
      if (error) {
        console.error("Error loading users:", error);
      } else {
        setAllUsers(data as User[]);
        // If current user is a swimmer or coach, and allUsers are loaded,
        // ensure formState is correctly initialized with current user's details
        if (swimStore.currentUser && swimStore.currentUser.userType !== "admin") {
          setFormState((prev) => ({
            ...prev,
            swimmerName: swimStore.currentUser!.name,
            UID: swimStore.currentUser!.UID,
          }));
        }
      }
    };
    load();
  }, [swimStore.currentUser?.UID]); // Depend on currentUser.UID to re-run if user changes

  useEffect(() => {
    if (swimStore.currentUser) {
      setFormState((prev) => ({
        ...prev,
        swimmerName: swimStore.currentUser!.name,
        UID: swimStore.currentUser!.UID, // Changed from swimmerEmail
      }));
    }
  }, [swimStore.currentUser]);

  useEffect(() => {
    if (!formState.swimmerName) return;
    const userRec = allUsers.find((u) => u.name === formState.swimmerName);
    if (!userRec) return;
    (async () => {
      const { data, error } = await supabase
        .from("goal_times")
        .select("*")
        .eq("UID", userRec.UID);
      if (error) {
        console.error("Error loading goal times:", error);
        return;
      }
      const distances: number[] = [];
      const map: Record<string, number> = {};
      data.forEach((g) => {
        const gearStr =
          g.gear && g.gear.length ? g.gear.sort().join("-") : "NoGear";
        const key = `${g.distance}-${g.stroke}-${gearStr}-${g.poolLength}`;

        let timeValue: number | undefined;
        for (const field in g) {
          if (field === key) {
            timeValue = g[field];
            break;
          }
        }
        if (timeValue !== undefined) {
          map[key] = timeValue;
          distances.push(g.distance);
        }
      });
      setGoalDistances([...new Set(distances)].sort((a, b) => a - b));
      setGoalTimeMap(map);
      console.log("Populated goalTimeMap:", map);
    })();
  }, [formState.swimmerName, allUsers]);

  useEffect(() => {
    if (race) { // Renamed from isRace
      setFormState((prev) => ({
        ...prev,
        targetPace: prev.distance,
        gear: ["NoGear"],
      }));
    } else {
      setFormState((prev) => ({ ...prev, targetPace: undefined, gear: [] }));
    }
  }, [race, formState.distance]); // Renamed from isRace

  useEffect(() => {
    const { swimmerName, targetPace, distance, stroke, gear } = formState;
    const currentPace = race ? distance : targetPace; // Renamed from isRace
    console.log("TargetTime useEffect dependencies:", {
      swimmerName,
      currentPace,
      distance,
      stroke,
      gear,
      goalTimeMapLength: Object.keys(goalTimeMap).length,
    });
    if (
      !swimmerName ||
      !currentPace ||
      !distance ||
      Object.keys(goalTimeMap).length === 0
    )
      return;
    const gearStr = gear.length ? gear.sort().join("-") : "NoGear";
    const keyWithPoolLength = `${currentPace}-${stroke}-${gearStr}-${formState.poolLength}`;
    const keyWithoutPoolLength = `${currentPace}-${stroke}-${gearStr}`;

    let baseTime = goalTimeMap[keyWithPoolLength];
    if (baseTime == null) {
      baseTime = goalTimeMap[keyWithoutPoolLength];
    }
    console.log("TargetTime calculation values:", {
      baseTime,
      distance,
      currentPace,
    });
    if (baseTime == null || baseTime === 0 || currentPace === 0) {
      setFormState((prev) => ({ ...prev, targetTime: undefined }));
      return;
    }
    const scaled = (distance / currentPace) * baseTime;
    const final = Number(scaled.toFixed(1));
    setFormState((prev) => ({ ...prev, targetTime: final }));
  }, [
    formState.swimmerName,
    formState.targetPace,
    formState.distance,
    formState.stroke,
    formState.gear,
    goalTimeMap,
    race, // Renamed from isRace
  ]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    const numericFields = [
      "distance",
      "targetTime",
      "poolLength",
      "heartRate",
      "targetPace",
      "paceDistance", // Added paceDistance
    ];
    setFormState((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) : value,
    }));
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDurationInput(e.target.value);
  };

  const handleStrokeRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setStrokeRateInput(value);
    const rates = value
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));
    setFormState((prev) => ({
      ...prev,
      averageStrokeRate: rates.length
        ? rates.reduce((a, b) => a + b, 0) / rates.length
        : undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { swimmerName, UID } = formState; // Destructure UID from formState
    if (!swimmerName || !UID) { // Check for UID as well
      alert("Please select a swimmer.");
      return;
    }
    // No need for userRec lookup here, as UID is already in formState
    // const userRec = allUsers.find((u) => u.name === swimmerName.trim());
    // if (!userRec) {
    //   alert("No user found with that name");
    //   return;
    // }

    const durations = durationInput
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));

    if (durations.length === 0) {
      alert("Please enter a valid time for the swim.");
      return;
    }

    for (let i = 0; i < durations.length; i++) {
      const duration = durations[i];
      const date = moment(formState.date)
        .add(i * 10, "minutes")
        .format("YYYY-MM-DDTHH:mm");

      const swimRecord: any = {
        ...formState,
        UID: UID, // Use UID directly from formState
        duration,
        date,
        race, // Renamed from isRace
      };
      delete swimRecord.swimmerName;
      delete swimRecord.targetPace; // Always delete targetPace from the final record
      // If it's a race, override paceDistance with distance
      if (race) { // Renamed from isRace
        swimRecord.paceDistance = swimRecord.distance; // Removed String()
      } else if (swimRecord.paceDistance === undefined) { // Check for undefined
        // If not a race and paceDistance is undefined, keep it undefined
        // No change needed here, as it's already undefined by default
      }
      if (Number.isNaN(swimRecord.averageStrokeRate))
        swimRecord.averageStrokeRate = undefined;
      if (Number.isNaN(swimRecord.heartRate)) swimRecord.heartRate = undefined;

      try {
        await swimStore.addSwim(swimRecord);

        if (i === durations.length - 1) {
          const metrics = computeSwimMetrics(swimRecord);
          const achievementRate =
            swimRecord.targetTime && swimRecord.duration
              ? (
                  ((swimRecord.duration - swimRecord.targetTime) /
                    swimRecord.targetTime) *
                  100
                ).toFixed(2)
              : null;

          let ieInterpretation = "N/A";
          if (metrics.ie) {
            if (metrics.ie < 20) ieInterpretation = "Low effort – Fresh!";
            else if (metrics.ie <= 30)
              ieInterpretation = "Moderate – Sustainable";
            else ieInterpretation = "High – Fatigue building?";
          }

          setModalData({
            metrics,
            achievementRate,
            ieInterpretation,
          });
          setModalOpen(true);
        }
      } catch (err: any) {
        console.error(err);
        alert("Could not save: " + err.message);
      }
    }
  };

  const formInputStyles = {
    "& .MuiInputBase-root": {
      backgroundColor: "rgba(0, 0, 0, 0.2)",
      color: "var(--color-text-light)",
      borderRadius: "8px",
    },
    "& .MuiInputLabel-root": {
      color: "var(--color-text-secondary)",
      "&.Mui-focused": { color: "var(--color-accent-green)" },
    },
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
      "&:hover fieldset": { borderColor: "var(--color-accent-light-blue)" },
      "&.Mui-focused fieldset": {
        borderColor: "var(--color-accent-green)",
        borderWidth: "2px",
      },
      "&.Mui-focused": { boxShadow: "0 0 15px rgba(113, 235, 75, 0.5)" },
    },
    "& .MuiSvgIcon-root": { color: "var(--color-text-secondary)" },
  };

  const formContent = (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ p: isMobile ? 2 : 0, pb: isMobile ? 4 : 0 }}
    >
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: "bold",
          background: "var(--gradient-energetic)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Log New Swim Record
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Autocomplete
            freeSolo
            options={
              swimStore.currentUser?.userType === "coach"
                ? swimStore.swimmerUsers.map((u) => u.name)
                : allUsers.map((u) => u.name)
            }
            onInputChange={(_, val) => {
              const selectedUser = allUsers.find((u) => u.name === val);
              setFormState((p) => ({
                ...p,
                swimmerName: val,
                UID: selectedUser ? selectedUser.UID : "", // Set UID based on selected user
              }));
            }}
            value={formState.swimmerName}
            disabled={swimStore.currentUser?.userType === "swimmer"}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Swimmer Name"
                sx={formInputStyles}
              />
            )}
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={race} // Renamed from isRace
                onChange={(e) => setRace(e.target.checked)} // Renamed from setIsRace
              />
            }
            label="Race"
            sx={{ color: "var(--color-text-primary)" }}
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={showNotesField}
                onChange={(e) => setShowNotesField(e.target.checked)}
              />
            }
            label="Add Notes"
            sx={{ color: "var(--color-text-primary)" }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="datetime-local"
            label="Date"
            name="date"
            value={formState.date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            sx={formInputStyles}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Distance (m)"
            name="distance"
            value={formState.distance}
            onChange={handleChange}
            sx={formInputStyles}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth sx={formInputStyles}>
            <InputLabel>Stroke</InputLabel>
            <Select
              name="stroke"
              value={formState.stroke}
              onChange={handleChange}
            >
              <MenuItem value="Freestyle">Freestyle</MenuItem>
              <MenuItem value="Backstroke">Backstroke</MenuItem>
              <MenuItem value="Breaststroke">Breaststroke</MenuItem>
              <MenuItem value="Butterfly">Butterfly</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="text"
            label="Time Swum (seconds)"
            name="duration"
            value={durationInput}
            onChange={handleDurationChange}
            sx={formInputStyles}
            helperText="Comma-separated for multiple records"
          />
        </Grid>
        {!race && (
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth sx={formInputStyles}>
              <InputLabel>Target Pace</InputLabel>
              <Select
                name="targetPace"
                value={formState.targetPace ?? ""}
                onChange={handleChange}
                label="Target Pace"
              >
                {goalDistances.map((d) => (
                  <MenuItem key={d} value={d}>
                    {d} m
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
        {!race && ( // New Pace Distance field
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number" // Changed type to number
              label="Pace Distance (m)" // Changed label
              name="paceDistance"
              value={formState.paceDistance ?? ""} // Handle undefined for number input
              onChange={handleChange}
              sx={formInputStyles}
            />
          </Grid>
        )}
        {targetTimeReady && (
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Target Time (seconds) – suggested"
              name="targetTime"
              value={formState.targetTime || ""}
              onChange={handleChange}
              sx={formInputStyles}
            />
          </Grid>
        )}
        {!race && (
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth sx={formInputStyles}>
              <InputLabel>Gear Used</InputLabel>
              <Select
                multiple
                name="gear"
                value={formState.gear}
                onChange={handleChange}
                input={<OutlinedInput label="Gear Used" />}
                renderValue={(s) => (s as string[]).join(", ")}
              >
                {["Fins", "Paddles", "Pull Buoy", "Snorkel", "NoGear"].map(
                  (g) => (
                    <MenuItem key={g} value={g}>
                      {g}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>
          </Grid>
        )}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth sx={formInputStyles}>
            <InputLabel>Pool Length</InputLabel>
            <Select
              name="poolLength"
              value={formState.poolLength}
              onChange={handleChange}
            >
              <MenuItem value={25}>25m</MenuItem>
              <MenuItem value={50}>50m</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Average Stroke Rate"
            name="strokeRateInput"
            value={strokeRateInput}
            onChange={handleStrokeRateChange}
            helperText="Comma-separated values are averaged"
            sx={formInputStyles}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Heart Rate (HR)"
            name="heartRate"
            value={formState.heartRate || ""}
            onChange={handleChange}
            sx={formInputStyles}
          />
        </Grid>
        {showNotesField && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formState.notes}
              onChange={handleChange}
              multiline
              rows={3}
              sx={formInputStyles}
            />
          </Grid>
        )}
        <Grid item xs={12}>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 2,
              p: 1.5,
              backgroundColor: "var(--color-cta-primary)",
              color: "var(--color-text-light)",
              fontWeight: "bold",
              borderRadius: "12px",
              transition: "all 0.3s ease",
              "&:hover": {
                backgroundColor: "var(--color-cta-primary-hover)",
                transform: "scale(1.02)",
                boxShadow: "0 0 20px rgba(10, 78, 178, 0.7)",
              },
            }}
          >
            Add Record
          </Button>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <>
      {isMobile ? (
        <Box
          sx={{
            height: "calc(100vh - 56px)",
            overflowY: "auto",
            background: "var(--color-background-dark)",
          }}
        >
          {formContent}
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            p: 3,
          }}
        >
          <Box
            sx={{
              p: 4,
              width: "100%",
              maxWidth: 800,
              background: "var(--color-background-card)",
              borderRadius: "16px",
              boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
            }}
          >
            {formContent}
          </Box>
        </Box>
      )}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            background: "var(--color-background-card)",
            color: "var(--color-text-primary)",
            borderRadius: "16px",
            border: "1px solid var(--color-border)",
          },
        }}
      >
        <DialogTitle
          sx={{ textAlign: "center", fontWeight: "bold", fontSize: "1.5rem" }}
        >
          Swim Logged Successfully!
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ textAlign: "center", mt: 1 }}>
            {modalData?.achievementRate && (
              <Grid item xs={12}>
                <Typography variant="h6">Achievement</Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color:
                      modalData.achievementRate > 0
                        ? "var(--color-accent-red)"
                        : "var(--color-accent-green)",
                  }}
                >
                  {modalData.achievementRate > 0 ? "+" : ""}
                  {modalData.achievementRate}%
                </Typography>
                <Typography variant="caption">from target time</Typography>
              </Grid>
            )}

            <Grid item xs={12} sm={4}>
              <Tooltip title="Stroke Length: Distance traveled per stroke. Longer is often more efficient.">
                <Box>
                  <Typography variant="h6">SL</Typography>
                  <Typography variant="h5">
                    {modalData?.metrics?.sl?.toFixed(2) ?? "N/A"} m/str
                  </Typography>
                </Box>
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Tooltip title="Swim Index: A measure of overall efficiency, combining speed and stroke length.">
                <Box>
                  <Typography variant="h6">SI</Typography>
                  <Typography variant="h5">
                    {modalData?.metrics?.si?.toFixed(2) ?? "N/A"}
                  </Typography>
                </Box>
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Tooltip title="Internal/External Ratio: The physiological cost (heart rate) for the mechanical work done (Swim Index).">
                <Box>
                  <Typography variant="h6">IE Ratio</Typography>
                  <Typography variant="h5">
                    {modalData?.metrics?.ie?.toFixed(2) ?? "N/A"}
                  </Typography>
                </Box>
              </Tooltip>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", p: 2 }}>
          <Button
            onClick={() => navigate("/")}
            variant="contained"
            sx={{ backgroundColor: "var(--color-cta-primary)" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

export default NewRecordForm;
