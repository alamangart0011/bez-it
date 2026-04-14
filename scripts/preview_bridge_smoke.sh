#!/bin/bash

# Проверка наличия файлов preview-компонента
if [ ! -f frontend/src/preview/SignalumRoomBasedPreview.jsx ]; then
  echo '[ERROR] SignalumRoomBasedPreview.jsx not found!'
  exit 1
fi

if [ ! -f frontend/src/preview/SignalumRoomBasedPreviewPage.jsx ]; then
  echo '[ERROR] SignalumRoomBasedPreviewPage.jsx not found!'
  exit 1
fi

if [ ! -f frontend/src/preview/buildRoomBasedPreviewModel.js ]; then
  echo '[ERROR] buildRoomBasedPreviewModel.js not found!'
  exit 1
fi

if [ ! -f frontend/src/preview/useRoomBasedPreviewRuntime.js ]; then
  echo '[ERROR] useRoomBasedPreviewRuntime.js not found!'
  exit 1
fi

if [ ! -f frontend/src/preview/previewFlags.js ]; then
  echo '[ERROR] previewFlags.js not found!'
  exit 1
fi

# Проверка наличия bridge в App.jsx
if ! grep -q 'SignalumRoomBasedPreview' frontend/src/App.jsx; then
  echo '[ERROR] Bridge for preview not found in App.jsx!'
  exit 1
fi

echo '[OK] Preview bridge files and App.jsx setup are correct.'
