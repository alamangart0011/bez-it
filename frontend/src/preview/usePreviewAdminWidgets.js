import { useCallback, useEffect, useState } from 'react';
import {
  previewFetchAdminOverview,
  previewFetchIncidents,
  previewFetchInvitations,
} from './previewRuntimeActions.js';

export function usePreviewAdminWidgets(autoLoad = true) {
  const [overview, setOverview] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const [overviewRaw, invitationsRaw, incidentsRaw] = await Promise.all([
        previewFetchAdminOverview().catch(() => null),
        previewFetchInvitations().catch(() => []),
        previewFetchIncidents().catch(() => []),
      ]);
      setOverview(overviewRaw);
      setInvitations(Array.isArray(invitationsRaw) ? invitationsRaw : invitationsRaw?.items || invitationsRaw?.invitations || []);
      setIncidents(Array.isArray(incidentsRaw) ? incidentsRaw : incidentsRaw?.items || incidentsRaw?.incidents || []);
    } catch (nextError) {
      setError(nextError.message || 'Не удалось загрузить admin widgets preview.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return {
    busy,
    error,
    overview,
    invitations,
    incidents,
    reload: load,
  };
}
