import { makeAutoObservable, runInAction, computed } from "mobx";
import { supabase } from "../lib/supabaseClient";
import axios from "axios";
import {
  calculateMean,
  calculateStdDev,
  calculateHrZoneTimes,
  calculateAge,
} from "../utils/statistics";

export interface User {
  id?: string; // Optional, if the table has its own primary key
  UID: string; // Supabase UID
  name: string;
  email: string;
  isAdmin: boolean;
  userType: "swimmer" | "coach";
  stravaClientId?: number;
  stravaClientSecret?: string;
  coaches?: string[]; // for swimmers
  dob?: string; // Date of birth in YYYY-MM-DD format
}

export interface HrZoneDefinition {
  name: string;
  min: number; // as a percentage of max HR (e.g., 0.5 for 50%)
  max: number; // as a percentage of max HR (e.g., 0.6 for 60%)
  color: string;
}

export interface StravaSession {
  id: string; // Strava Activity ID
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  start_date: string; // ISO 8601 format
  average_heartrate?: number;
  max_heartrate?: number;
  swimmerEmail: string;
  hrZoneTimes?: { name: string; value: number; color: string }[];
}

export interface Swim {
  id: string; // Changed to string to accommodate Supabase UUIDs
  UID: string; // Foreign key to users.UID
  date: string;
  distance: number;
  duration: number;
  targetTime?: number;
  // swimmerEmail: string; // Removed
  stroke: "Freestyle" | "Backstroke" | "Breaststroke" | "Butterfly";
  gear: ("Fins" | "Paddles" | "Pull Buoy" | "Snorkel" | "NoGear")[];
  poolLength: 25 | 50;
  averageStrokeRate?: number;
  heartRate?: number;
  paceDistance?: number; // Changed from string to number
  velocity?: number; // Velocity (m/s)
  sl?: number; // Stroke Length (m/stroke)
  si?: number; // Swim Index (m^2/stroke)
  ie?: number; // Internal-to-External Load Ratio (bpm/m^2/stroke)
  stravaActivity?: string; // ID of the parent StravaSession - Renamed from parentId
  race?: boolean; // True if this was a race result
}

export const CANONICAL_COLUMN_ORDER: (keyof Swim)[] = [
  "id",
  "date",
  "UID", // Changed from swimmerEmail
  "distance",
  "stroke",
  "duration",
  "targetTime",
  "gear",
  "poolLength",
  "averageStrokeRate",
  "heartRate",
  "paceDistance",
  "velocity",
  "sl",
  "si",
  "ie",
  "stravaActivity", // Renamed from parentId
  "race",
];

interface Filters {
  stroke: string | null;
  distance: number | null;
  gear: string[] | null;
  poolLength: number | null;
  startDate: string | null;
  endDate: string | null;
  paceDistance: string | null;
  swimmerUID: string | null; // Changed from swimmerEmail
}

export interface GoalTime {
  id: string;
  UID: string;
  swimmerName?: string;
  stroke: "Freestyle" | "Backstroke" | "Breaststroke" | "Butterfly";
  distance: number;
  gear: ("Fins" | "Paddles" | "Pull Buoy" | "Snorkel" | "NoGear")[];
  poolLength: 25 | 50;
  goalTime: number;
}

export const GOAL_TIMES_CANONICAL_COLUMN_ORDER: (keyof GoalTime)[] = [
  "id",
  "UID",
  "swimmerName",
  "stroke",
  "distance",
  "gear",
  "poolLength",
  "goalTime",
];

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

class SwimStore {
  swims: Swim[] = [];
  stravaSessions: StravaSession[] = [];
  users: User[] = [];
  currentUser: User | null = null;
  isLoading = true;
  activeFilters: Filters = {
    stroke: null,
    distance: null,
    gear: null,
    poolLength: null,
    startDate: null,
    endDate: null,
    paceDistance: null,
    swimmerUID: null, // Changed from swimmerEmail
  };
  visibleColumns: (keyof Swim)[] = CANONICAL_COLUMN_ORDER.filter(
    (col) =>
      ![
        "id",
        "poolLength",
        "averageStrokeRate",
        "heartRate",
        "velocity",
        "sl",
        "si",
        "ie",
      ].includes(col as string)
  );
  showTrendlineDetails = false;
  showSwimTimesChart = true;
  showDonutChart = false;
  showVelocityDistanceChart = false;
  velocityChartYAxis: "v_swim" | "si" | "ie" | "stroke_length" = "v_swim";
  strokeDistributionMetric: "records" | "distance" = "records";
  sortOrder: "date" | "duration" = "date";
  visibleGoalTimeColumns: (keyof GoalTime)[] = [
    "swimmerName",
    "stroke",
    "distance",
    "gear",
    "poolLength",
    "goalTime",
  ];
  sdChartYAxis:
    | "si"
    | "velocity"
    | "ie"
    | "averageStrokeRate"
    | "sl"
    | "duration" = "velocity";

