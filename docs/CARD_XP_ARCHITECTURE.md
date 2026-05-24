# Card/XP Architecture

> Последнее обновление: 2026-05-23  
> Статус: Data layer ready. UI layer — не реализован.

## Модель данных

### Question (src/engine/types.ts)

```ts
rarity?: CardRarity;       // "common" | "rare" | "epic" | "mythic" | "legend"
cardType?: CardType;       // "training" | "trick" | "speed" | "explain" | "visual" | "boss" | "comeback"
xp?: number;               // XP за правильный ответ (default: 10)
packEligible?: boolean;    // Может появиться в пак-дропе (default: true)
```

### StudySession (src/engine/types.ts)

```ts
xpEarned?: number;                   // Итого XP за сессию
missionReward?: RewardPlaceholder;   // Награда за выполнение миссии
skillMasteryReward?: RewardPlaceholder; // Награда за достижение порога мастерства
```

### RewardPlaceholder (src/engine/types.ts)

```ts
type RewardPlaceholder = {
  kind: "card_pack" | "skill_badge" | "xp_bonus";
  amount: number;
  seriesId?: string; // ограничение по серии карточек
};
```

### CardRarity (src/engine/types.ts)

| Rarity | Визуал | Источник |
|--------|--------|---------|
| common | Серый | difficulty <= 2 |
| rare | Синий | difficulty = 3 |
| epic | Фиолетовый | difficulty = 4 |
| mythic | Золотой | difficulty = 5 |
| legend | Радужный | специальные вопросы |

Логика деривации: `deriveRarity(question)` в `src/cardVisuals.ts`.

### CardType

| Type | Иконка | Описание |
|------|--------|----------|
| training | 🎯 | Стандартный вопрос |
| trick | ⚠️ | Вопрос-ловушка |
| speed | ⚡ | На скорость |
| explain | 💬 | Объяснить шаг |
| visual | 👁️ | Геометрия/диаграмма |
| boss | 💀 | Финальный вопрос |
| comeback | 🔁 | Повторный вопрос после ошибки |

## Что ещё нужно реализовать

1. **XP computation**: в `LessonScreen.finishSession()` суммировать `(q.xp ?? 10)` за каждый правильный ответ → `session.xpEarned`.
2. **Pack eligibility filter**: при генерации пак-дропа фильтровать `question.packEligible !== false`.
3. **Reward dispatch**: reward-движок читает `missionReward` и `skillMasteryReward` из сессии и доставляет награды игроку.
4. **XP display**: показывать `+{xp} XP` на карточке после правильного ответа.
5. **Rarity unlock**: футболист разблокируется при `xpEarned >= threshold` по теме.

## Football Academy интеграция

Футболисты: `src/content/footballers.ts`  
Логика разблокировки: `src/engine/squad.ts`  
Визуал карточек: `src/cardVisuals.ts`, `src/components/QuestionCard.tsx`
