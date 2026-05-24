# Parent Dashboard Spec — Durillo

## Goal

Родитель должен за 10 секунд понять:

1. занимался ли ребёнок;
2. где стало лучше;
3. где нужна помощь;
4. что делать дальше.

Dashboard не должен быть слежкой. Он должен показывать прогресс и усилие.

## Core Metrics

### Sessions This Week

Show:
- number of sessions;
- days active;
- average session length.

Good copy:
`4 sesiones esta semana · ritmo constante`

### Time Spent

Show:
- focused time;
- total screen time only as secondary.

Avoid:
making focus loss feel like punishment.

### Accuracy Change

Show:
- current weekly accuracy;
- change from previous week if available.

Example:
`Precisión: 72% (+8%)`

### Weak Topics

Show 1-2 topics only:
- topic name;
- short reason;
- recommended next step.

Example:
`Divisibilidad: conviene repasar criterios de 3 y 5. Próximo paso: 7 preguntas cortas.`

### Topics Mastered

Show:
- topic badges;
- completed checkpoints;
- mastery percentage.

This is monetization-relevant because parents see value.

### Recommended Next Step

Always include one action:
- `Repasar 7 errores`
- `Continuar 15 minutos`
- `Hacer desafío final`

## Layout

Desktop:
- top summary row: sessions, focused time, accuracy, streak;
- main two columns:
  - left: weekly activity + weak topics;
  - right: mastery badges + next recommendation.

Mobile:
- vertical cards;
- summary first;
- recommendation second;
- details lower.

## Copy Principles

Use:
- progress;
- effort;
- next step;
- confidence.

Avoid:
- surveillance language;
- shame;
- comparisons with other children;
- “bad performance”.

## Monetization Value

Premium parent dashboard can include:
- weekly report;
- topic mastery map;
- weak topic explanation;
- export/share to WhatsApp;
- recommended plan for next week.

Do not put core child learning behind confusing paywalls. Premium should feel like more insight and structure for the family.

## Weekly Report

Format:

```text
Resumen semanal
Sesiones: 4
Tiempo enfocado: 52 min
Precisión: 74%
Tema fuerte: Operaciones
Tema para reforzar: Divisibilidad
Próximo paso: 7 preguntas de repaso mañana
```

## Acceptance Criteria

- Parent understands the week in 10 seconds.
- No excessive child surveillance.
- Works in RU and ES.
- Share text is concise.
- Empty state says what to do next.

