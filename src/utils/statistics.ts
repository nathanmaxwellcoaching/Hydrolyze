import type { HrZoneDefinition } from '../store/SwimStore';

export const calculateMean = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
};

export const linearRegression = (data: number[][]): { m: number; b: number } => {
  const xValues = data.map(d => d[0]);
  const yValues = data.map(d => d[1]);

  const xMean = calculateMean(xValues);
  const yMean = calculateMean(yValues);

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < data.length; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    denominator += (xValues[i] - xMean) ** 2;
  }

  const m = denominator === 0 ? 0 : numerator / denominator;
  const b = yMean - m * xMean;

  return { m, b };
};

export const correlationCoefficient = (data: number[][]): number => {
  const xValues = data.map(d => d[0]);
  const yValues = data.map(d => d[1]);

  const xMean = calculateMean(xValues);
  const yMean = calculateMean(yValues);

  let numerator = 0;
  let xDenominator = 0;
  let yDenominator = 0;

  for (let i = 0; i < data.length; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    xDenominator += (xValues[i] - xMean) ** 2;
    yDenominator += (yValues[i] - yMean) ** 2;
  }

  const denominator = Math.sqrt(xDenominator * yDenominator);

  return denominator === 0 ? 0 : numerator / denominator;
};

export const calculateStdDev = (values: number[]): number => {
  if (values.length < 2) return 0;
  const mean = calculateMean(values);
  const variance = values.reduce((acc, val) => acc + (val - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
};

export const calculateHrZoneTimes = (
  hrStream: number[],
  maxHr: number,
  hrZoneDefinitions: HrZoneDefinition[]
): { name: string; value: number; color: string }[] => {
  if (!hrStream || hrStream.length === 0 || !maxHr || maxHr <= 0) {
    return [];
  }

  const zoneTimes: { [key: string]: number } = {};
  hrZoneDefinitions.forEach(zone => {
    zoneTimes[zone.name] = 0;
  });

  hrStream.forEach(hr => {
    const hrPercentage = hr / maxHr;
    for (const zone of hrZoneDefinitions) {
      if (hrPercentage >= zone.min && hrPercentage < zone.max) {
        zoneTimes[zone.name]++;
        break;
      }
    }
  });

  return hrZoneDefinitions.map(zone => ({
    name: zone.name,
    value: zoneTimes[zone.name] || 0,
    color: zone.color,
  })).filter(zone => zone.value > 0);
};

export const calculateAge = (dobString: string): number | null => {
  if (!dobString) return null;
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};