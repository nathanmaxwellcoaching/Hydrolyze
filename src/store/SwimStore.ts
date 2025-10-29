import { makeAutoObservable, runInAction, computed } from "mobx";
import { db, auth } from "../firebase-config";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import axios from 'axios';
import { calculateMean, calculateStdDev, calculateHrZoneTimes, calculateAge } from "../utils/statistics";

export interface User {
  id: string; // Firebase UID
  name: string;
  email: string;
  isAdmin: boolean;
  userType: 'swimmer' | 'coach';
  stravaClientId?: number;
  stravaClientSecret?: string;
  swimmers?: string[]; // for coaches
  coaches?: string[]; // for swimmers
  userMaxHr?: number; // User's maximum heart rate
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
  id: string; // Changed to string to accommodate Firestore document IDs
  date: string;
  distance: number;
  duration: number;
  targetTime?: number;
  swimmerEmail: string;
  stroke: 'Freestyle' | 'Backstroke' | 'Breaststroke' | 'Butterfly';
  gear: ('Fins' | 'Paddles' | 'Pull Buoy' | 'Snorkel' | 'NoGear')[];
  poolLength: 25 | 50;
  averageStrokeRate?: number;
  heartRate?: number;
  paceDistance?: string; // Added paceDistance
  velocity?: number; // Velocity (m/s)
  sl?: number; // Stroke Length (m/stroke)
  si?: number; // Swim Index (m^2/stroke)
  ie?: number; // Internal-to-External Load Ratio (bpm/m^2/stroke)
  parentId?: string; // ID of the parent StravaSession
  race?: boolean; // True if this was a race result
}

export const CANONICAL_COLUMN_ORDER: (keyof Swim)[] = [
  'id',
  'date',
  'swimmerEmail',
  'distance',
  'stroke',
  'duration',
  'targetTime',
  'gear',
  'poolLength',
  'averageStrokeRate',
  'heartRate',
  'paceDistance',
  'velocity',
  'sl',
  'si',
  'ie',
];

interface Filters {
  stroke: string | null;
  distance: number | null;
  gear: string[] | null;
  poolLength: number | null;
  startDate: string | null;
  endDate: string | null;
  paceDistance: string | null;
  swimmerEmail: string | null;
}

export interface GoalTime {

  id: string;

  email: string;

  swimmerName?: string;

  stroke: 'Freestyle' | 'Backstroke' | 'Breaststroke' | 'Butterfly';

  distance: number;

  gear: ('Fins' | 'Paddles' | 'Pull Buoy' | 'Snorkel' | 'NoGear') [];

  poolLength: 25 | 50;

  time: number;

}

export const GOAL_TIMES_CANONICAL_COLUMN_ORDER: (keyof GoalTime | 'id' | 'email' | 'stroke' | 'distance' | 'gear' | 'time')[] = [
    'id',
    'email',
    'stroke',
    'distance',
    'gear',
    'time',
];

class SwimStore {
  swims: Swim[] = [];
  stravaSessions: StravaSession[] = [];
  users: User[] = [];
  currentUser: User | null = null;
  isLoading = true;
  activeFilters: Filters = { stroke: null, distance: null, gear: null, poolLength: null, startDate: null, endDate: null, paceDistance: null, swimmerEmail: null };
  visibleColumns: (keyof Swim)[] = CANONICAL_COLUMN_ORDER.filter(col => !(['id', 'poolLength', 'averageStrokeRate', 'heartRate', 'velocity', 'sl', 'si', 'ie'].includes(col as string)));
  showTrendlineDetails = false;
  showSwimTimesChart = true;
  showDonutChart = false;
  showVelocityDistanceChart = false;
  velocityChartYAxis: 'v_swim' | 'stroke_index' | 'ie_ratio' | 'stroke_length' = 'v_swim';
  strokeDistributionMetric: 'records' | 'distance' = 'records';
  sortOrder: 'date' | 'duration' = 'date';
  visibleGoalTimeColumns: (keyof GoalTime)[] = ['swimmerName', 'stroke', 'distance', 'gear', 'time'];
  sdChartYAxis: 'si' | 'velocity' | 'ie' | 'averageStrokeRate' | 'sl' | 'duration' = 'velocity';

