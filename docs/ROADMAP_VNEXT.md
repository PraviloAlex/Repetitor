# Roadmap VNext (2026-05-25)

По реальному коду. Закрытые блоки не повторяются.

---

## Закрыто — не трогать в TODO

- Generator quality-gate
- Repair UI short/full
- Repair question после ошибки
- Anchor question per topic
- XP computation в finishSession
- Parent analytics (status / weakSkills / trend / nextStep)
- 7 статусов SkillMastery
- 6 видов миссий
- Spaced-repetition reviewSchedule
- Data layer Card/XP (типы + JSON поля)
- i18n полная (RU + ES, 43 навыка)

---

## Sprint 1 — Reward Dispatch (P0 → P2)

**Цель:** замкнуть цикл XP → карточки → мотивация.

1. Создать `src/engine/rewardEngine.ts`
   - При `recordSession()` проверять `missionReward` и `skillMasteryReward`
   - Начислять XP, разблокировать карточки
2. Создать `src/engine/cardPackDrop.ts`
   - Фильтрация вопросов с `packEligible !== false`
   - Генерация пак-дропа по теме при завершении миссии
3. ReviewSession — добавить skill breakdown в экран done
   - По аналогии с SessionSummary

---

## Sprint 2 — Polish & QA

**Цель:** убрать все мелкие шероховатости перед тестерами.

1. SkillMapScreen — в expanded panel blocked-навыка показать, какой prerequisite нужно освоить сначала
2. OnboardingScreen строка 157 — `"Пропустить пока"` / `"Saltar por ahora"` через `t()`
3. Визуальный QA на реальных устройствах: 375px, 390px, 430px
   - Особое внимание: SkillMapScreen grid, LessonScreen mission bar, ParentDashboard trends

---

## Sprint 3 — Adaptive Validation

**Цель:** убедиться, что адаптивный цикл работает на реальных данных за несколько дней.

1. Сценарный прогон серии сессий (5–7 дней симулированного прогресса)
2. Проверить review cadence: вопросы возвращаются в нужный день
3. Проверить динамику skill trend и parent insights на накопленных данных
4. Финальный QA-чеклист «ребёнок + родитель» (обновить `QA_CHECKLIST.md`)

---

## Позже (Stage 3+)

- Mercado Pago Link — one-time pack, ручная активация промокода
- Privacy Policy и Condiciones на испанском
- Analytics (Amplitude/PostHog) — события сессии
- PWA install
- Backend / аккаунты (Stage 4)
- Android (Stage 5, только после первых оплат)