  // HR Zone related state
  user_max_hr: number | null = null;
  hrZoneDefinitions: HrZoneDefinition[] = [
    { name: "Zone 1 (Very Light)", min: 0.5, max: 0.6, color: "#a8e063" },
    { name: "Zone 2 (Light)", min: 0.6, max: 0.7, color: "#56ab2f" },
    { name: "Zone 3 (Moderate)", min: 0.7, max: 0.8, color: "#fbd786" },
    { name: "Zone 4 (Hard)", min: 0.8, max: 0.9, color: "#f7797d" },
    { name: "Zone 5 (Maximum)", min: 0.9, max: 1.0, color: "#c62828" },
  ];

  // State for the global record detail modal
  isRecordDetailModalOpen = false;
  selectedRecordForDetail: Swim | StravaSession | null = null;

  constructor() {
    makeAutoObservable(this, {
      userSwims: computed,
      filteredSwims: computed,
      swimsForVelocityChart: computed,
      personalBests: computed,
      allFiltersSet: computed,
      achievementRates: computed,
      averageAndSd: computed,
      velocityDistanceData: computed,
      isAuthenticated: computed,
      outlierSwims: computed,
      sdChartData: computed,
    });
    this.setupSupabaseAuthObserver();
  }

  openRecordDetailModal = (record: Swim | StravaSession) => {
    this.selectedRecordForDetail = record;
    this.isRecordDetailModalOpen = true;
  };

  closeRecordDetailModal = () => {
    this.isRecordDetailModalOpen = false;
    this.selectedRecordForDetail = null;
  };

