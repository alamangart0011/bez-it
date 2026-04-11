import { roomsBinding } from './rooms';
import { callsBinding } from './calls';
import { profileBinding } from './profile';
import { adminBinding } from './admin';
import { transcriptBinding } from './transcript';
import { assistantBinding } from './assistant';

export const webApiBindings = {
  rooms: roomsBinding,
  calls: callsBinding,
  profile: profileBinding,
  admin: adminBinding,
  transcript: transcriptBinding,
  assistant: assistantBinding
};
