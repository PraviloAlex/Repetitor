# Durillo — стартовый пакет MVP

Дата: 2026-05-22

**Durillo** — mobile-first web/PWA продукт для Аргентины: математика для детей 10–13 лет, переход primaria → secundaria и подготовка к ingreso. Ребёнок занимается короткими сессиями 15–25 минут, получает простые объяснения, а родитель видит реальное время, правильные ответы, сложные темы и рекомендацию.

## Главная гипотеза
Родители уже платят за тетради, курсы и репетиторов. Если дать более дешёвый цифровой формат с понятными объяснениями и отчётом, часть родителей готова платить за доступ.

## Рекомендуемый путь
1. Сначала web/PWA: быстро тестировать в WhatsApp/Telegram-группах, без модерации магазина.
2. Затем Android: после подтверждения спроса, когда нужны push, offline и более сильный focus tracking.
3. Не начинать с рекламы детям: лучше freemium, пробный доступ, сезонный pack или подписка родителя.

## Состав пакета
- `AGENTS.md` — правила для AI-агентов.
- `CLAUDE.md` — правила для Claude/Cowork.
- `docs/00_IDEA_ANALYSIS.md` — разбор идеи.
- `docs/01_PRODUCT_STRATEGY.md` — стратегия.
- `docs/02_MVP_SCOPE.md` — объём MVP.
- `docs/03_CURRICULUM_CONTENT_MAP.md` — карта тем.
- `docs/04_UX_SPEC.md` — UX.
- `docs/05_PARENT_DASHBOARD.md` — кабинет родителя.
- `docs/06_AI_CONTENT_SYSTEM.md` — генерация контента.
- `docs/07_TECH_ARCHITECTURE.md` — архитектура.
- `docs/08_MONETIZATION_AND_LAUNCH.md` — монетизация и запуск.
- `docs/09_LEGAL_PRIVACY_KIDS.md` — дети, данные, реклама.
- `docs/10_ROADMAP.md` — roadmap.
- `docs/11_TASKS_STAGE_1.md` — первые задачи.
- `docs/12_COPY_AND_POSITIONING.md` — тексты и позиционирование.
- `docs/13_PROMPTS_FOR_AI_AGENTS.md` — промпты для Codex/Claude.
- `docs/GAME_LAYER_SPEC.md` — спокойный игровой слой (миссия, XP, streak, бейджи).
- `docs/FOOTBALL_ACADEMY_SPEC.md` — коллекционный футбольный слой и генератор заданий.
