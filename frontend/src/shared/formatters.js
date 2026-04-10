export function initials(name = '?') {
  return String(name)
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('ru', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDay(iso) {
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Сегодня';

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Вчера';

  return date.toLocaleDateString('ru', {
    day: 'numeric',
    month: 'long',
  });
}
