import { useMemo, useState } from 'react';
import {
  previewCreateRoom,
  previewFetchAdminOverview,
  previewFetchIncidents,
  previewFetchInvitations,
  previewSendMessage,
  previewVoiceJoin,
  previewVoiceLeave,
  previewVoiceSelf,
} from './previewRuntimeActions.js';

export function usePreviewActionHandlers({ currentRoomId, currentRoom, refreshAll }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [overview, setOverview] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [incidents, setIncidents] = useState([]);

  async function wrap(action, successMessage) {
    setBusy(true);
    setNote('');
    try {
      const result = await action();
      if (typeof refreshAll === 'function') {
        await refreshAll();
      }
      if (successMessage) {
        setNote(successMessage);
      }
      return result;
    } catch (error) {
      setNote(error.message || 'Ошибка preview action');
      throw error;
    } finally {
      setBusy(false);
    }
  }

  const actions = useMemo(() => ({
    busy,
    note,
    overview,
    invitations,
    incidents,
    createRoom: async (name, kind) => wrap(() => previewCreateRoom(name, kind), 'Комната создана'),
    sendMessage: async (text) => {
      if (!currentRoomId) return null;
      return wrap(() => previewSendMessage(currentRoomId, text), 'Сообщение отправлено');
    },
    joinVoice: async () => {
      if (!currentRoomId) return null;
      return wrap(() => previewVoiceJoin(currentRoomId), 'Вход в голос выполнен');
    },
    leaveVoice: async () => {
      if (!currentRoomId) return null;
      return wrap(() => previewVoiceLeave(currentRoomId), 'Выход из голоса выполнен');
    },
    toggleMute: async (nextMuted) => {
      if (!currentRoomId) return null;
      return wrap(() => previewVoiceSelf(currentRoomId, { isMuted: nextMuted }), nextMuted ? 'Микрофон выключен' : 'Микрофон включён');
    },
    loadOverview: async () => {
      const data = await wrap(() => previewFetchAdminOverview(), 'Обзор загружен');
      setOverview(data);
      return data;
    },
    loadInvitations: async () => {
      const data = await wrap(() => previewFetchInvitations(), 'Приглашения загружены');
      setInvitations(Array.isArray(data) ? data : data.items || data.invitations || []);
      return data;
    },
    loadIncidents: async () => {
      const data = await wrap(() => previewFetchIncidents(), 'Инциденты загружены');
      setIncidents(Array.isArray(data) ? data : data.items || data.incidents || []);
      return data;
    },
    canVoice: Boolean(currentRoom && ['voice', 'meeting'].includes(currentRoom.kind)),
  }), [busy, note, overview, invitations, incidents, currentRoomId, currentRoom, refreshAll]);

  return actions;
}
