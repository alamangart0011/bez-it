import { roomsPageNext } from '../pages/rooms-page-next';
import { callsPageNext } from '../pages/calls-page-next';
import { roomsViewNext } from '../views/rooms-view-next';
import { callsViewNext } from '../views/calls-view-next';
import { roomsPageAdapterNext } from '../adapters/rooms-page-adapter-next';
import { callsPageAdapterNext } from '../adapters/calls-page-adapter-next';

export const runtimeSwitchExports = {
  pages: {
    rooms: roomsPageNext,
    calls: callsPageNext
  },
  views: {
    rooms: roomsViewNext,
    calls: callsViewNext
  },
  adapters: {
    rooms: roomsPageAdapterNext,
    calls: callsPageAdapterNext
  }
};
