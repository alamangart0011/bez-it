import { appRuntimeIndex } from './app-runtime-index';

export const pageRuntimeAdapter = {
  resolve(page) {
    return appRuntimeIndex[page] || null;
  },
  bind(page) {
    const view = appRuntimeIndex[page];
    if (!view) return null;

    return {
      shell: view.shell,
      loader: view.loader,
      actions: view.actions
    };
  }
};
