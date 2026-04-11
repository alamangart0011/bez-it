# PR13 final checklist

## Switch
- [ ] `runtime-web-switch.patch` применён
- [ ] existing `rooms-page.ts` переключён
- [ ] existing `calls-page.ts` переключён
- [ ] existing `rooms-view.ts` переключён
- [ ] existing `calls-view.ts` переключён
- [ ] existing `rooms-page-adapter.ts` переключён
- [ ] existing `calls-page-adapter.ts` переключён

## Cleanup
- [ ] metadata-only path больше не основной
- [ ] transcript runtime panel живой
- [ ] assistant runtime panel живой
- [ ] right panel питается от runtime payload

## Preview
- [ ] `apps/web/Dockerfile` собран
- [ ] `docker-compose.runtime-web.yml` поднят
- [ ] nginx patch под `/runtime-preview` применён
- [ ] `/runtime-preview` отвечает

## Visual smoke
- [ ] rooms открываются
- [ ] calls открываются
- [ ] transcript panel открывается
- [ ] assistant panel открывается
- [ ] root/live contour не пострадал

## Finish
- [ ] PR #13 готов к следующей merge/review фазе
