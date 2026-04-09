# V22 component split queue

1. AuthPage
2. MainShell
3. SidebarRail
4. RoomsSidebar
5. RoomHeader
6. MessagesPane
7. MembersPanel
8. VoiceOverlay
9. CommandPalette
10. ModalLayer

Принцип:
- сначала вынести без смены контракта;
- потом чистить state boundaries;
- потом удалять мёртвые auth/legacy ветки.
