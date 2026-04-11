export const runtimeSwitchManifest = {
  pages: {
    rooms: {
      current: 'apps/web/src/pages/rooms-page.ts',
      next: 'apps/web/src/pages/rooms-page-next.ts'
    },
    calls: {
      current: 'apps/web/src/pages/calls-page.ts',
      next: 'apps/web/src/pages/calls-page-next.ts'
    }
  },
  views: {
    rooms: {
      current: 'apps/web/src/views/rooms-view.ts',
      next: 'apps/web/src/views/rooms-view-next.ts'
    },
    calls: {
      current: 'apps/web/src/views/calls-view.ts',
      next: 'apps/web/src/views/calls-view-next.ts'
    }
  },
  adapters: {
    rooms: {
      current: 'apps/web/src/adapters/rooms-page-adapter.ts',
      next: 'apps/web/src/adapters/rooms-page-adapter-next.ts'
    },
    calls: {
      current: 'apps/web/src/adapters/calls-page-adapter.ts',
      next: 'apps/web/src/adapters/calls-page-adapter-next.ts'
    }
  }
};
