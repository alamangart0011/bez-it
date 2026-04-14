from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / 'frontend/src/preview/SignalumRoomBasedPreviewHtmlReference.jsx'
text = path.read_text(encoding='utf-8')

replacements = {
    'Это и есть тот слой, который должен жить на домене поверх runtime.': 'Это основной рабочий экран портала: активные комнаты, голос, собрания, заявки и инциденты в одном контуре.',
    'Потому что живой runtime уже есть, а product-first shell/dashboard/voice слой ещё не влит в фронтовой монолит.': 'Новый рабочий shell уже включён. Дальше — убрать dev-хвосты, усилить live-bind и довести контекстные действия до production-качества.',
    'debug strip, duplicate helpers': 'legacy cleanup and shell hardening',
    'bootstrap only': 'single active entry point',
    'shell, auth, room, voice': 'shell, room, voice, meeting, admin',
    'Новые сообщения · {model.roomFeed.length} в ленте': 'Новые сообщения · {model.roomFeed.length} в ленте',
    'Руководитель · Сотрудник': '{model.dashboard.voiceNow > 0 ? "live runtime" : "нет активного голоса"}',
}

for old, new in replacements.items():
    text = text.replace(old, new)

path.write_text(text, encoding='utf-8')
print('[OK] patched exact shell copy and metrics')
