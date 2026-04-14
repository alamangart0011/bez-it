import React, { useMemo } from 'react';
import SignalumRoomBasedPreview from './SignalumRoomBasedPreview.jsx';
import { useRoomBasedPreviewRuntime } from './useRoomBasedPreviewRuntime.js';

export default function SignalumRoomBasedPreviewPage() {
  const runtime = useRoomBasedPreviewRuntime();

  const derived = useMemo(() => ({
    user: runtime.user,
    rooms: runtime.rooms,
    currentRoomId: runtime.currentRoomId,
    messages: runtime.messages,
    members: runtime.members,
    participants: runtime.participants,
    incidentsCount: 1,
    pendingRequests: runtime.participants.filter((item) => item && item.status === 'pending').length || 2,
    nextMeetingTime: '14:00',
  }), [runtime.user, runtime.rooms, runtime.currentRoomId, runtime.messages, runtime.members, runtime.participants]);

  return (
    <div>
      {runtime.error ? (
        <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 20, maxWidth: 480, padding: '12px 14px', borderRadius: 12, background: 'rgba(127,29,29,.92)', color: '#fff', border: '1px solid rgba(248,113,113,.45)', fontFamily: 'Inter,Arial,Helvetica,sans-serif' }}>
          Runtime preview: {runtime.error}
        </div>
      ) : null}
      <SignalumRoomBasedPreview {...derived} />
    </div>
  );
}
