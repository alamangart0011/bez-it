import React, { useMemo } from 'react';
import SignalumRoomBasedPreviewV2 from './SignalumRoomBasedPreviewV2.jsx';
import { useRoomBasedPreviewRuntime } from './useRoomBasedPreviewRuntime.js';
import { usePreviewAdminWidgets } from './usePreviewAdminWidgets.js';
import { usePreviewActionHandlers } from './usePreviewActionHandlers.js';

function isPrivileged(role = '') {
  return ['super_admin', 'admin', 'leader', 'moderator'].some((item) => String(role).includes(item));
}

export default function SignalumRoomBasedPreviewOpsPageV2() {
  const runtime = useRoomBasedPreviewRuntime();
  const widgets = usePreviewAdminWidgets(true);
  const actions = usePreviewActionHandlers({
    currentRoomId: runtime.currentRoomId,
    currentRoom: runtime.currentRoom,
    refreshAll: runtime.refreshAll,
  });

  const canAdmin = isPrivileged(runtime.user?.role);
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

      {actions.note ? (
        <div style={{ position: 'fixed', right: 16, bottom: 20, zIndex: 20, maxWidth: 340, padding: '10px 12px', borderRadius: 12, background: 'rgba(15,23,42,.94)', color: '#fff', border: '1px solid rgba(148,163,184,.25)', fontFamily: 'Inter,Arial,Helvetica,sans-serif', fontSize: 12 }}>{actions.note}</div>
      ) : null}

      <div style={{ position: 'fixed', left: 16, bottom: 16, zIndex: 15, display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 880 }}>
        <button onClick={() => runtime.refreshAll()} style={btnStyle('#0f172a', false)}>Обновить runtime</button>
        <button onClick={() => widgets.reload()} style={btnStyle('#1d4ed8', false)}>Widgets</button>
        <button onClick={() => actions.loadOverview()} style={btnStyle('#334155', !canAdmin)} disabled={!canAdmin}>Overview</button>
        <button onClick={() => actions.loadInvitations()} style={btnStyle('#334155', !canAdmin)} disabled={!canAdmin}>Invitations</button>
        <button onClick={() => actions.loadIncidents()} style={btnStyle('#334155', !canAdmin)} disabled={!canAdmin}>Incidents</button>
        {actions.canVoice ? <button onClick={() => actions.joinVoice()} style={btnStyle('#0f766e', false)}>Войти в голос</button> : null}
        {actions.canVoice ? <button onClick={() => actions.toggleMute(true)} style={btnStyle('#7c2d12', false)}>Mute</button> : null}
      </div>

      <SignalumRoomBasedPreviewV2 {...derived} />
    </div>
  );
}

function btnStyle(background, disabled) {
  return {
    border: '1px solid rgba(148,163,184,.25)',
    background,
    color: '#fff',
    padding: '9px 11px',
    borderRadius: 12,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    fontFamily: 'Inter,Arial,Helvetica,sans-serif',
    fontSize: 12,
  };
}
