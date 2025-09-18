export function addMinutes(date, mins) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + mins);
  return d;
}
export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  return d;
}
export function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23,59,59,999);
  return d;
}
