export const gaussianRandom = (mean = 0, stdDev = 1) => {
  let u1 = Math.random();
  let u2 = Math.random();
  let randStdNormal =
    Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
  return mean + stdDev * randStdNormal;
}

export const getGaussianRandomValue = (min = 1, max = 9, mean = 5, stdDev = 1.5) => {
  let value;
  do {
    value = Math.round(gaussianRandom(mean, stdDev));
  } while (value < min || value > max);
  return value;
}
