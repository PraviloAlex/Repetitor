# Game Layer Spec — Durillo

## Principle

Gamification must support learning, not distract from it. The product should feel motivating, calm and parent-safe.

## Daily Mission

Daily mission is the main loop.

Example:

```text
Миссия сегодня
Продолжить тему: Кратность и делимость
7 вопросов · примерно 8 минут · +40 XP
```

Rules:
- one primary mission per day;
- based on weakest available topic or review queue;
- should be completable in 7-15 minutes;
- never show punishment for missing a day.

## XP

XP measures effort.

Suggested values:
- answer question: +3 XP;
- correct answer: +2 bonus XP;
- finish session: +15 XP;
- review mistake correctly: +5 XP;
- finish daily mission: +25 XP.

Parent-safe wording:
XP means practice effort, not intelligence.

## Streak

Streak measures consistency.

Rules:
- count one completed session per day;
- show streak softly;
- do not create aggressive loss aversion;
- allow “recovery day” later if monetization supports it, but do not make it manipulative.

Milestones:
- 3 days: rhythm badge;
- 7 days: weekly consistency;
- 14 days: strong habit.

## Review Mistakes Loop

Rename mentally:
from “mistakes waiting” to “turn mistakes into progress”.

Flow:
1. Child answers incorrectly.
2. Question enters review queue.
3. Daily mission recommends 5-7 review questions.
4. Correct review removes item from queue.
5. Child gets XP and sees progress recovered.

Copy:
- serious: `Закрепим 7 вопросов за 8 минут`
- friendly: `Вернём уверенность в сложных местах`
- gamified: `Преврати ошибки в +40 XP`

## Mastery Badges

Badges are topic mastery markers.

Levels:
- Started: at least one session.
- Practicing: 30-69%.
- Strong: 70-89%.
- Mastered: 90%+ with at least 20 answered questions.

Badge examples:
- `Divisibility Strong`
- `Fractions Started`
- `Geometry Mastered`

## Boss Quiz

Each topic can end with a checkpoint:
- 8-10 mixed questions;
- no hints by default;
- parent-safe result;
- unlocks Mastered badge if score >=80%.

Tone:
Call it `Desafío final` in ES, not “boss” in parent-facing copy.

## Topic Path / Map

Path is a calm learning map:

1. Operaciones
2. Divisibilidad
3. Fracciones
4. Decimales
5. Porcentajes
6. Geometría

Each topic node shows:
- status;
- mastery %;
- estimated next action;
- locked/free state.

## Parent-Safe Explanation

Parents should see:

```text
La gamificación se usa para sostener la constancia y mostrar progreso.
No mide inteligencia ni compara al niño con otros.
```

Russian:

```text
Игровые элементы помогают ребёнку сохранять ритм и видеть прогресс.
Они не измеряют интеллект и не сравнивают ребёнка с другими.
```

