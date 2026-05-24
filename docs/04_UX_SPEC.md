# 04 — UX Spec

## UX-цель
Ребёнок занимается сам. Родитель за 10 секунд понимает: занимался ли ребёнок, что получилось, где проблема, что делать завтра.

## Экраны

### Parent Onboarding
- имя/ник ребёнка;
- grade: 6°, 7°, ingreso;
- цель: reforzar base / preparar ingreso / mejorar notas;
- дневная цель: 10/15/20/30 минут.

Не спрашивать школу, фамилию, адрес, точную дату рождения.

### Child Home
- сегодняшнее занятие;
- кнопка “Empezar”;
- прогресс недели;
- streak;
- рекомендованная тема.

### Lesson
- правило 60–120 слов;
- 3 примера;
- кнопка “Practicar”;
- прогресс 1/10.

### Question
- вопрос;
- ответ;
- подсказка;
- объяснение после ответа.

### Session Summary
Для ребёнка: “18 минут, 7/10, завтра продолжим”.
Для родителя: active time, correct answers, hard topic, focus loss, recommendation.

## Focus tracking
Можно считать:
- active time;
- total time;
- blur/focus;
- visibilitychange;
- inactivity after 60 seconds;
- pause count.

Нельзя:
- камера;
- микрофон;
- запись экрана;
- формулировки “ребёнок обманывал”.

Правильные слова: “tiempo enfocado”, “pausas”, “pantalla en segundo plano”.

## Ошибка
Не использовать агрессивный красный экран. Формула:
1. “Casi. Revisemos el paso clave.”
2. объяснение;
3. похожий пример.
