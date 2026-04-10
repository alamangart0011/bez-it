# Foundation status

## Собрано
- monorepo foundation
- api skeleton
- web shell skeleton
- bindings and state contracts
- adapters and loaders
- handlers and flow map
- cleanup and merge notes
- server runtime wiring
- live runtime response for /api/rooms
- live runtime response for /api/calls
- runtime handlers for memberships, transcripts, assistant and actions
- web runtime page plan builder
- web runtime hydrate client
- page runtime adapter binding to runtime plans

## Что уже живое
- /health остается отдельной точкой
- /api/meta остается отдельной точкой
- остальные /api/* проходят через server-dispatch
- /api/rooms возвращает live payload для rooms shell
- /api/calls возвращает live payload для calls shell
- web runtime умеет строить plan и hydrate для rooms, calls, profile и admin

## Дальше
- first real rooms page execution path on web
- first real calls page execution path on web
- bind transcript and assistant panels to hydrated runtime
- cleanup pass and merge review
