# Next Sprint Backlog (2026-05-25)

По реальному коду. Пункты про XP computation и RU/ES смешение удалены — они закрыты.

---

## P0 — Reward Dispatch (блокирует замыкание игрового цикла)

### Создать `src/engine/rewardEngine.ts`
Что сделать: при `recordSession()` проверять `session.missionReward` и `session.skillMasteryReward` (поля уже объявлены в `types.ts`), начислять XP, разблокировать карточки.
Оценка: 1–2 часа.

### Создать `src/engine/cardPackDrop.ts`
Что сделать: фильтрация вопросов с `packEligible !== false`, генерация пак-дропа по теме при завершении миссии.
Оценка: 1–2 часа.

---

## P1 — Важно (улучшает качество сессий)

### ReviewSession — показать навыки и статус после повтора
Файл: `src/screens/ReviewSession.tsx`
Что сделать: в экране `done` добавить breakdown по skills — какие улучшились, какие ещё слабые. По аналогии с `SessionSummary`.
Оценка: 1 час.

### SkillMapScreen — подсказка для blocked-навыка
Файл: `src/screens/SkillMapScreen.tsx`
Что сделать: в expanded panel заблокированного навыка показать, какой prerequisite нужно освоить сначала (данные есть в `skill.prerequisiteSkillIds` → `SKILLS_BY_ID`).
Оценка: 30 мин.

### OnboardingScreen — inline строка в i18n
Файл: `src/screens/OnboardingScreen.tsx`, строка 157
Что сделать: `{lang === "ru" ? "Пропустить пока" : "Saltar por ahora"}` → добавить ключ в `strings.ts` и использовать `t()`.
Оценка: 15 мин.

---

## P2 — Визуальный QA

### QA на реальных устройствах
Проверить 375px и 430px вручную.
Особое внимание: SkillMapScreen grid, LessonScreen mission bar, ParentDashboard trends.

---

## P3 — Будущее

- Analytics: отправлять события сессии (topic, kind, accuracy, xpEarned) в Amplitude/PostHog
- A/B тест: boss-миссия с анимацией vs без
- Отдельные файлы `src/i18n/ru.ts` и `src/i18n/es.ts` (если strings.ts > 800 строк)
- Тесты для `buildSkillMastery` и `buildDailyMission` (jest/vitest)
- Mercado Pago Link + one-time pack (Stage 3)
