# Design Direction 2026 — Durillo

## Final Direction

Выбираем направление: **Premium Learning OS**.

Durillo должен ощущаться как спокойная образовательная система: ребёнку понятно, что делать сегодня, родителю понятно, что прогресс настоящий, а интерфейс не выглядит ни дешёвой игрой, ни школьным сайтом.

## Navigation Variants

### Variant 1: Premium Top Header

Layout:
`Durillo | Сегодня | Темы | Повторение | Прогресс | Родитель | RU/ES | Профиль`

Active state:
мягкий фон `#EFF6FF`, текст `#2563EB`, тонкая нижняя линия 2px. Без тяжёлой синей капсулы.

Hover state:
фон `#F8FAFC`, текст `#1D4ED8`.

Badge:
маленький 16-18px pill, фон `#EEF2FF`, текст `#3730A3`, border `#C7D2FE`.

Mobile behavior:
top nav скрывается, остаётся bottom nav.

Why better:
подходит для landing/web-first продукта, проще для родителей, меньше “dashboard weight”.

### Variant 2: Desktop Sidebar + Mobile Bottom Nav

Layout:
слева фиксированная панель 240px:
`Durillo`, затем `Сегодня`, `Темы`, `Повторение`, `Прогресс`, `Родитель`, внизу `RU/ES`.

Active state:
фон `#EFF6FF`, левая линия 3px `#2563EB`, текст `#1D4ED8`.

Hover state:
фон `#F8FAFC`, лёгкий translate `1px`, без shadow.

Badge:
маленький quiet badge справа, не красная тревога: `#EEF2FF / #3730A3`.

Mobile behavior:
sidebar скрывается до `768px`, включается `MobileBottomNav`.

Why better:
самый сильный вариант для серьёзного web-app. Даёт иерархию, освобождает верхнюю область, сразу выглядит как учебная платформа.

### Variant 3: Mobile Bottom Nav Only

Layout:
4 пункта максимум: Сегодня, Темы, Повторение, Родитель.

Active state:
маленькая pill-подложка вокруг иконки, label `#2563EB`.

Badge:
12-16px, аккуратный, не красный unless urgent.

Icons:
только SVG stroke icons 2px, без emoji.

Why better:
на телефоне это самый быстрый и понятный паттерн для ребёнка.

## Chosen Direction

Для Durillo выбираем **Variant 2**:

- desktop: sidebar;
- tablet: clean top header допустим как промежуточный режим;
- mobile: bottom nav.

Это даёт лучший баланс: сайт выглядит серьёзно, а мобильный UX остаётся app-like.

## Typography

Fonts:
- Headings: `Manrope`
- Body/UI: `Inter`
- Alternative fallback: `IBM Plex Sans`, system sans

### Mobile

- H1: 24px / 31px / 800
- H2: 20px / 28px / 750
- Card title: 16px / 22px / 700
- Body: 15px / 23px / 400
- Caption: 12px / 16px / 600
- Stat value: 28px / 34px / 800
- Button: 15px / 20px / 700

### Tablet

- H1: 28px / 36px / 800
- H2: 22px / 30px / 750
- Card title: 17px / 24px / 700
- Body: 16px / 25px / 400
- Caption: 12px / 16px / 600
- Stat value: 32px / 38px / 800
- Button: 15px / 20px / 700

### Desktop

- H1: 32px / 40px / 800
- H2: 24px / 32px / 750
- Card title: 18px / 25px / 750
- Body: 16px / 26px / 400
- Caption: 13px / 17px / 600
- Stat value: 36px / 42px / 800
- Button: 15px / 20px / 750

## Color Tokens

```css
--bg: #F8FAFC;
--surface: #FFFFFF;
--surface-muted: #F1F5F9;
--text-primary: #0F172A;
--text-secondary: #64748B;
--border: #E2E8F0;
--primary: #2563EB;
--primary-soft: #EFF6FF;
--success: #16A34A;
--success-soft: #DCFCE7;
--warning: #D97706;
--warning-soft: #FEF3C7;
--review: #4F46E5;
--review-soft: #EEF2FF;
--error: #DC2626;
--locked: #94A3B8;
--locked-soft: #F1F5F9;
--completed: #059669;
--completed-soft: #D1FAE5;
```

Topic colors:
- Operations: `#2563EB`
- Divisibility: `#0F766E`
- Fractions: `#16A34A`
- Decimals: `#7C3AED`
- Percentages: `#EA580C`
- Geometry: `#DB2777`

Use topic colors as accents, not full-card neon fills.

## Card System

Radius:
- cards: 18px
- controls: 12px
- pills: 999px

Shadow:
- default card: `0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.06)`
- active mission: `0 16px 40px rgba(15,23,42,.10)`

Border:
always `1px solid #E2E8F0`, except mission card which can use tinted border.

## Recommended Topic Card

Content:

```text
Рекомендовано сегодня
Кратность, делители и признаки делимости
Научимся быстро понимать, делится ли число на 2, 3, 5 или 10.

38% освоено
12 из 32 навыков
~15 минут

[Продолжить 15 минут]
```

Visual:
- soft teal background, not acidic;
- no giant emoji;
- optional small SVG topic icon;
- progress bar 8px;
- CTA visible and explicit.

## Icon Style

Use one SVG stroke style:
- 20-24px;
- stroke 2px;
- round caps/joins;
- no emoji in nav;
- topic icons can be custom line icons inside soft tinted square.

## Gamification Style

Useful, calm, parent-safe:
- Daily mission;
- XP as effort signal, not addiction loop;
- Streak as consistency;
- Mastery badges per topic;
- Boss quiz as checkpoint;
- Review mistakes as “convert mistakes into progress”.

