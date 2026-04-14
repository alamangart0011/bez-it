# PREVIEW HTML REFERENCE LOCK

Новый референс для preview-слоя зафиксирован по пользовательскому файлу `preview (1).html`.

Правило:
- этот HTML считать точной визуальной целью для нового preview-shell;
- все следующие cleanup и frontend-pass должны ориентироваться на него, а не на старый preview fallback;
- V2 считать переходным этапом к этому эталону, а не финальной формой.

Что именно считается обязательным из референса:
- трехколоночный layout `280px / 1fr / 340px`;
- sidebar с brand / search / nav / quick blocks / role profile;
- topbar с title, subtitle и compact actions;
- dashboard как диспетчерская рабочего контура;
- room / voice / meeting / admin как отдельные view внутри единого shell;
- context sidebar с operational summary и active contour queue;
- role-switch как часть shell, а не внешний overlay;
- compact pills / cards / feed / participants как основная визуальная система.

Что нельзя возвращать после этого lock:
- старый preview-shell как основной ориентир;
- тяжелый ops-overlay, перекрывающий интерфейс;
- устаревший текст про то, что shell ещё не влит, если bridge уже включён;
- широкие fallback-блоки, которые ломают визуальный ритм референса.

Следующий практический шаг:
- собрать runtime-bound shell, который визуально повторяет `preview (1).html`, но питается живыми данными rooms/messages/members/voice/admin.
