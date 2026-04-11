# Release progress

## Текущая оценка
- общая готовность релиза: **84%**

## Уже закрыто
- foundation layer
- api runtime wiring
- live runtime handlers for rooms and calls
- runtime handlers for memberships, transcripts, assistant and actions
- web runtime page plans
- web runtime hydrate client
- executable runtime entries for rooms and calls
- executable runtime panels for transcript and assistant
- state contracts for rooms, calls, profile, admin, transcript and assistant
- route map, wiring docs and merge checklist alignment
- runtime execution import cycle fix
- cleanup of orphan messages navigation path

## Осталось
- финальный review-cleanup по naming и consistency
- проверка демонстрационного UI flow на песочнице
- merge-ready pass
- merge в main после review

## Смысл процента
84% означает, что архитектурный каркас, runtime и большая часть web execution уже собраны и влиты в PR, а не просто описаны. Недозакрытая часть — это живая проверка песочницы, финальный review и merge-pass.