  // HR Zone related state
  userMaxHr: number | null = null;
  hrZoneDefinitions: HrZoneDefinition[] = [
    { name: 'Zone 1 (Very Light)', min: 0.50, max: 0.60, color: '#a8e063' },
    { name: 'Zone 2 (Light)', min: 0.60, max: 0.70, color: '#56ab2f' },
    { name: 'Zone 3 (Moderate)', min: 0.70, max: 0.80, color: '#fbd786' },
    { name: 'Zone 4 (Hard)', min: 0.80, max: 0.90, color: '#f7797d' },
    { name: 'Zone 5 (Maximum)', min: 0.90, max: 1.00, color: '#c62828' },
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
    this.setupFirebaseAuthObserver();
    // Call loadStravaSessions after auth observer has potentially set userMaxHr
    auth.onAuthStateChanged(() => {
      this.loadSwims();
      this.loadStravaSessions();
    });
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
    if (!this.currentUser || !this.currentUser.stravaClientId || !this.currentUser.stravaClientSecret) {
      console.warn("Current user or Strava credentials not available.");
      return null;
    }

    // Fallback: If userMaxHr is not set, try to calculate from dob
    if (this.userMaxHr === null && this.currentUser.dob) {
      const age = calculateAge(this.currentUser.dob);
      if (age !== null) {
        this.userMaxHr = 220 - age;
        // Do not persist this calculated value unless user explicitly saves it
      }
    }

    if (this.userMaxHr === null) {
      console.warn("Cannot fetch Strava HR data: user Max HR is not set and cannot be calculated from DOB.");
      return null;
    }

    try {
      // Assuming a backend endpoint to handle Strava OAuth token refresh/exchange
      const response = await axios.post('http://localhost:10000/strava/token', {
        clientId: this.currentUser.stravaClientId,
        clientSecret: this.currentUser.stravaClientSecret,
        // Potentially include a refresh token if stored, or handle initial auth flow
      });
      return response.data.access_token;
    } catch (error) {
      console.error("Failed to get Strava access token:", error);
      return null;
    }
  }

