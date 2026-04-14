from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

files = {
    ROOT / 'frontend/src/App.preview.jsx': "import React from 'react';\nimport SignalumRoomBasedPreviewOpsPageV2 from './preview/SignalumRoomBasedPreviewOpsPageV2.jsx';\n\nexport default function AppPreview() {\n  return <SignalumRoomBasedPreviewOpsPageV2 />;\n}\n",
    ROOT / 'frontend/src/preview/SignalumRoomBasedPreview.jsx': "export { default } from './SignalumRoomBasedPreviewV2.jsx';\n",
    ROOT / 'frontend/src/preview/SignalumRoomBasedPreviewOpsPage.jsx': "export { default } from './SignalumRoomBasedPreviewOpsPageV2.jsx';\n",
}

for path, content in files.items():
    path.write_text(content, encoding='utf-8')
    print(f'[OK] wrote {path.relative_to(ROOT)}')

print('[OK] preview v2 canonical wiring applied')
