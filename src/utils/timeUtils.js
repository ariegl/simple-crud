export const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) === 1 ? "hace 1 año" : `hace ${Math.floor(interval)} años`;
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) === 1 ? "hace 1 mes" : `hace ${Math.floor(interval)} meses`;
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) === 1 ? "hace 1 día" : `hace ${Math.floor(interval)} días`;
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) === 1 ? "hace 1 hora" : `hace ${Math.floor(interval)} horas`;
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) === 1 ? "hace 1 minuto" : `hace ${Math.floor(interval)} minutos`;
  }
  return seconds < 10 ? "hace un momento" : `hace ${Math.floor(seconds)} segundos`;
};
