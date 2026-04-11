import { runtimeWiredPages } from './runtime-wired-pages';
import { runtimeWiredViews } from './runtime-wired-views';
import { runtimeWiredAdapters } from './runtime-wired-adapters';

export async function executeRuntimeUiEntry(page, params = {}, fetcher = fetch) {
  const pageEntry = runtimeWiredPages[page];
  const viewEntry = runtimeWiredViews[page];
  const adapterEntry = runtimeWiredAdapters[page];

  if (!pageEntry || !viewEntry || !adapterEntry) {
    throw new Error('Unknown runtime UI entry: ' + page);
  }

  const [pagePayload, viewPayload, adapterPayload] = await Promise.all([
    pageEntry.entry(params, fetcher),
    viewEntry.entry(params, fetcher),
    adapterEntry.entry(params, fetcher)
  ]);

  return {
    page,
    pagePayload,
    viewPayload,
    adapterPayload,
    shell: adapterPayload && adapterPayload.shell ? adapterPayload.shell : pageEntry.shell,
    summary: adapterPayload && adapterPayload.summary ? adapterPayload.summary : pagePayload && pagePayload.summary ? pagePayload.summary : {}
  };
}
