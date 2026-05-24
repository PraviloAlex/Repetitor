# QA Checklist — Durillo / PrepaMate

> Sprint v2 | 2026-05-23

## Брейкпоинты для тестирования

| Устройство | Ширина |
|-----------|--------|
| iPhone SE | 375px |
| iPhone 14 | 390px |
| iPhone Pro Max | 430px |
| iPad | 768px |
| iPad landscape | 1024px |
| Desktop | 1280px |
| Wide | 1920px |

## Автоматические проверки

- [x] `npx tsc -b --noEmit` — чистый
- [x] PostCSS parse `src/styles/base.css` — чистый
- [x] Все `t("key")` ключи определены в strings.ts (RU + ES)
- [x] Все `skill_status_*` ключи: 7/7 в RU и ES
- [x] Все `lesson_mission_kind_*` ключи: 6/6 в RU и ES

## Состояния для ручного тестирования

### ChildHome
| Состояние | Что проверить |
|-----------|--------------|
| 0 сессий | Streak = 0, нет broken strings, нет % |
| Streak 3/7/14 | Milestone баннер, правильное склонение |
| isPremium = false | Замок на топиках, только 2 свободных |
| isPremium = true | Все топики доступны |

### LessonScreen
| Состояние | Что проверить |
|-----------|--------------|
| Lesson phase | Mission card с типом, outcome, reason |
| Questions phase | ProgressBar + %, correct/target счётчик, badge типа миссии |
| Wrong answer | Правильный ответ жирным, объяснение, commonMistake если есть |
| 2+ consecutive wrong | Repair hint появляется |
| Последний вопрос | Кнопка "Завершить" вместо "Дальше" |
| topic не найден | Error state с кнопкой "Назад" |

### SessionSummary
| Состояние | Что проверить |
|-----------|--------------|
| Все правильно | Achievement "Идеальная сессия" |
| Без подсказок | Achievement "Без подсказок" |
| Миссия выполнена | Карточка "Миссия завершена" с mastery% |
| Есть слабые навыки | Секция "Повторить завтра" |
| Skills section | Каждый навык: название + % + статус badge |

### SkillMapScreen
| Состояние | Что проверить |
|-----------|--------------|
| Навык = new | Серый badge "новый" |
| Навык = needs_review | Жёлтый badge "повторить" |
| Навык = blocked | Серый, pointer-events none |
| Первый тап | Раскрывается деталь: хинт + дата + CTA |
| Второй тап | Переход на /lesson/{topicId}?skill={skillId} |
| Миссия дня | Жёлтый badge "Миссия дня" на нужном навыке |

### ParentDashboard
| Состояние | Что проверить |
|-----------|--------------|
| 0 сессий | Все Stats = 0, insight "Нет данных" |
| 1 неделя данных | Тренды +/-% на темах где есть данные за 2 недели |
| Навыки закрепились | "N навыков закрепились на этой неделе" |
| Questions solved | StatCard с totalAnswered |
| Weak skills | Родительский сигнал на русском |
| Язык RU | Названия навыков из skillLabels.ts |

## Известные ограничения (не баги)

- ES-строки в новых ключах без ¡ в начале восклицательных предложений.
- `blocked` статус: только для навыков = new с prerequisite = new. Если навык уже learning/stable — не блокируется.
- `xpEarned` на StudySession всегда undefined (логика ещё не реализована).
- `boss` миссия: требует 20+ всего практик по теме И ни одного boss за 10 сессий.
