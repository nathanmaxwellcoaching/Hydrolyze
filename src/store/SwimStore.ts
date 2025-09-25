import { makeAutoObservable, runInAction, computed } from "mobx";
import { db } from "../firebase-config";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

export interface TrendlineStat {
  name: string;
  equation: string;
  rSquared: string;
}

export interface Swim {
  id: string; // Changed to string to accommodate Firestore document IDs
  date: string;
  distance: number;
  duration: number;
  targetTime?: number;
  swimmer: string;
  stroke: 'Freestyle' | 'Backstroke' | 'Breaststroke' | 'Butterfly';
  gear: ('Fins' | 'Paddles' | 'Pull Buoy' | 'Snorkel' | 'No Gear')[];
  poolLength: 25 | 50;
  averageStrokeRate?: number;
  heartRate?: number;
}

export const CANONICAL_COLUMN_ORDER: (keyof Swim | 'strokeLength' | 'swimIndex' | 'ieRatio')[] = [
  'id',
  'date',
  'swimmer',
  'distance',
  'stroke',
  'duration',
  'targetTime',
  'gear',
  'poolLength',
  'averageStrokeRate',
  'heartRate',
  'strokeLength',
  'swimIndex',
  'ieRatio',
];

interface Filters {
  swimmer: string | null;
  stroke: string | null;
  distance: number | null;
  gear: string[] | null;
  poolLength: number | null;
  startDate: string | null;
  endDate: string | null;
}

class SwimStore {
  swims: Swim[] = [];
  isAuthenticated = false;
  activeFilters: Filters = { swimmer: null, stroke: null, distance: null, gear: null, poolLength: null, startDate: null, endDate: null };
  visibleColumns: (keyof Swim | 'strokeLength' | 'swimIndex' | 'ieRatio')[] = CANONICAL_COLUMN_ORDER.filter(col => !['id', 'date', 'poolLength', 'averageStrokeRate', 'heartRate', 'strokeLength', 'swimIndex', 'ieRatio'].includes(col));
  trendlineStats: TrendlineStat[] = [];
  showTrendline = false;
  showTrendlineDetails = false;
  showSwimTimesChart = true;
  showDonutChart = false;
  strokeDistributionMetric: 'records' | 'distance' = 'records';

  constructor() {
    makeAutoObservable(this, { filteredSwims: computed, personalBests: computed, allFiltersSet: computed, achievementRates: computed, averageAndSd: computed });
    this.loadSwims();
  }

