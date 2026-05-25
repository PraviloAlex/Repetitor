# HANDOFF — Actual State (2026-05-25)

## Проверено по коду

- `npm run test:generator` — проходит
- `npm run build` — проходит
- `npx tsc -b --noEmit` — чистый

---

## Что реализовано в коде (подтверждено файлами)

### LessonScreen (`src/screens/LessonScreen.tsx`)
- Anchor-вопрос в начале сессии (`buildAnchorQuestion`)
- Repair-вопрос сразу после ошибки (вставка в sessionQuestions с `MAX_REPAIR_INSERTIONS = 3`)
- `finishSession()` — XP считается корректно: `sessionQuestions.filter(not wrong).reduce((sum, q) => sum + (q.xp ?? 10), 0)`, результат пишется в `session.xpEarned`
- Mission bar с badge типа миссии и счётчиком `correct/target` во время вопросов
- Adaptive profile + dailyMission интегрированы в `generatorOptions`
- Клавиатурная навигация через QuestionCard

### QuestionCard (`src/components/QuestionCard.tsx`)
- Repair UI: `Коротко (1 шаг)` / `Подробно (3 шага)` через `lang === "ru" ? ... : ...` (inline, не через `t()` — единственное место без i18n-функции)
- Post-error блок с микро-правилом из `rulesMicro.ts`

### ReviewSession (`src/screens/ReviewSession.tsx`)
- Overdue-вопросы из `getOverdueReviewIds`
- Repair-вопрос при `wrongStreak >= 2`
- Экран done: показывает `correctCount/questions.length` и `accuracy %`
- **Нет** итогового списка навыков после повтора (в отличие от SessionSummary)

### ParentDashboard (`src/screens/ParentDashboard.tsx`)
- Полностью реализован: status, weakSkills, trend, nextStep, sparkline, метрики
- `buildParentDashboardInsight` из `lib/parentAnalytics.ts`
- Строки UI через `lang === "ru" ? ... : ...` inline (не через `t()`) — архитектурное решение, не баг
- Одна смешанная строка: `actionLabel` при `linkedSkill` — ES на обоих языках (titleEs всегда ES)
- Переход в урок по конкретному навыку через `?skill=` работает

### Engine
- `rulesMicro.ts` — микро-правила для repair по всем ключевым skills
- `skillMastery.ts` — 7 статусов: new / learning / stable / mastered / challenge_ready / needs_review / blocked
- `dailyMission.ts` — 6 видов миссий: new / repair / consolidate / challenge / maintenance / boss
- `parentAnalytics.ts` — `calculateOverallStatus`, `getWeakSkills`, `getProgressTrend`, `getParentNextStep`
- `skillProgressTracker.ts` — spaced-repetition, `computeIngressoReadiness`
- `adaptiveDifficulty.ts` — adaptive profile per topic
- `generator.ts` + `test-generator.mjs` — quality-gate: anti-ambiguity, anti-repeat, anti-trivial, reconstruct checks

### Storage (`src/storage/localProgress.ts`)
- `storageSchemaVersion = 1`
- `reviewSchedule` — ISO-date per questionId
- `skillProgress` — per-skill spaced-repetition state
- Промокод `INGRESO2027` активирует premium (hardcoded, без backend)

### i18n
- `strings.ts` — плоская таблица `ru` + `es`, `StringKey = keyof typeof STRINGS.ru`
- `skillLabels.ts` — русские названия для 43 навыков (отдельный файл из-за лимита TS на кириллицу > 16 KB)
- Все `t("key")` ключи определены в обоих языках

### Data layer (Card/XP)
- Поля `rarity`, `cardType`, `xp`, `packEligible` объявлены в `types.ts`
- Поля `xpEarned`, `missionReward`, `skillMasteryReward` объявлены в `StudySession`
- Все 6 JSON-файлов вопросов содержат `xp` и `rarity` на каждом вопросе
- `missionReward` и `skillMasteryReward` — placeholder-поля, **не заполняются** ни одним движком

---

## Что НЕ реализовано (подтверждено отсутствием файлов/кода)

| Что | Где должно быть | Статус |
|-----|----------------|--------|
| `rewardEngine.ts` | `src/engine/rewardEngine.ts` | Файл не существует |
| `cardPackDrop.ts` | `src/engine/cardPackDrop.ts` | Файл не существует |
| Итог навыков в ReviewSession | `src/screens/ReviewSession.tsx` | Экран done не показывает skills |
| blocked-навык: подсказка о prerequisite | `src/screens/SkillMapScreen.tsx` | Expanded panel не объясняет, что нужно сделать сначала |
| Онбординг — одна inline строка | `src/screens/OnboardingScreen.tsx` строка 157 | `"Пропустить пока"` / `"Saltar por ahora"` inline |

---

## Один источник правды

- `docs/HANDOFF.md` — этот файл
- `docs/CURRENT_PRODUCT_MAP.md`
- `docs/ROADMAP_VNEXT.md`
- `docs/NEXT_SPRINT_BACKLOG.md`
