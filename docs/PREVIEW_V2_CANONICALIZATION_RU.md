# PREVIEW V2 CANONICALIZATION

Текущее правило после выката V2:

- `SignalumRoomBasedPreviewV2.jsx` — основной visual shell для preview режима;
- `SignalumRoomBasedPreviewOpsPageV2.jsx` — основной ops-layer для preview режима;
- `deploy/apply_room_based_preview_ops_page_v2.sh` — основной apply-path для нового preview-слоя;
- `scripts/preview_v2_live_verify.sh` — основная проверка, что live и local отдают один и тот же preview asset.

## Что считать старым слоем

Предыдущий preview-слой остаётся только как fallback и reference:
- `SignalumRoomBasedPreview.jsx`
- `SignalumRoomBasedPreviewOpsPage.jsx`

## Что дальше

1. После подтверждения live-вида V2 считать именно его каноническим preview shell.
2. После этого:
   - убрать misleading copy из старого preview-слоя;
   - свести лишние fallback-path к минимуму;
   - не возвращаться к старому visual shell как к активному.

## Практическое правило

Если V2 успешно открылся на live-домене и `preview_v2_live_verify.sh` возвращает `[OK]`, то следующий cleanup-pass должен считать старый preview-слой вторичным и больше не развивать его как основной путь.