  async loadStravaSessions() {
    const sessionsCollection = collection(db, "strava_sessions");
    const sessionSnapshot = await getDocs(sessionsCollection);
    let sessionList = sessionSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as StravaSession));

    const enrichedSessions: StravaSession[] = [];
    for (const session of sessionList) {
      if (this.userMaxHr && this.currentUser?.stravaClientId && this.currentUser?.stravaClientSecret) {
        try {
          const accessToken = await this.getStravaAccessToken();
          if (accessToken) {
            const streamsResponse = await axios.get(
              `https://www.strava.com/api/v3/activities/${session.id}/streams?keys=heartrate&key_by_type=true`,
              {
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            );

            const heartrateStream = streamsResponse.data.heartrate?.data;
            const hrZoneTimes = calculateHrZoneTimes(heartrateStream, this.userMaxHr, this.hrZoneDefinitions);
            enrichedSessions.push({ ...session, hrZoneTimes });
          } else {
            enrichedSessions.push(session);
          }
        } catch (error) {
          console.error(`Failed to fetch Strava streams for activity ${session.id}:`, error);
          enrichedSessions.push(session);
        }
      } else {
        enrichedSessions.push(session);
      }
    }

    runInAction(() => {
      this.stravaSessions = enrichedSessions;
    });
  }

  setupFirebaseAuthObserver() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      runInAction(() => { this.isLoading = true; });
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const user = { ...userDoc.data(), id: userDoc.id } as User;
          let users: User[] = [];
          if (user.isAdmin || user.userType === 'coach') {
            try {
              users = await this.loadUsers();
            } catch (error) {
              console.error("Failed to load users:", error);
            }
          }
          runInAction(() => {
            this.currentUser = user;
            if (user.userMaxHr) {
              this.userMaxHr = user.userMaxHr;
            } else if (user.dob) {
              const age = calculateAge(user.dob);
              if (age !== null) {
                this.userMaxHr = 220 - age;
              }
            } else {
              this.userMaxHr = null;
            }
            if (users.length > 0) {
              this.users = users;
            }
            this.isLoading = false;
          });
        } else {
          runInAction(() => {
            this.currentUser = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
              email: firebaseUser.email!,
              isAdmin: false,
              userType: 'swimmer',
              coaches: [],
            };
            this.isLoading = false;
          });
        }
      } else {
        runInAction(() => {
          this.currentUser = null;
          this.isLoading = false;
        });
      }
    });
  }

  async loadSwims() {
    const swimsCollection = collection(db, "swimRecords");
    const swimSnapshot = await getDocs(swimsCollection);
    const swimList = swimSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Swim));
    runInAction(() => {
      this.swims = swimList.map(s => {
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

          return { ...s, velocity, sl, si, ie }; // Swimmer name will be derived from user data if available
      });
      if (this.swims.length > 0) {
        const mostRecentSwim = this.swims.reduce((prev, current) => (new Date(prev.date) > new Date(current.date)) ? prev : current);
        this.activeFilters = {
          stroke: mostRecentSwim.stroke,
          distance: mostRecentSwim.distance,
          gear: mostRecentSwim.gear,
          poolLength: mostRecentSwim.poolLength,
          startDate: null,
          endDate: null,
          paceDistance: mostRecentSwim.paceDistance || null,
          swimmerEmail: null,
        };
      }
    });
  }

  async loadUsers() {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return [];
    const response = await axios.get('http://localhost:10000/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Fetched users:", response.data);
    return response.data;
  }

  async updateUser(id: string, updatedData: Partial<User>) {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    await axios.put(`http://localhost:10000/api/users/${id}`,
      updatedData,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    this.loadUsers();
  }

  async deleteUser(id: string) {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    await axios.delete(`http://localhost:10000/api/users/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    this.loadUsers();
  }

  async login(email: string, password: string): Promise<boolean> {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged observer will handle setting currentUser
    return true;
  }

  async logout() {
    await signOut(auth);
    // onAuthStateChanged observer will handle setting currentUser to null
  }

  get isAuthenticated() {
    return this.currentUser !== null;
  }

  async register(name: string, email: string, password: string, userType: 'swimmer' | 'coach', stravaClientId?: string, stravaClientSecret?: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Add user profile to Firestore
    const usersCollection = collection(db, "users");
    const userData: Omit<User, 'id'> = {
      name: name,
      email: email,
      isAdmin: false, // Default to false for new registrations
      userType: userType,
      ...(userType === 'coach' && { swimmers: [] }),
      ...(userType === 'swimmer' && { coaches: [] }),
    };

    if (stravaClientId) {
      userData.stravaClientId = Number(stravaClientId);
    }
    if (stravaClientSecret) {
      userData.stravaClientSecret = stravaClientSecret;
    }

    await setDoc(doc(usersCollection, firebaseUser.uid), userData);

    // onAuthStateChanged observer will handle setting currentUser
    this.loadUsers(); // Refresh the list of users
  }

  applyFilters(filters: Partial<Filters>) {
    this.activeFilters = { ...this.activeFilters, ...filters };
  }

  clearFilters() {
    this.activeFilters = { stroke: null, distance: null, gear: null, poolLength: null, startDate: null, endDate: null, paceDistance: null, swimmerEmail: null };
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

  setVelocityChartYAxis(metric: 'v_swim' | 'stroke_index' | 'ie_ratio' | 'stroke_length') {
    this.velocityChartYAxis = metric;
  }

  setStrokeDistributionMetric(metric: 'records' | 'distance') {
    this.strokeDistributionMetric = metric;
  }

  setSortOrder(order: 'date' | 'duration') {
    this.sortOrder = order;
  }

  setSdChartYAxis(metric: 'si' | 'velocity' | 'ie' | 'averageStrokeRate' | 'sl' | 'duration') {
    this.sdChartYAxis = metric;
  }

  setVisibleGoalTimeColumns(columns: (keyof GoalTime)[]) {
    this.visibleGoalTimeColumns = columns;
  }

  setUserMaxHr(maxHr: number | null) {
    this.userMaxHr = maxHr;
    if (this.currentUser && maxHr !== null) {
      this.updateUser(this.currentUser.id, { userMaxHr: maxHr });
    }
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
      if (this.currentUser.userType === 'coach' && this.currentUser.swimmers) {
        const swimmerEmails = this.users
          .filter(user => this.currentUser!.swimmers!.includes(user.id))
          .map(user => user.email);
        return this.swims.filter(swim => swimmerEmails.includes(swim.swimmerEmail));
      }
      const currentUserEmail = this.currentUser.email;
      return this.swims.filter(swim => swim.swimmerEmail === currentUserEmail);
    }
    return []; // If no user is logged in, show no swims
  }

  get swimsForVelocityChart() {
    return this.userSwims.filter(swim => {
      const { stroke, gear, poolLength, startDate, endDate, paceDistance } = this.activeFilters;
      if (stroke && swim.stroke !== stroke) return false;
      if (poolLength && swim.poolLength !== poolLength) return false;
      if (paceDistance && swim.paceDistance !== paceDistance) return false;
      if (gear && gear.length > 0) {
        if (gear.includes('NoGear') && swim.gear.length === 0) {
          return true;
        }
        if (!gear.some(g => swim.gear.includes(g as any))) return false;
      }
      if (startDate && new Date(swim.date) < new Date(startDate)) return false;
      if (endDate && new Date(swim.date) > new Date(endDate)) return false;
      return true;
    });
  }

 get velocityDistanceData() {
    const groups = this.swimsForVelocityChart.reduce((acc, swim) => {
      const gearStr = swim.gear && swim.gear.length > 0 ? swim.gear.join(',') : 'NoGear';
      const key = `${swim.swimmerEmail}-${swim.stroke}-${swim.distance}-${gearStr}-${swim.poolLength}-${swim.paceDistance}`;
      
      if (!acc[key]) {
        const shortEmail = swim.swimmerEmail.split('@')[0];
        const shortStroke = swim.stroke.substring(0, 3);
        const shortGear = gearStr.length > 10 ? gearStr.substring(0, 10) + '...' : gearStr;
        acc[key] = {
          label: `${shortEmail}-${shortStroke}-${swim.distance}m-${shortGear}-${swim.poolLength}m-${swim.paceDistance}`,
          data: []
        };
      }
      
      let yValue;
      switch (this.velocityChartYAxis) {
        case 'v_swim': yValue = swim.velocity ?? 0; break;
        case 'stroke_length': yValue = swim.sl ?? 0; break;
        case 'stroke_index': yValue = swim.si ?? 0; break;
        case 'ie_ratio': yValue = swim.ie ?? 0; break;
        default: yValue = 0;
      }
      
      acc[key].data.push({ x: swim.distance, y: yValue });
      return acc;
    }, {} as Record<string, { label: string; data: { x: number; y: number }[] }>);

    return Object.values(groups).map(group => {
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
        data: Object.entries(aggregatedData).map(([distance, { sum, count }]) => ({
          x: `${distance}m`,
          y: parseFloat((sum / count).toFixed(2)),
        })).sort((a, b) => parseInt(a.x) - parseInt(b.x)),
      };
    });
  }
  get filteredSwims() {
    let filtered = this.userSwims.filter(swim => {
      const { stroke, distance, gear, poolLength, startDate, endDate, paceDistance, swimmerEmail } = this.activeFilters;
      if (stroke && swim.stroke !== stroke) return false;
      if (distance && swim.distance !== distance) return false;
      if (poolLength && swim.poolLength !== poolLength) return false;
      if (paceDistance && swim.paceDistance !== paceDistance) return false;
      if (swimmerEmail && swim.swimmerEmail !== swimmerEmail) return false;
      if (gear && gear.length > 0) {
        if (gear.includes('NoGear') && swim.gear.length === 0) {
          return true;
        }
        if (!gear.some(g => swim.gear.includes(g as any))) return false;
      }
      if (startDate && new Date(swim.date) < new Date(startDate)) return false;
      if (endDate && new Date(swim.date) > new Date(endDate)) return false;
      return true;
    });

    if (this.sortOrder === 'date') {
      filtered = filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (this.sortOrder === 'duration') {
      filtered = filtered.sort((a, b) => a.duration - b.duration);
    }

    return filtered;
  }

  get filterContext() {
    const { distance, stroke, gear, paceDistance, swimmerEmail } = this.activeFilters;
    const swimmerName = swimmerEmail ? this.users.find(u => u.email === swimmerEmail)?.name || swimmerEmail : '';
    return `${swimmerName} ${distance || ''}m ${stroke || ''} ${gear?.join(' ') || ''} ${paceDistance || ''}m pace`.trim();
  }

  get strokeDistribution() {
    const swims = this.userSwims.filter(swim => {
      const { startDate, endDate } = this.activeFilters;
      if (startDate && new Date(swim.date) < new Date(startDate)) return false;
      if (endDate && new Date(swim.date) > new Date(endDate)) return false;
      return true;
    });

    const distribution = swims.reduce((acc, swim) => {
      if (this.strokeDistributionMetric === 'records') {
        acc[swim.stroke] = (acc[swim.stroke] || 0) + 1;
      } else {
        acc[swim.stroke] = (acc[swim.stroke] || 0) + swim.distance;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }

  get allFiltersSet() {
    const { stroke, distance, gear, poolLength } = this.activeFilters;
    return !!(this.currentUser && stroke && distance && gear && gear.length > 0 && poolLength);
  }

  get uniqueSwimmers() {
    if (this.currentUser) {
      if (this.currentUser.userType === 'coach' && this.currentUser.swimmers) {
        return this.users
          .filter(user => this.currentUser!.swimmers!.includes(user.id))
          .map(user => user.name);
      }
      return [this.currentUser.name];
    }
    return [];
  }

  get swimmerUsers(): User[] {
    if (this.currentUser && this.currentUser.userType === 'coach' && this.currentUser.swimmers) {
      return this.users.filter(user => this.currentUser!.swimmers!.includes(user.id));
    }
    return [];
  }

  get uniqueStrokes() {
    return [...new Set(this.userSwims.map(s => s.stroke))];
  }

  get uniqueDistances() {
    return Array.from(new Set(this.userSwims.map(s => s.distance))).sort((a: number, b: number) => a - b);
  }

  get uniqueGear() {
    return ['Fins', 'Paddles', 'Pull Buoy', 'Snorkel', 'NoGear'];
  }

  get uniquePoolLengths() {
    return [...new Set(this.userSwims.map(s => s.poolLength))].sort((a, b) => a - b);
  }

  get uniquePaceDistances() {
    return [...new Set(this.userSwims.map(s => s.paceDistance).filter(Boolean))].sort();
  }

  get averagePace() {
    const swimsToConsider = this.filteredSwims.length > 0 ? this.filteredSwims : this.userSwims;
    if (swimsToConsider.length === 0) return 0;
    const totalDistance = swimsToConsider.reduce((acc, s) => acc + s.distance, 0);
    const totalDuration = swimsToConsider.reduce((acc, s) => acc + s.duration, 0);
    return totalDuration / (totalDistance / 100);
  }

  get averageAndSd() {
    if (!this.allFiltersSet || this.filteredSwims.length === 0) {
      return null;
    }

    const durations = this.filteredSwims.map(swim => swim.duration);
    const sum = durations.reduce((acc, val) => acc + val, 0);
    const average = sum / durations.length;

    const variance = durations.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / durations.length;
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
    return this.filteredSwims.reduce((prev, current) => (prev.duration < current.duration) ? prev : current);
  }

  get outlierSwims() {
    if (this.filteredSwims.length < 2) {
      return [];
    }

    const durations = this.filteredSwims.map(swim => swim.duration);
    const lastSwim = this.filteredSwims[0];
    const historicalDurations = durations.slice(1);

    const mean = calculateMean(historicalDurations);
    const stdDev = calculateStdDev(historicalDurations);

    const upperThreshold = mean + 2 * stdDev;
    const lowerThreshold = mean - 2 * stdDev;

    if (lastSwim.duration > upperThreshold || lastSwim.duration < lowerThreshold) {
      return [lastSwim];
    }

    return [];
  }

  get sdChartData() {
    const metric = this.sdChartYAxis;
    const swims = this.filteredSwims.filter(s => s[metric] !== undefined && s[metric] !== null);

    if (swims.length === 0) {
      return null;
    }

    const values = swims.map(s => s[metric] as number);
    const mean = calculateMean(values);
    const stdDev = calculateStdDev(values);

    const upper2SD = mean + 2 * stdDev;
    const lower2SD = mean - 2 * stdDev;

    return {
      series: [
        {
          name: metric,
          data: swims.map(s => [new Date(s.date).getTime(), s[metric]]),
        },
      ],
      mean,
      upper2SD,
      lower2SD,
    };
  }

  get achievementRates() {
    const swimsWithTarget = this.filteredSwims.filter(swim => swim.targetTime !== undefined);

    if (swimsWithTarget.length === 0) {
      return null; // No swims with target times to calculate
    }

    let metOrBeatTarget = 0;
    let totalPercentageDifference = 0;
    let totalTargetTime = 0;

    swimsWithTarget.forEach(swim => {
      if (swim.duration <= (swim.targetTime || 0)) {
        metOrBeatTarget++;
      }
      const difference = ((swim.duration - (swim.targetTime || 0)) / (swim.targetTime || 1)) * 100;
      totalPercentageDifference += difference;
      totalTargetTime += (swim.targetTime || 0);
    });

    const percentageMetOrBeat = (metOrBeatTarget / swimsWithTarget.length) * 100;
    const averagePercentageDifference = totalPercentageDifference / swimsWithTarget.length;
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
    const swimsWithTarget = this.filteredSwims.filter(swim => swim.targetTime !== undefined && swim.targetTime > 0);

    if (swimsWithTarget.length === 0) {
      return null;
    }

    let greenZone = 0;
    let orangeZone = 0;
    let redZone = 0;
    let darkRedZone = 0;

    swimsWithTarget.forEach(swim => {
      const percentDiff = ((swim.duration - swim.targetTime!) / swim.targetTime!) * 100;
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
      { label: "Green Zone", value: greenPerc, color: "#2ecc71", tooltip: "≤ ±0.85% of goal time" },
      { label: "Orange Zone", value: orangePerc, color: "#f39c12", tooltip: "±0.85–1.5% of goal time" },
      { label: "Red Zone", value: redPerc, color: "#e74c3c", tooltip: "±1.5–4% of goal time" },
      { label: "Dark Red", value: darkRedPerc, color: "#7f0000", tooltip: "> 4% of goal time" },
    ].filter(zone => zone.value > 0);
  }

  async addSwim(swim: Omit<Swim, 'id'>) {
    const { distance, duration, averageStrokeRate, heartRate } = swim;

    let velocity: number | undefined;
    let sl: number | undefined;
    let si: number | undefined;
    let ie: number | undefined;

    if (duration > 0) {
      velocity = parseFloat((distance / duration).toFixed(2));

      if (averageStrokeRate && averageStrokeRate > 0) {
        const totalStrokes = averageStrokeRate * (duration / 60);
        if (totalStrokes > 0) {
          sl = parseFloat((distance / totalStrokes).toFixed(2));
          if (velocity !== undefined && sl !== undefined) {
              si = parseFloat((velocity * sl).toFixed(2));
              if (heartRate && si > 0) {
                  ie = parseFloat((heartRate / si).toFixed(2));
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

    const swimsCollection = collection(db, "swimRecords");
    await addDoc(swimsCollection, swimData);
    this.loadSwims();
  }

  async updateSwim(id: string, updatedData: Partial<Swim>) {
    const swimRef = doc(db, "swimRecords", id);
    await updateDoc(swimRef, updatedData);
    this.loadSwims();
  }

  async deleteSwim(id: string) {
    const swimRef = doc(db, "swimRecords", id);
    await deleteDoc(swimRef);
    this.loadSwims();
  }
}

const swimStore = new SwimStore();
export default swimStore;
