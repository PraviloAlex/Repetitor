# Current Product Map (2026-05-25)

Актуальная карта продукта по коду. Не по планам и спекам.

---

## Реализовано и работает

### Learning
- Генератор задач по темам + skill focus (`generator.ts`)
- 6 тем: operaciones, divisibilidad, fracciones, decimales, porcentajes, geometria
- Anchor-question в начале каждой сессии (первый вопрос = базовый пример по теме)
- Repair-flow после ошибки: микро-правило (`rulesMicro.ts`) + похожий упрощённый вопрос вставляется следующим
- Два формата объяснения: Коротко (1 шаг) / Подробно (3 шага)
- Quality-gate генератора: anti-ambiguity, anti-repeat, anti-trivial, reconstruct-check (`test-generator.mjs`)
- Статичные вопросы из JSON + процедурно-генерируемые вопросы, смешиваются в сессии

### Adaptive
- `adaptiveDifficulty.ts` — adaptive profile per topic (repair / challenge / baseline)
- `skillProgressTracker.ts` — spaced-repetition, review schedule per question
- `skillMastery.ts` — 7 статусов навыка: new / learning / stable / mastered / challenge_ready / needs_review / blocked
- `dailyMission.ts` — 6 видов миссий: new / repair / consolidate / challenge / maintenance / boss
- `buildMissionForSkill` — skill-override через URL `?skill=`
- `computeIngressoReadiness` — готовность к ingreso по всем навыкам

### Parent
- Parent PIN flow (`ParentPinScreen.tsx`)
- `ParentDashboard.tsx` — status / weakSkills (до 3) / trend / nextStep / sparkline / 4 метрики
- `parentAnalytics.ts` — `calculateOverallStatus`, `getWeakSkills`, `getProgressTrend`, `getParentNextStep`
- Переход в урок по слабому навыку прямо из дашборда
- Промокод `INGRESO2027` активирует premium (без backend)

### Game layer (частично)
- `squad.ts` — вымышленные игроки, разблокировка по топикам
- `kaizenProgress.ts` — kaizen delta (прогресс за последнюю сессию)
- `missionComposer.ts` — `getTodaysMission` для ChildHome
- Data layer карточек: поля `rarity`, `cardType`, `xp`, `packEligible` в типах и JSON
- `xpEarned` корректно считается в `LessonScreen.finishSession()` и пишется в сессию
- Reward placeholders (`missionReward`, `skillMasteryReward`) объявлены в типах, но **не заполняются**

### i18n
- Две локали: `ru` и `es`, переключение через LangSwitch
- Все строки через `t()` / `pick()`, кроме 2 мест (QuestionCard repair toggle, OnboardingScreen skip)
- `skillLabels.ts` — русские переводы 43 навыков

### Storage
- `localProgress.ts` — localStorage, `storageSchemaVersion = 1`
- `reviewQueue`, `reviewSchedule`, `skillProgress` — все поля на месте

---

## Не реализовано

| Что | Примечание |
|-----|-----------|
| `rewardEngine.ts` | Файл отсутствует. Reward dispatch не работает |
| `cardPackDrop.ts` | Файл отсутствует. Pack drop не работает |
| Итог навыков в ReviewSession | Экран done показывает только score, без breakdown по skills |
| Подсказка о prerequisite для blocked-навыка | SkillMapScreen не объясняет что нужно сделать сначала |
| Analytics (Amplitude/PostHog) | Не подключены |
| PWA install | Не реализован |
| Backend / аккаунты | Намеренно отложены до Stage 4 |
