import React, { useMemo } from 'react';
import SignalumRoomBasedPreviewHtmlReference from './SignalumRoomBasedPreviewHtmlReference.jsx';
import { useRoomBasedPreviewRuntime } from './useRoomBasedPreviewRuntime.js';
import { usePreviewAdminWidgets } from './usePreviewAdminWidgets.js';

export default function SignalumRoomBasedPreviewHtmlReferencePage() {
  const runtime = useRoomBasedPreviewRuntime();
  const widgets = usePreviewAdminWidgets(true);

  const derived = useMemo(() => ({
    user: runtime.user,
    rooms: runtime.rooms,
    currentRoomId: runtime.currentRoomId,
    messages: runtime.messages,
    members: runtime.members,
    participants: runtime.participants,
    incidentsCount: widgets.incidents.length || 1,
    pendingRequests: runtime.participants.filter((item) => item && item.status === 'pending').length || 2,
    nextMeetingTime: '14:00',
  }), [runtime.user, runtime.rooms, runtime.currentRoomId, runtime.messages, runtime.members, runtime.participants, widgets.incidents]);

  return (
    <div>
      {(runtime.error || widgets.error) ? (
        <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 20, maxWidth: 420, padding: '10px 12px', borderRadius: 12, background: 'rgba(15,23,42,.92)', color: '#fff', border: '1px solid rgba(148,163,184,.35)', fontFamily: 'Inter,Arial,Helvetica,sans-serif', fontSize: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Preview status</div>
          {runtime.error ? <div style={{ marginBottom: 4 }}>Runtime: {runtime.error}</div> : null}
          {widgets.error ? <div>Widgets: {widgets.error}</div> : null}
        </div>
      ) : null}
      <SignalumRoomBasedPreviewHtmlReference {...derived} />
    </div>
  );
}
