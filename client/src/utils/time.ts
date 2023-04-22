export function convertMS( milliseconds: number ) {
  let hour 
  let minute 
  let seconds

  seconds = Math.floor(milliseconds / 1000);
  minute = Math.floor(seconds / 60);
  seconds = seconds % 60;
  hour = Math.floor(minute / 60);
  minute = minute % 60;
  const day  = Math.floor(hour / 24);
  hour = hour % 24;

  return {
    day: day,
    hour: hour,
    minute: minute,
    seconds: seconds
  };
}