  async loadSwims() {
    const swimsCollection = collection(db, "swims");
    const swimSnapshot = await getDocs(swimsCollection);
    if (swimSnapshot.empty) {
      const initialSwims = [
        { date: "2025-09-10T10:30", distance: 100, duration: 75, targetTime: 72, swimmer: 'Nathan', stroke: 'Freestyle', gear: [], poolLength: 25 },
        { date: "2025-09-10T11:00", distance: 50, duration: 45, targetTime: 45, swimmer: 'Lucy', stroke: 'Butterfly', gear: [], poolLength: 25 },
        { date: "2025-09-10T14:15", distance: 100, duration: 90, targetTime: 95, swimmer: 'Nathan', stroke: 'Backstroke', gear: ['Fins'], poolLength: 50 },
        { date: "2025-09-10T16:05", distance: 50, duration: 55, targetTime: 50, swimmer: 'Lucy', stroke: 'Breaststroke', gear: [], poolLength: 25 },
        { date: "2025-09-11T09:00", distance: 200, duration: 160, targetTime: 155, swimmer: 'Nathan', stroke: 'Freestyle', gear: ['Paddles'], poolLength: 50 },
        { date: "2025-09-11T18:30", distance: 100, duration: 80, targetTime: 80, swimmer: 'Lucy', stroke: 'Freestyle', gear: [], poolLength: 25 },
      ];
      initialSwims.forEach(swim => this.addSwim(swim as Omit<Swim, 'id'>));
    } else {
      const swimList = swimSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Swim));
      runInAction(() => {
        this.swims = swimList;
        if (this.swims.length > 0) {
          const mostRecentSwim = this.swims.reduce((prev, current) => (new Date(prev.date) > new Date(current.date)) ? prev : current);
          this.activeFilters = {
            swimmer: mostRecentSwim.swimmer,
            stroke: mostRecentSwim.stroke,
            distance: mostRecentSwim.distance,
            gear: mostRecentSwim.gear,
            poolLength: mostRecentSwim.poolLength,
            startDate: null,
            endDate: null,
          };
        }
      });
    }
  }

  async addSwim(swim: Omit<Swim, 'id'>) {
    const newSwimRef = await addDoc(collection(db, "swims"), swim);
    const newSwim = { ...swim, id: newSwimRef.id };
    runInAction(() => {
      this.swims.unshift(newSwim);
    });
  }

  async updateSwim(updatedSwim: Swim) {
    const swimRef = doc(db, "swims", updatedSwim.id);
    await updateDoc(swimRef, { ...updatedSwim });
    runInAction(() => {
      const index = this.swims.findIndex(s => s.id === updatedSwim.id);
      if (index !== -1) {
        this.swims[index] = updatedSwim;
      }
    });
  }

  async deleteSwim(id: string) {
    await deleteDoc(doc(db, "swims", id));
    runInAction(() => {
      this.swims = this.swims.filter(s => s.id !== id);
    });
  }

  authenticate(password: string): boolean {
    const isCorrect = password === import.meta.env.VITE_APP_PASSWORD;
    if (isCorrect) {
      runInAction(() => { this.isAuthenticated = true; });
    }
    return isCorrect;
  }

  logout() {
    this.isAuthenticated = false;
  }

  applyFilters(filters: Partial<Filters>) {
    this.activeFilters = { ...this.activeFilters, ...filters };
  }

  clearFilters() {
    this.activeFilters = { swimmer: null, stroke: null, distance: null, gear: null, poolLength: null, startDate: null, endDate: null };
  }

  setVisibleColumns(columns: (keyof Swim | 'strokeLength' | 'swimIndex' | 'ieRatio')[]) {
    if (columns.length > 0) {
      this.visibleColumns = columns;
    }
  }

  setTrendlineStats(stats: TrendlineStat[]) {
    this.trendlineStats = stats;
  }

  toggleTrendline(show: boolean) {
    this.showTrendline = show;
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

  setStrokeDistributionMetric(metric: 'records' | 'distance') {
    this.strokeDistributionMetric = metric;
  }

  get filteredSwims() {
    return this.swims.filter(swim => {
      const { swimmer, stroke, distance, gear, poolLength, startDate, endDate } = this.activeFilters;
      if (swimmer && swim.swimmer !== swimmer) return false;
      if (stroke && swim.stroke !== stroke) return false;
      if (distance && swim.distance !== distance) return false;
      if (poolLength && swim.poolLength !== poolLength) return false;
      if (gear && gear.length > 0) {
        if (gear.includes('No Gear') && swim.gear.length === 0) {
          return true;
        }
        if (!gear.some(g => swim.gear.includes(g as any))) return false;
      }
      if (startDate && new Date(swim.date) < new Date(startDate)) return false;
      if (endDate && new Date(swim.date) > new Date(endDate)) return false;
      return true;
    });
  }

  get filterContext() {
    const { swimmer, distance, stroke, gear } = this.activeFilters;
    return `${swimmer || ''} ${distance || ''}m ${stroke || ''} ${gear?.join(' ') || ''}`.trim();
  }

  get strokeDistribution() {
    const swims = this.swims.filter(swim => {
      const { swimmer, startDate, endDate } = this.activeFilters;
      if (swimmer && swim.swimmer !== swimmer) return false;
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
    const { swimmer, stroke, distance, gear, poolLength } = this.activeFilters;
    return !!(swimmer && stroke && distance && gear && gear.length > 0 && poolLength);
  }

  get uniqueSwimmers() {
    return [...new Set(this.swims.map(s => s.swimmer))];
  }

  get uniqueStrokes() {
    return [...new Set(this.swims.map(s => s.stroke))];
  }

  get uniqueDistances() {
    return [...new Set(this.swims.map(s => s.distance))].sort((a, b) => a - b);
  }

  get uniqueGear() {
    return ['Fins', 'Paddles', 'Pull Buoy', 'Snorkel', 'No Gear'];
  }

  get uniquePoolLengths() {
    return [...new Set(this.swims.map(s => s.poolLength))].sort((a, b) => a - b);
  }

  get averagePace() {
    const swimsToConsider = this.filteredSwims.length > 0 ? this.filteredSwims : this.swims;
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

  calculateStrokeLength(swim: Swim): number | null {
    if (swim.duration && swim.distance && swim.averageStrokeRate) {
      const speed = swim.distance / swim.duration; // m/s
      const strokeRatePerSecond = swim.averageStrokeRate / 60; // strokes/second
      if (strokeRatePerSecond === 0) return null; // Avoid division by zero
      return parseFloat((speed / strokeRatePerSecond).toFixed(2));
    }
    return null;
  }

  calculateSwimIndex(swim: Swim): number | null {
    const strokeLength = this.calculateStrokeLength(swim);
    if (strokeLength && swim.duration && swim.distance) {
      const speed = swim.distance / swim.duration;
      return parseFloat((strokeLength * speed).toFixed(2));
    }
    return null;
  }

  calculateIERatio(swim: Swim): number | null {
    const swimIndex = this.calculateSwimIndex(swim);
    if (swim.heartRate && swimIndex) {
      return parseFloat((swim.heartRate / swimIndex).toFixed(2));
    }
    return null;
  }
}

const swimStore = new SwimStore();
export default swimStore;