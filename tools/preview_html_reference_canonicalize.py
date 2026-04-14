from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

files = {
    ROOT / 'frontend/src/App.preview.jsx': "import React from 'react';\nimport SignalumRoomBasedPreviewHtmlReferencePage from './preview/SignalumRoomBasedPreviewHtmlReferencePage.jsx';\n\nexport default function AppPreview() {\n  return <SignalumRoomBasedPreviewHtmlReferencePage />;\n}\n",
    ROOT / 'frontend/src/preview/SignalumRoomBasedPreview.jsx': "export { default } from './SignalumRoomBasedPreviewHtmlReference.jsx';\n",
    ROOT / 'frontend/src/preview/SignalumRoomBasedPreviewOpsPage.jsx': "export { default } from './SignalumRoomBasedPreviewHtmlReferencePage.jsx';\n",
}

for path, content in files.items():
    path.write_text(content, encoding='utf-8')
    print(f'[OK] wrote {path.relative_to(ROOT)}')

print('[OK] preview HTML reference canonical wiring applied')
