# PR13 runtime asset index

## Runtime core
- `apps/api/server.js`
- `apps/api/src/runtime/server-dispatch.js`
- `apps/web/src/runtime/page-runtime-adapter.ts`
- `apps/web/src/runtime/runtime-execution-index.ts`
- `apps/web/src/runtime/rooms-runtime-execution.ts`
- `apps/web/src/runtime/calls-runtime-execution.ts`
- `apps/web/src/runtime/transcript-runtime-execution.ts`
- `apps/web/src/runtime/assistant-runtime-execution.ts`
- `apps/web/src/flow/rooms-call-runtime.ts`

## Runtime bridge layer
- `apps/web/src/runtime/right-panel-runtime-sections.ts`
- `apps/web/src/runtime/rooms-page-runtime-entry.ts`
- `apps/web/src/runtime/calls-page-runtime-entry.ts`
- `apps/web/src/runtime/room-shell-runtime.ts`
- `apps/web/src/runtime/call-shell-runtime.ts`
- `apps/web/src/runtime/content-shell-runtime.ts`
- `apps/web/src/runtime/rooms-view-runtime.ts`
- `apps/web/src/runtime/calls-view-runtime.ts`
- `apps/web/src/runtime/rooms-page-adapter-runtime.ts`
- `apps/web/src/runtime/calls-page-adapter-runtime.ts`

## Runtime wiring layer
- `apps/web/src/runtime/runtime-page-entry-index.ts`
- `apps/web/src/runtime/runtime-view-entry-index.ts`
- `apps/web/src/runtime/runtime-adapter-entry-index.ts`
- `apps/web/src/runtime/runtime-wired-pages.ts`
- `apps/web/src/runtime/runtime-wired-views.ts`
- `apps/web/src/runtime/runtime-wired-adapters.ts`
- `apps/web/src/runtime/runtime-ui-entry.ts`
- `apps/web/src/runtime/runtime-switch-manifest.ts`
- `apps/web/src/runtime/runtime-switch-exports.ts`

## Next descriptors
- `apps/web/src/pages/rooms-page-next.ts`
- `apps/web/src/pages/calls-page-next.ts`
- `apps/web/src/views/rooms-view-next.ts`
- `apps/web/src/views/calls-view-next.ts`
- `apps/web/src/adapters/rooms-page-adapter-next.ts`
- `apps/web/src/adapters/calls-page-adapter-next.ts`

## Preview contour
- `apps/web/Dockerfile`
- `docker-compose.runtime-web.yml`
- `infra/nginx/runtime-preview.location.conf`
- `patches/runtime-preview-nginx.patch`

## Switch assets
- `patches/runtime-web-switch.patch`
- `docs/WEB_RUNTIME_ONE_TO_ONE_SWITCH_MAP_RU.md`
- `docs/WEB_RUNTIME_SWITCH_SNIPPETS_RU.md`
- `docs/APPLY_RUNTIME_SWITCH_AND_PREVIEW_RU.md`
- `docs/WEB_RUNTIME_SWITCH_RUNBOOK_RU.md`
- `docs/WEB_RUNTIME_CLEANUP_PASS_RU.md`

## Preview / smoke docs
- `docs/WEB_RUNTIME_PREVIEW_DEPLOY_RU.md`
- `docs/RUNTIME_PREVIEW_MOUNT_PLAN_RU.md`
- `docs/WEB_RUNTIME_VISUAL_SMOKE_RU.md`

## Closure / status docs
- `docs/WEB_EXECUTION_CLOSURE_PLAN_RU.md`
- `docs/WEB_RUNTIME_PATCH_MAP_RU.md`
- `docs/PR13_RUNTIME_CLOSURE_STATUS_RU.md`
- `docs/PR13_FINAL_ACTION_BLOCK_RU.md`
- `docs/PR13_FINAL_CHECKLIST_RU.md`

## Остаток до финиша
1. применить switch patch;
2. применить nginx preview patch;
3. пройти cleanup pass;
4. поднять preview contour;
5. смонтировать `/runtime-preview`;
6. прогнать visual smoke.
