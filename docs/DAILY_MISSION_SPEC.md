# Daily Mission Spec

> Последнее обновление: 2026-05-23

## Типы миссий (DailyMissionKind)

| Тип | Триггер | XP | Время |
|-----|---------|-----|-------|
| `new` | Навык = new, prerequisites готовы | 50 | 12 мин |
| `repair` | Навык = needs_review | 40 | 10 мин |
| `consolidate` | Навык = learning | 30 | 10 мин |
| `challenge` | Навык = stable/mastered, 2+ хороших сессии | 80 | 15 мин |
| `maintenance` | Навык mastered/stable, не практиковался 5+ сессий | 20 | 8 мин |
| `boss` | Все навыки темы stable+, 20+ практик, ни одного boss за 10 сессий | 150 | 20 мин |

## Приоритет выбора (buildDailyMission)

```
repair → new → consolidate → maintenance → boss → challenge
```

## Тип DailyMission

```ts
type DailyMission = {
  kind: DailyMissionKind;
  focusSkillId: string;
  title: LocalizedText;
  outcome: LocalizedText;
  reason: LocalizedText;
  status: SkillMasteryStatus;
  masteryPct: number | null;
  estimatedMinutes: number;   // NEW: расчётное время в минутах
  xpReward: number;           // NEW: XP за выполнение
};
```

## buildMissionForSkill(skillId, state)

Используется при переходе с карты навыков (`/lesson/:topicId?skill=:skillId`).
Возвращает миссию для конкретного навыка — тип определяется его текущим статусом.

## Предотвращение повторений

`recentMissionCount(skillId, state)` — считает сколько раз навык был целью в последних 3 сессиях.
Миссии repair и consolidate не выдаются если count >= 2.

## boss-миссия

- Редкое событие: проверяет `recentBossCount(topicId, state)` за последние 10 сессий.
- Если count > 0 — boss не выдаётся.
- Фокус на самом сложном навыке темы (max skill.level).
- В LessonScreen отображается Badge "Финальный экзамен" / "Examen final".

## Reward placeholder

Поле `missionReward?: RewardPlaceholder` на `StudySession` — заполняется будущим reward-движком.
`xpReward` на `DailyMission` — будет суммироваться в `session.xpEarned`.
