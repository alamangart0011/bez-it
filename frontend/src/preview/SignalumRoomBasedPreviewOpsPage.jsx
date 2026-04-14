import React, { useMemo } from 'react';
import SignalumRoomBasedPreview from './SignalumRoomBasedPreview.jsx';
import { useRoomBasedPreviewRuntime } from './useRoomBasedPreviewRuntime.js';
import { usePreviewAdminWidgets } from './usePreviewAdminWidgets.js';
import { usePreviewActionHandlers } from './usePreviewActionHandlers.js';

export default function SignalumRoomBasedPreviewOpsPage() {
  const runtime = useRoomBasedPreviewRuntime();
  const widgets = usePreviewAdminWidgets(true);
  const actions = usePreviewActionHandlers({
    currentRoomId: runtime.currentRoomId,
    currentRoom: runtime.currentRoom,
    refreshAll: runtime.refreshAll,
  });

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
      {(runtime.error || widgets.error || actions.note) ? (
        <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 30, maxWidth: 520, padding: '12px 14px', borderRadius: 12, background: 'rgba(15,23,42,.94)', color: '#fff', border: '1px solid rgba(148,163,184,.35)', fontFamily: 'Inter,Arial,Helvetica,sans-serif' }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Preview Ops Overlay</div>
          {runtime.error ? <div style={{ marginBottom: 4 }}>Runtime: {runtime.error}</div> : null}
          {widgets.error ? <div style={{ marginBottom: 4 }}>Widgets: {widgets.error}</div> : null}
          {actions.note ? <div>{actions.note}</div> : null}
        </div>
      ) : null}

      <div style={{ position: 'fixed', left: 16, bottom: 16, zIndex: 30, display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 760 }}>
        <button onClick={() => runtime.refreshAll()} style={btnStyle('#0f172a')}>Обновить runtime</button>
        <button onClick={() => widgets.reload()} style={btnStyle('#1d4ed8')}>Обновить widgets</button>
        <button onClick={() => actions.loadOverview()} style={btnStyle('#334155')}>Overview</button>
        <button onClick={() => actions.loadInvitations()} style={btnStyle('#334155')}>Invitations</button>
        <button onClick={() => actions.loadIncidents()} style={btnStyle('#334155')}>Incidents</button>
        {actions.canVoice ? <button onClick={() => actions.joinVoice()} style={btnStyle('#0f766e')}>Войти в голос</button> : null}
        {actions.canVoice ? <button onClick={() => actions.toggleMute(true)} style={btnStyle('#7c2d12')}>Mute</button> : null}
      </div>

      <SignalumRoomBasedPreview {...derived} />
    </div>
  );
}

function btnStyle(background) {
  return {
    border: '1px solid rgba(148,163,184,.25)',
    background,
    color: '#fff',
    padding: '10px 12px',
    borderRadius: 12,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'Inter,Arial,Helvetica,sans-serif',
  };
}