  private async getStravaAccessToken(): Promise<string | null> {
    if (
      !this.currentUser ||
      !this.currentUser.stravaClientId ||
      !this.currentUser.stravaClientSecret
    ) {
      console.warn("Current user or Strava credentials not available.");
      return null;
    }

    // Fallback: If userMaxHr is not set, try to calculate from dob
    if (this.user_max_hr === null && this.currentUser.dob) {
      const age = calculateAge(this.currentUser.dob);
      if (age !== null) {
        this.user_max_hr = 220 - age;
        // Do not persist this calculated value unless user explicitly saves it
      }
    }

    if (this.user_max_hr === null) {
      console.warn(
        "Cannot fetch Strava HR data: user Max HR is not set and cannot be calculated from DOB."
      );
      return null;
    }

    try {
      // Assuming a backend endpoint to handle Strava OAuth token refresh/exchange
      const session = await supabase.auth.getSession();
      const token = session?.data.session?.access_token;
      if (!token) {
        console.warn("No Supabase session token found.");
        return null;
      }

      const response = await axios.post(
        "http://localhost:10000/strava/token",
        {
          clientId: this.currentUser.stravaClientId,
          clientSecret: this.currentUser.stravaClientSecret,
          // Potentially include a refresh token if stored, or handle initial auth flow
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.access_token;
    } catch (error) {
      console.error("Failed to get Strava access token:", error);
      return null;
    }
  }

  async loadStravaSessions() {
    try {
      const { data: sessionList, error } = await supabase
        .from("strava_sessions")
        .select("*");
      if (error) {
        console.error("Error loading Strava sessions:", error);
        return;
      }

      const enrichedSessions: StravaSession[] = [];
      let accessToken: string | null = null;
      if (
        sessionList.length > 0 &&
        this.user_max_hr &&
        this.currentUser?.stravaClientId &&
        this.currentUser?.stravaClientSecret
      ) {
        accessToken = await this.getStravaAccessToken();
      }

      for (const session of sessionList) {
        if (accessToken && this.user_max_hr) {
          try {
            const streamsResponse = await axios.get(
              `https://www.strava.com/api/v3/activities/${session.id}/streams?keys=heartrate&key_by_type=true`,
              {
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            );

            const heartrateStream = streamsResponse.data.heartrate?.data;
            const hrZoneTimes = calculateHrZoneTimes(
              heartrateStream,
              this.user_max_hr,
              this.hrZoneDefinitions
            );
            enrichedSessions.push({ ...session, hrZoneTimes });
          } catch (error) {
            console.error(
              `Failed to fetch Strava streams for activity ${session.id}:`,
              error
            );
            enrichedSessions.push(session); // push session without enrichment on error
          }
        } else {
          enrichedSessions.push(session);
        }
      }

      runInAction(() => {
        this.stravaSessions = enrichedSessions;
      });
    } catch (e) {
      console.error("Unhandled error in loadStravaSessions:", e);
    }
  }

  setupSupabaseAuthObserver() {
    supabase.auth.onAuthStateChange(async (event, session) => {
      runInAction(() => {
        this.isLoading = true;
      }); // Fixed MobX strict mode error

      console.log("Auth state change event:", event);
      console.log("Auth state change session:", session);
      console.log(
        "setupSupabaseAuthObserver - Initial: isLoading=",
        this.isLoading,
        "isAuthenticated=",
        this.isAuthenticated,
        "currentUser=",
        this.currentUser?.UID
      );

      if (session?.user) {
        console.log("Session user ID:", session.user.id);
        console.log(
          "setupSupabaseAuthObserver - Before dispatching fetchUserProfile action. session.user.id:",
          session.user.id
        );

        // Dispatch an action to fetch the user profile
        this.fetchUserProfile(session.user.id, session.user.email!); // Pass user ID and email
      } else {
        runInAction(() => {
          this.currentUser = null;
          this.isLoading = false;
          console.log(
            "setupSupabaseAuthObserver - Else block: isLoading=",
            this.isLoading,
            "isAuthenticated=",
            this.isAuthenticated,
            "currentUser=",
            this.currentUser?.UID
          );
        });
      }
    });
  }

  // New action to fetch user profile
  async fetchUserProfile(uid: string, email: string) {
    let profile;
    let error;
    try {
      const result = await supabase
        .from("users")
        .select(
          "UID, name, email, isAdmin, userType, stravaClientId, stravaClientSecret, coaches, dob"
        )
        .eq("UID", uid)
        .maybeSingle();
      profile = result.data;
      error = result.error;
      console.log("fetchUserProfile - Supabase fetch result:", result);
    } catch (e) {
      console.error(
        "fetchUserProfile - Uncaught error during Supabase user fetch:",
        e
      );
      error = e;
    }

    runInAction(async () => {
      let userProfileData = profile;

      if (error) {
        console.error("Error fetching user profile:", error);
        console.log("Session user object:", { id: uid, email: email });
        console.log("Profile data (on error):", userProfileData);
        console.log("Error details:", error.details);
        console.log("Error hint:", error.hint);
      } else {
        console.log("Fetched user profile:", userProfileData);
        if (userProfileData === null) {
          console.warn(
            "No user profile found in public.users for authenticated user ID:",
            uid
          );
          // Attempt to create a basic profile if one doesn't exist
          const { data: newProfile, error: createError } = await supabase
            .from("users")
            .upsert({
              UID: uid,
              email: email,
              name: email.split("@")[0],
              isAdmin: false,
              userType: "swimmer",
            })
            .select()
            .single();

          if (createError) {
            console.error("Error creating basic user profile:", createError);
          } else if (newProfile) {
            userProfileData = newProfile;
            console.log("Basic user profile created:", userProfileData);
          }
        }
      }

      const userObj: User = userProfileData || {
        UID: uid,
        email: email,
        name: email.split("@")[0],
        isAdmin: false,
        userType: "swimmer",
      };

      this.currentUser = userObj;
      console.log(
        "fetchUserProfile - After currentUser set: currentUser=",
        this.currentUser?.UID,
        "isAuthenticated=",
        this.isAuthenticated
      );

      if (userObj.dob) {
        const age = calculateAge(userObj.dob);
        if (age !== null) {
          this.user_max_hr = 220 - age;
        }
      }

      if (userObj.isAdmin || userObj.userType === "coach") {
        await this.loadUsers();
      }
      await this.loadSwims();
      // Load Strava sessions in the background
      this.loadStravaSessions();
      console.log(
        "fetchUserProfile - Before isLoading=false: isLoading=",
        this.isLoading,
        "isAuthenticated=",
        this.isAuthenticated
      );
      runInAction(() => {
        this.isLoading = false;
        console.log(
          "fetchUserProfile - After isLoading=false: isLoading=",
          this.isLoading,
          "isAuthenticated=",
          this.isAuthenticated
        );
      });    });
  }

  async loadSwims() {
    if (!this.currentUser) {
      console.warn("Cannot load swims: No current user.");
      return;
    }

    let query = supabase
      .from("swimRecords")
      .select("*")
      .order("date", { ascending: false });

    if (this.currentUser.userType === 'coach') {
      const swimmerUIDs = this.swimmerUsers.map((u) => u.UID);
      if (swimmerUIDs.length > 0) {
        query = query.in('UID', swimmerUIDs);
      } else {
        // If a coach has no swimmers, return an empty list
        runInAction(() => {
          this.swims = [];
        });
        return;
      }
    } else if (!this.currentUser.isAdmin) {
      query = query.eq("UID", this.currentUser.UID);
    }

    const { data: swimList, error } = await query;

    if (error) {
      console.error("Error loading swims:", error);
      return;
    }

    runInAction(() => {
      this.swims = swimList.map((s) => {
        // const user = this.users.find((u) => u.UID === s.UID);
        // const swimmerEmail = user ? user.email : "unknown@example.com"; // Fallback email - Removed

        // Backfill metrics for older records
        let { velocity, sl, si, ie } = s;

        if (s.duration > 0) {
          // Use == null to check for both null and undefined
          if (velocity == null) {
            velocity = parseFloat((s.distance / s.duration).toFixed(2));
          }

          if (s.averageStrokeRate && s.averageStrokeRate > 0) {
            const totalStrokes = s.averageStrokeRate * (s.duration / 60);
            if (totalStrokes > 0) {
              if (sl == null) {
                sl = parseFloat((s.distance / totalStrokes).toFixed(2));
              }
              if (si == null && sl != null && velocity != null) {
                si = parseFloat((velocity * sl).toFixed(2));
              }
              if (ie == null && s.heartRate && si != null && si > 0) {
                ie = parseFloat((s.heartRate / si).toFixed(2));
              }
            }
          }
        }

        return { ...s, velocity, sl, si, ie };
      });
      if (this.swims.length > 0) {
        const mostRecentSwim = this.swims.reduce((prev, current) =>
          new Date(prev.date) > new Date(current.date) ? prev : current
        );
        this.activeFilters = {
          stroke: mostRecentSwim.stroke,
          distance: mostRecentSwim.distance,
          gear: mostRecentSwim.gear,
          poolLength: mostRecentSwim.poolLength,
          startDate: null,
          endDate: null,
          paceDistance: mostRecentSwim.paceDistance || null,
          swimmerEmail: mostRecentSwim.swimmerEmail,
        };
      }
    });
  }

  async loadUsers() {
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data.session?.access_token;
      if (!token) return [];
      const response = await axios.get("http://localhost:10000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Fetched users:", response.data);
      runInAction(() => {
        this.users = response.data;
      });
      return response.data;
    } catch (e) {
      console.error("Unhandled error in loadUsers:", e);
      return [];
    }
  }

  async updateUser(id: string, updatedData: Partial<User>) {
    const session = await supabase.auth.getSession();
    const token = session?.data.session?.access_token;
    if (!token) return;
    await axios.put(`http://localhost:10000/api/users/${id}`, updatedData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    this.loadUsers();
  }

  async deleteUser(id: string) {
    const session = await supabase.auth.getSession();
    const token = session?.data.session?.access_token;
    if (!token) return;
    await axios.delete(`http://localhost:10000/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    this.loadUsers();
  }

  async login(email: string, password: string): Promise<boolean> {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error("Login failed:", error.message);
      return false;
    }
    return true;
  }

  async logout() {
    await supabase.auth.signOut();
  }

  get isAuthenticated() {
    return this.currentUser !== null;
  }

  async register(
    name: string,
    email: string,
    password: string,
    userType: "swimmer" | "coach",
    stravaClientId?: string,
    stravaClientSecret?: string
  ) {
    const {
      data: { user },
      error: signUpErr,
    } = await supabase.auth.signUp({ email, password });
    if (signUpErr) throw signUpErr;
    if (!user) throw new Error("Registration failed, user not created.");

    const userData: Partial<User> = {
      UID: user.id,
      name: name,
      email: email,
      isAdmin: false,
      userType: userType,
      ...(userType === "coach" && { coaches: [] }),
    };

    if (stravaClientId) {
      userData.stravaClientId = Number(stravaClientId);
    }
    if (stravaClientSecret) {
      userData.stravaClientSecret = stravaClientSecret;
    }

    const { error: profileError } = await supabase
      .from("users")
      .upsert(userData);

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // Handle profile creation error, maybe delete the user?
    }

    this.loadUsers(); // Refresh the list of users
  }

  applyFilters(filters: Partial<Filters>) {
    this.activeFilters = { ...this.activeFilters, ...filters };
  }

  clearFilters() {
    this.activeFilters = {
      stroke: null,
      distance: null,
      gear: null,
      poolLength: null,
      startDate: null,
      endDate: null,
      paceDistance: null,
      swimmerUID: null, // Changed from swimmerEmail
    };
  }

  setVisibleColumns(columns: (keyof Swim)[]) {
    if (columns.length > 0) {
      this.visibleColumns = columns;
    }
  }

  toggleTrendlineDetails(show: boolean) {
    this.showTrendlineDetails = show;
  }

  toggleSwimTimesChart(show: boolean) {
    this.showSwimTimesChart = show;
  }

  toggleDonutChart(show: boolean) {
    this.showDonutChart = show;
  }

  toggleVelocityDistanceChart(show: boolean) {
    this.showVelocityDistanceChart = show;
  }

  setVelocityChartYAxis(metric: "v_swim" | "si" | "ie" | "stroke_length") {
    this.velocityChartYAxis = metric;
  }

  setStrokeDistributionMetric(metric: "records" | "distance") {
    this.strokeDistributionMetric = metric;
  }

  setSortOrder(order: "date" | "duration") {
    this.sortOrder = order;
  }

  setSdChartYAxis(
    metric: "si" | "velocity" | "ie" | "averageStrokeRate" | "sl" | "duration"
  ) {
    this.sdChartYAxis = metric;
  }

  setVisibleGoalTimeColumns(columns: (keyof GoalTime)[]) {
    this.visibleGoalTimeColumns = columns;
  }

  setUserMaxHr(maxHr: number | null) {
    this.user_max_hr = maxHr;
    // Do not update the database with userMaxHr as it's a calculated field
  }

  applyGoalTimeFilters(filters: any) {
    // Assuming you want to store goal time filters separately from swim filters
    // You might need to define a new state property for goal time filters in SwimStore
    console.log("Applying goal time filters:", filters);
  }

  clearGoalTimeFilters() {
    // Clear the goal time filters
    console.log("Clearing goal time filters");
  }

  get userSwims() {
    if (this.currentUser) {
      if (this.currentUser.isAdmin) {
        return this.swims;
      }
      if (this.currentUser.userType === "coach") {
        const associatedSwimmerUIDs = this.swimmerUsers.map((u) => u.UID);
        return this.swims.filter((swim) =>
          associatedSwimmerUIDs.includes(swim.UID)
        );
      }
      const currentUserUID = this.currentUser.UID;
      return this.swims.filter((swim) => swim.UID === currentUserUID);
    }
    return []; // If no user is logged in, show no swims
  }

  get swimsForVelocityChart() {
    return this.userSwims.filter((swim) => {
      const { stroke, gear, poolLength, startDate, endDate, paceDistance } =
        this.activeFilters;
      if (stroke && swim.stroke !== stroke) return false;
      if (poolLength && swim.poolLength !== poolLength) return false;
      if (paceDistance && swim.paceDistance !== paceDistance) return false;
      if (gear && gear.length > 0) {
        if (gear.includes("NoGear") && swim.gear.length === 0) {
          return true;
        }
        if (!gear.some((g) => swim.gear.includes(g as any))) return false;
      }
      if (startDate && new Date(swim.date) < new Date(startDate)) return false;
      if (endDate && new Date(swim.date) > new Date(endDate)) return false;
      return true;
    });
  }

  get velocityDistanceData() {
    const groups = this.swimsForVelocityChart.reduce((acc, swim) => {
      const gearStr =
        swim.gear && swim.gear.length > 0 ? swim.gear.join(",") : "NoGear";
      const key = `${swim.swimmerEmail}-${swim.stroke}-${swim.distance}-${gearStr}-${swim.poolLength}-${swim.paceDistance}`;

      if (!acc[key]) {
        const shortEmail = swim.swimmerEmail.split("@")[0];
        const shortStroke = swim.stroke.substring(0, 3);
        const shortGear =
          gearStr.length > 10 ? gearStr.substring(0, 10) + "..." : gearStr;
        acc[key] = {
          label: `${shortEmail}-${shortStroke}-${swim.distance}m-${shortGear}-${swim.poolLength}m-${swim.paceDistance}`,
          data: [],
        };
      }

      let yValue;
      switch (this.velocityChartYAxis) {
        case "v_swim":
          yValue = swim.velocity ?? 0;
          break;
        case "stroke_length":
          yValue = swim.sl ?? 0;
          break;
        case "si":
          yValue = swim.si ?? 0;
          break;
        case "ie":
          yValue = swim.ie ?? 0;
          break;
        default:
          yValue = 0;
      }

      acc[key].data.push({ x: swim.distance, y: yValue });
      return acc;
    }, {} as Record<string, { label: string; data: { x: number; y: number }[] }>);

    return Object.values(groups).map((group) => {
      const aggregatedData = group.data.reduce((acc, item) => {
        if (!acc[item.x]) {
          acc[item.x] = { sum: 0, count: 0 };
        }
        acc[item.x].sum += item.y;
        acc[item.x].count++;
        return acc;
      }, {} as Record<number, { sum: number; count: number }>);

      return {
        name: group.label,
        data: Object.entries(aggregatedData)
          .map(([distance, { sum, count }]) => ({
            x: `${distance}m`,
            y: parseFloat((sum / count).toFixed(2)),
          }))
          .sort((a, b) => parseInt(a.x) - parseInt(b.x)),
      };
    });
  }
  get filteredSwims() {
    let filtered = this.userSwims.filter((swim) => {
      const {
        stroke,
        distance,
        gear,
        poolLength,
        startDate,
        endDate,
        paceDistance,
        swimmerUID, // Changed from swimmerEmail
      } = this.activeFilters;
      if (stroke && swim.stroke !== stroke) return false;
      if (distance && swim.distance !== distance) return false;
      if (poolLength && swim.poolLength !== poolLength) return false;
      if (paceDistance && swim.paceDistance !== paceDistance) return false;
      if (swimmerUID && swim.UID !== swimmerUID) return false;
      if (gear && gear.length > 0) {
        if (gear.includes("NoGear") && swim.gear.length === 0) {
          return true;
        }
        if (!gear.some((g) => swim.gear.includes(g as any))) return false;
      }
      if (startDate && new Date(swim.date) < new Date(startDate)) return false;
      if (endDate && new Date(swim.date) > new Date(endDate)) return false;
      return true;
    });

    if (this.sortOrder === "date") {
      filtered = filtered.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } else if (this.sortOrder === "duration") {
      filtered = filtered.sort((a, b) => a.duration - b.duration);
    }

    return filtered;
  }

  get filterContext() {
    const { distance, stroke, gear, paceDistance, swimmerUID } =
      this.activeFilters;
    const swimmerName = swimmerUID
      ? this.users.find((u) => u.UID === swimmerUID)?.name || swimmerUID
      : "";
    return `${swimmerName} ${distance || ""}m ${stroke || ""} ${
      gear?.join(" ") || ""
    } ${paceDistance || ""}m pace`.trim();
  }

  get strokeDistribution() {
    const swims = this.userSwims.filter((swim) => {
      const { startDate, endDate } = this.activeFilters;
      if (startDate && new Date(swim.date) < new Date(startDate)) return false;
      if (endDate && new Date(swim.date) > new Date(endDate)) return false;
      return true;
    });

    const distribution = swims.reduce((acc, swim) => {
      if (this.strokeDistributionMetric === "records") {
        acc[swim.stroke] = (acc[swim.stroke] || 0) + 1;
      } else {
        acc[swim.stroke] = (acc[swim.stroke] || 0) + swim.distance;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
    }));
  }

  get allFiltersSet() {
    const { stroke, distance, gear, poolLength } = this.activeFilters;
    return !!(
      this.currentUser &&
      stroke &&
      distance &&
      gear &&
      gear.length > 0 &&
      poolLength
    );
  }

  get uniqueSwimmers() {
    if (this.currentUser) {
      if (this.currentUser.userType === "coach") {
        return this.users
          .filter((user) => user.coaches?.includes(this.currentUser!.UID))
          .map((user) => user.name);
      }
      return [this.currentUser.name];
    }
    return [];
  }

  get swimmerUsers(): User[] {
    if (this.currentUser && this.currentUser.userType === "coach") {
      return this.users.filter((user) =>
        user.coaches?.includes(this.currentUser!.UID)
      );
    }
    return [];
  }

  get uniqueStrokes() {
    return [...new Set(this.userSwims.map((s) => s.stroke))];
  }

  get uniqueDistances() {
    return Array.from(new Set(this.userSwims.map((s) => s.distance))).sort(
      (a: number, b: number) => a - b
    );
  }

  get uniqueGear() {
    return ["Fins", "Paddles", "Pull Buoy", "Snorkel", "NoGear"];
  }

  get uniquePoolLengths() {
    return [...new Set(this.userSwims.map((s) => s.poolLength))].sort(
      (a, b) => a - b
    );
  }

  get uniquePaceDistances() {
    return [
      ...new Set(this.userSwims.map((s) => s.paceDistance).filter(Boolean)),
    ].sort();
  }

  get averagePace() {
    const swimsToConsider =
      this.filteredSwims.length > 0 ? this.filteredSwims : this.userSwims;
    if (swimsToConsider.length === 0) return 0;
    const totalDistance = swimsToConsider.reduce(
      (acc, s) => acc + s.distance,
      0
    );
    const totalDuration = swimsToConsider.reduce(
      (acc, s) => acc + s.duration,
      0
    );
    return totalDuration / (totalDistance / 100);
  }

  get averageAndSd() {
    if (!this.allFiltersSet || this.filteredSwims.length === 0) {
      return null;
    }

    const durations = this.filteredSwims.map((swim) => swim.duration);
    const sum = durations.reduce((acc, val) => acc + val, 0);
    const average = sum / durations.length;

    const variance =
      durations.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) /
      durations.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      average: parseFloat(average.toFixed(2)),
      standardDeviation: parseFloat(standardDeviation.toFixed(2)),
      swimCount: this.filteredSwims.length,
    };
  }

  get personalBests() {
    if (!this.allFiltersSet || this.filteredSwims.length === 0) {
      return null;
    }
    return this.filteredSwims.reduce((prev, current) =>
      prev.duration < current.duration ? prev : current
    );
  }

  get outlierSwims() {
    if (this.filteredSwims.length < 2) {
      return [];
    }

    const durations = this.filteredSwims.map((swim) => swim.duration);
    const lastSwim = this.filteredSwims[0];
    const historicalDurations = durations.slice(1);

    const mean = calculateMean(historicalDurations);
    const stdDev = calculateStdDev(historicalDurations);

    const upperThreshold = mean + 2 * stdDev;
    const lowerThreshold = mean - 2 * stdDev;

    if (
      lastSwim.duration > upperThreshold ||
      lastSwim.duration < lowerThreshold
    ) {
      return [lastSwim];
    }

    return [];
  }

  get sdChartData() {
    const metric = this.sdChartYAxis;
    const swims = this.filteredSwims.filter(
      (s) => s[metric] !== undefined && s[metric] !== null
    );

    if (swims.length === 0) {
      return null;
    }

    const values = swims.map((s) => s[metric] as number);
    const mean = calculateMean(values);
    const stdDev = calculateStdDev(values);

    const upper2SD = mean + 2 * stdDev;
    const lower2SD = mean - 2 * stdDev;

    return {
      series: [
        {
          name: metric,
          data: swims.map((s) => [new Date(s.date).getTime(), s[metric]]),
        },
      ],
      mean,
      upper2SD,
      lower2SD,
    };
  }

  get achievementRates() {
    const swimsWithTarget = this.filteredSwims.filter(
      (swim) => swim.targetTime !== undefined
    );

    if (swimsWithTarget.length === 0) {
      return null; // No swims with target times to calculate
    }

    let metOrBeatTarget = 0;
    let totalPercentageDifference = 0;
    let totalTargetTime = 0;

    swimsWithTarget.forEach((swim) => {
      if (swim.duration <= (swim.targetTime || 0)) {
        metOrBeatTarget++;
      }
      const difference =
        ((swim.duration - (swim.targetTime || 0)) / (swim.targetTime || 1)) *
        100;
      totalPercentageDifference += difference;
      totalTargetTime += swim.targetTime || 0;
    });

    const percentageMetOrBeat =
      (metOrBeatTarget / swimsWithTarget.length) * 100;
    const averagePercentageDifference =
      totalPercentageDifference / swimsWithTarget.length;
    const averageTargetTime = totalTargetTime / swimsWithTarget.length;

    return {
      percentageMetOrBeat: percentageMetOrBeat.toFixed(2),
      averagePercentageDifference: averagePercentageDifference,
      averageTargetTime: averageTargetTime,
      successfulAttempts: metOrBeatTarget,
      totalAttempts: swimsWithTarget.length,
    };
  }

  get achievementZoneDistribution() {
    const swimsWithTarget = this.filteredSwims.filter(
      (swim) => swim.targetTime !== undefined && swim.targetTime > 0
    );

    if (swimsWithTarget.length === 0) {
      return null;
    }

    let greenZone = 0;
    let orangeZone = 0;
    let redZone = 0;
    let darkRedZone = 0;

    swimsWithTarget.forEach((swim) => {
      const percentDiff =
        ((swim.duration - swim.targetTime!) / swim.targetTime!) * 100;
      const absPercentDiff = Math.abs(percentDiff);

      if (absPercentDiff <= 0.85) {
        greenZone++;
      } else if (absPercentDiff <= 1.5) {
        orangeZone++;
      } else if (absPercentDiff <= 4) {
        redZone++;
      } else {
        darkRedZone++;
      }
    });

    const total = swimsWithTarget.length;
    const greenPerc = (greenZone / total) * 100;
    const orangePerc = (orangeZone / total) * 100;
    const redPerc = (redZone / total) * 100;
    const darkRedPerc = (darkRedZone / total) * 100;

    return [
      {
        label: "Green Zone",
        value: greenPerc,
        color: "#2ecc71",
        tooltip: "≤ ±0.85% of goal time",
      },
      {
        label: "Orange Zone",
        value: orangePerc,
        color: "#f39c12",
        tooltip: "±0.85–1.5% of goal time",
      },
      {
        label: "Red Zone",
        value: redPerc,
        color: "#e74c3c",
        tooltip: "±1.5–4% of goal time",
      },
      {
        label: "Dark Red",
        value: darkRedPerc,
        color: "#7f0000",
        tooltip: "> 4% of goal time",
      },
    ].filter((zone) => zone.value > 0);
  }

  async addSwim(swim: Omit<Swim, "id">) {
    const { distance, duration, averageStrokeRate, heartRate } = swim;

    let velocity: number | undefined;
    let sl: number | undefined;
    let si: number | undefined;
    let ie: number | undefined;

    if (duration > 0) {
      velocity = distance / duration;

      if (averageStrokeRate && averageStrokeRate > 0) {
        const totalStrokes = averageStrokeRate * (duration / 60);
        if (totalStrokes > 0) {
          sl = distance / totalStrokes;
          if (velocity !== undefined && sl !== undefined) {
            si = velocity * sl;
            if (heartRate && si > 0) {
              ie = heartRate / si;
            }
          }
        }
      }
    }

    const swimData = {
      ...swim,
      ...(velocity !== undefined && { velocity }),
      ...(sl !== undefined && { sl }),
      ...(si !== undefined && { si }),
      ...(ie !== undefined && { ie }),
    };

    const { error } = await supabase.from("swimRecords").insert({
      id: generateUUID(),
      ...swimData,
    });
    if (error) throw error;
    this.loadSwims();
  }

  async updateSwim(id: string, updatedData: Partial<Swim>) {
    const { error } = await supabase
      .from("swimRecords")
      .update(updatedData)
      .eq("id", id);
    if (error) throw error;
    this.loadSwims();
  }

  async deleteSwim(id: string) {
    const { error } = await supabase.from("swimRecords").delete().eq("id", id);
    if (error) throw error;
    this.loadSwims();
  }
}

const swimStore = new SwimStore();
export default swimStore;
