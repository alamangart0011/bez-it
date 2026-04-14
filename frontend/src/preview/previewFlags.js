export function shouldUseRoomBasedPreview() {
  try {
    const query = new URLSearchParams(window.location.search);
    if (query.get('preview') === '1') return true;
    if (query.get('preview') === '0') return false;
    return window.localStorage.getItem('signalum_room_based_preview') === '1';
  } catch {
    return false;
  }
}

export function enableRoomBasedPreview() {
  try {
    window.localStorage.setItem('signalum_room_based_preview', '1');
  } catch {}
}

export function disableRoomBasedPreview() {
  try {
    window.localStorage.removeItem('signalum_room_based_preview');
  } catch {}
}
