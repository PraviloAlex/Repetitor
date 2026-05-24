# Skill Mastery Spec

> Последнее обновление: 2026-05-23

## Типы статусов (SkillMasteryStatus)

| Статус | Условие | Визуал |
|--------|---------|--------|
| `new` | practiced = 0 | Серый (neutral) |
| `learning` | practiced >= 1, не достиг stable | Синий (primary) |
| `stable` | practiced >= 4, accuracy >= 75% | Зелёный (success) |
| `mastered` | practiced >= 7, accuracy >= 90%, recentMistakes = 0 | Зелёный (success) |
| `challenge_ready` | practiced >= 4, accuracy >= 85%, recentMistakes = 0 | Фиолетовый (review) |
| `needs_review` | recentMistakes >= 2 ИЛИ (practiced >= 2 AND accuracy < 65%) | Жёлтый (warning) |
| `blocked` | status = new AND хотя бы один prerequisite = new | Серый, pointer-events: none |

Порядок проверки в `buildSkillMastery`:
1. `needs_review` (приоритет — исправить ошибки важнее всего)
2. `new` (если practiced = 0)
3. `mastered`
4. `challenge_ready`
5. `stable`
6. `learning` (fallback)
7. Второй проход: `blocked` (если status = new И prereq = new)

## Поля SkillMastery

```ts
type SkillMastery = {
  skill: SkillDefinition;
  practiced: number;        // сколько сессий содержали этот навык
  mistakes: number;         // всего ошибок за историю
  recentMistakes: number;   // ошибки за последние 4 сессии
  accuracy: number | null;  // (practiced - mistakes) / practiced * 100
  status: SkillMasteryStatus;
  lastPracticedAt?: string; // ISO дата последней сессии с этим навыком
};
```

## Prerequisite граф

Определён в `src/engine/skills.ts` — поле `prerequisiteSkillIds: string[]` на каждом навыке.

Примеры:
- `subtraction` → требует `addition`
- `division` → требует `multiplication`
- `fraction-simplify` → требует `divisibility-conditions`
- `divisibility-6` → требует `divisibility-2` + `divisibility-3`

## Используется в

- `src/engine/dailyMission.ts` — выбор следующей миссии
- `src/screens/SkillMapScreen.tsx` — визуализация карты навыков
- `src/screens/SessionSummary.tsx` — итог сессии
- `src/screens/ParentDashboard.tsx` — снимок навыков для родителя
