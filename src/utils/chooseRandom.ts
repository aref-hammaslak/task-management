export function chooseRandom<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error('Array is empty');
  }
  const randomIndex: number = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}
