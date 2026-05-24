# Next Sprint Backlog

> После Product Quality Sprint v2 | 2026-05-23

## P0 — Критично (блокирует полноценный релиз)

### XP computation в LessonScreen
Файл: `src/screens/LessonScreen.tsx`, функция `finishSession()`  
Что сделать: суммировать `(q.xp ?? 10)` за каждый правильный ответ, записать в `session.xpEarned`.  
Оценка: 30 мин.

### Оценить и заполнить xp/rarity на вопросах в JSON
Файлы: `src/content/questions/*.json`  
Что сделать: добавить поля `"xp": N` и `"rarity": "..."` на сложные вопросы.  
Оценка: 2-3 часа.

## P1 — Важно (улучшает качество)

### ¡ и ¿ в ES строках
Файл: `src/i18n/strings.ts`  
Что сделать: добавить открывающие ¡ и ¿ в восклицательных и вопросительных ES строках.

### ES акценты в dailyMission.ts
Файл: `src/engine/dailyMission.ts`  
Что сделать: все inline ES строки ("todavia", "practica", "mision") заменить на варианты с диакритикой.

### Визуальный QA на реальных устройствах
Проверить 375px и 430px вручную. Особое внимание: SkillMapScreen grid, LessonScreen mission bar, ParentDashboard trends.

### ReviewSession — показать навыки и статус после повтора
Файл: `src/screens/ReviewSession.tsx`  
Что сделать: по аналогии с SessionSummary добавить итог навыков.

## P2 — Желательно

### Reward dispatch
Файл: новый `src/engine/rewardEngine.ts`  
Что сделать: при `recordSession()` проверять `missionReward` и `skillMasteryReward`, начислять XP, разблокировать карточки.

### Pack eligibility
Файл: `src/engine/cardPackDrop.ts` (новый)  
Что сделать: фильтрация вопросов с `packEligible !== false`, генерация пак-дропа по теме.

### blocked — визуальная подсказка что нужно сделать
Файл: `src/screens/SkillMapScreen.tsx`  
Что сделать: в expanded-панели заблокированного навыка показать какой prerequisite нужно освоить сначала.

### Онбординг — финальная i18n проверка
Файл: `src/screens/OnboardingScreen.tsx`  
Что сделать: убедиться что все inline строки уже через t(), или перевести.

## P3 — Будущее

- Отдельные файлы `src/i18n/ru.ts` и `src/i18n/es.ts` (если strings.ts > 800 строк)
- Тесты для `buildSkillMastery` и `buildDailyMission` (jest/vitest)
- Тест генератора вопросов на выходные типы (уже частично есть в `test-generator.mjs`)
- Analytics: отправлять события сессии (topic, kind, accuracy, xpEarned) в Amplitude/PostHog
- A/B тест: boss-миссия с анимацией vs без
