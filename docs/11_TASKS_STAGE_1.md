# 11 — Tasks Stage 1

## Цель
Собрать первый рабочий прототип: ребёнок проходит занятие, родитель видит отчёт.

## Task 1 — Project Setup
- Создать mobile-first web app.
- 3 экрана: Home, Lesson, Summary.
- Проверка: 390px выглядит хорошо.

## Task 2 — Content Schema
- `topics.json`
- `questions/*.json`
- минимум 3 темы и 10 вопросов на тему.

## Task 3 — Lesson Flow
Правило → вопросы → explanation → summary.
Критерий: нельзя перейти дальше без ответа, итог показывает correct/total.

## Task 4 — Session Tracking
Считать total time, active time, focus loss, inactivity pause после 60 секунд.
Показывать в UI две метрики раздельно: `tiempo enfocado` (active) и `tiempo en pantalla` (total − blur − idle). Это честнее для родителя и снимает риск ложного спокойствия.

## Task 5 — Parent Summary
Показать active minutes, total minutes, correct answers, hard topic, focus loss, recommendation.

## Task 6 — Local Storage
Сохранять sessions, topic accuracy, streak, parent settings.
Хранить `storageSchemaVersion` рядом с данными, чтобы при будущих миграциях не терять прогресс.

## Task 7 — Parent PIN
4-значный PIN для родительской зоны.

## Task 8 — Share Summary
Кнопка в конце сессии: сформировать текст или PNG итога и открыть `whatsapp://send?text=…`.
Зачем: виральная петля, backup отчёта при потере localStorage, родителю есть что показать партнёру/бабушке.

> Лендинг (бывший Task 8) перенесён в Stage 0 — он валидационный, не часть рабочего прототипа. См. `docs/10_ROADMAP.md`.
