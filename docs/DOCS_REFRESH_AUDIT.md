# Docs Refresh Audit (2026-05-25)

Проверка по реальному коду приложения. Не по памяти, не по старым спекам.

---

## Подтверждено как закрытое (код есть)

| Пункт | Файл |
|-------|------|
| Quality-gate генератора (anti-ambiguity, anti-repeat, anti-trivial, reconstruct) | `app/scripts/test-generator.mjs` |
| Repair UI: Коротко (1 шаг) / Подробно (3 шага) | `src/components/QuestionCard.tsx` |
| Repair-вопрос сразу после ошибки | `src/screens/LessonScreen.tsx` |
| Anchor-вопрос в начале темы | `src/screens/LessonScreen.tsx` → `buildAnchorQuestion` |
| XP computation в finishSession | `src/screens/LessonScreen.tsx` строки 292–315 |
| Parent analytics слой | `src/lib/parentAnalytics.ts` |
| 7 статусов SkillMastery | `src/engine/skillMastery.ts` |
| 6 видов миссий | `src/engine/dailyMission.ts` |
| Spaced-repetition + reviewSchedule | `src/engine/skillProgressTracker.ts` + `src/storage/localProgress.ts` |
| Data layer Card/XP (типы + JSON поля) | `src/engine/types.ts`, все `src/content/questions/*.json` |
| i18n полная (43 навыка, все ключи) | `src/i18n/strings.ts`, `src/i18n/skillLabels.ts` |

---

## Подтверждено как НЕ закрытое (кода нет)

| Пункт | Статус |
|-------|--------|
| `rewardEngine.ts` — dispatch XP/карточек при `missionReward` / `skillMasteryReward` | Файл не существует |
| `cardPackDrop.ts` — фильтрация `packEligible`, генерация пак-дропа | Файл не существует |
| ReviewSession — итог навыков после повтора | Экран done без skill breakdown |
| SkillMapScreen — подсказка что нужно для blocked-навыка | Не реализовано в expanded panel |
| OnboardingScreen — одна inline строка вне `t()` | Строка 157: `"Пропустить пока"` / `"Saltar por ahora"` |
| Day-to-day adaptive QA (сценарный прогон серии сессий) | Нет автоматической проверки |

---

## Что считать устаревшим

Следующие документы описывают вещи как «запланированные» или «не начатые», хотя они уже реализованы,
либо описывают ранние стадии проекта, которые давно пройдены:

- `11_TASKS_STAGE_1.md` — все 8 задач выполнены, файл стал историческим
- `02_MVP_SCOPE.md` — описывает MVP до текущего состояния
- `04_UX_SPEC.md` — ранняя UX-спека, не отражает текущий UI
- `05_PARENT_DASHBOARD.md` — заменён реализацией и `PARENT_DASHBOARD_SPEC.md`
- `PRODUCT_QUALITY_SPRINT_V2.md` — Implementation Record завершённого спринта, более не активен
- `EXPERT_DEBATE.md` — споры разрешены, зафиксированы в HANDOFF; отдельный файл не нужен
- `00_IDEA_ANALYSIS.md` — начальный анализ идеи, исторический

---

## Рабочие документы (единственный источник правды)

1. `HANDOFF.md`
2. `CURRENT_PRODUCT_MAP.md`
3. `DOCS_REFRESH_AUDIT.md` (этот файл)
4. `ROADMAP_VNEXT.md`
5. `NEXT_SPRINT_BACKLOG.md`
6. `CHANGELOG_LATEST.md`
