export function normalizeUser(raw) {
  if (!raw) return null;
  const id = raw.id || raw.userId || raw.user_id;
  const displayName =
    raw.displayName ||
    raw.display_name ||
    raw.username ||
    raw.login ||
    raw.email?.split('@')[0] ||
    'Пользователь';

  return {
    id,
    displayName,
    username: raw.username || displayName,
    email: raw.email || '',
    role: raw.role || raw.systemRole || '',
    avatarUrl: raw.avatarUrl || null,
    department: raw.department || raw.dept || '',
  };
}

export function normalizeMessage(raw) {
  const user = normalizeUser(
    raw.user ||
      raw.author ||
      raw.sender ||
      (raw.userId
        ? {
            id: raw.userId,
            displayName: raw.displayName || raw.display_name || raw.username,
            username: raw.username,
            role: raw.userRole || raw.role,
          }
        : null)
  );

  return {
    id: raw.id || raw._id,
    content: raw.content || raw.text || raw.body || '',
    userId: raw.userId || raw.user_id || user?.id,
    user,
    createdAt: raw.createdAt || raw.created_at || raw.timestamp || new Date().toISOString(),
    isPinned: Boolean(raw.isPinned || raw.is_pinned),
  };
}
