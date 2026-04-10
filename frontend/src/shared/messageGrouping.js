import { formatDay } from './formatters';

export function buildGroupedMessages(messages = []) {
  return messages.reduce((acc, message, index) => {
    const previous = messages[index - 1];
    const continued =
      previous &&
      previous.userId === message.userId &&
      new Date(message.createdAt) - new Date(previous.createdAt) < 300000;
    const needsDateSeparator = !previous || formatDay(previous.createdAt) !== formatDay(message.createdAt);

    acc.push({
      ...message,
      cont: Boolean(continued),
      nd: Boolean(needsDateSeparator),
    });

    return acc;
  }, []);
}

export function filterMessagesBySearch(messages = [], search = '') {
  if (!search) return messages;
  const normalized = search.toLowerCase();
  return messages.filter((message) => String(message.content || '').toLowerCase().includes(normalized));
}
