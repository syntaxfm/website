export default (time) => {
  const hours = ~~(time / 3600);
  const minutes = ~~(time / 60) % 60;
  const seconds = ~~(time % 60);
  
  let result = '';

  if (hours) {
    result += hours;
    result += `:${minutes < 10 ? '0' : ''}`;
  }

  result += minutes;
  result += `:${seconds < 10 ? '0' : ''}`;
  result += seconds;

  return result;
};
