import { roomsView } from '../views/rooms-view';
import { callsView } from '../views/calls-view';
import { profileView } from '../views/profile-view';
import { adminView } from '../views/admin-view';
import { transcriptView } from '../views/transcript-view';
import { assistantView } from '../views/assistant-view';

export const appRuntimeIndex = {
  rooms: roomsView,
  calls: callsView,
  profile: profileView,
  admin: adminView,
  transcript: transcriptView,
  assistant: assistantView
};
