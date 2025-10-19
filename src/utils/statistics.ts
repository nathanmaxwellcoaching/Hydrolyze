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