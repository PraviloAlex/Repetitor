# Durillo — приложение (Stage 1)

Mobile-first web/PWA на Vite + React + TypeScript. Без backend, прогресс в `localStorage`.

## Структура

```
app/
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  public/
    manifest.webmanifest
    icon.svg
  src/
    main.tsx
    App.tsx
    styles/base.css
    content/
      topics.json
      questions/
        operaciones.json
        divisibilidad.json
        fracciones.json
    components/
      QuestionCard.tsx
    engine/
      types.ts
      answerChecker.ts
      sessionTracker.ts
      recommendationEngine.ts
    storage/
      localProgress.ts
    screens/
      ChildHome.tsx
      LessonScreen.tsx
      SessionSummary.tsx
      ParentPinScreen.tsx
      ParentDashboard.tsx
```

## Что уже работает

- 3 темы (operaciones, divisibilidad, fracciones), по 10 заданий каждая (заглушки — будете заменять).
- Lesson flow: правило → 10 вопросов → объяснение → итог.
- 3 типа вопросов: `multiple_choice`, `numeric_input` (с нормализацией запятой/точки), `true_false`.
- Подсказка по запросу (`hintEs`), счётчик использованных подсказок.
- Две метрики времени раздельно: `tiempo enfocado` (active) и `tiempo en pantalla` (total). Сессия меряется через `visibilitychange`, `blur/focus`, `pointerdown/keydown/touchstart` + 60-секундный idle threshold.
- Кнопка «Compartir resumen por WhatsApp» — формирует текст и открывает `wa.me`.
- Родительская зона за 4-значным PIN (локальный хэш).
- Дашборд родителя: 7 дней — сессии, время enfocado, точность, по темам, рекомендация.
- `storageSchemaVersion` записывается в `localStorage`, чтобы потом мигрировать без потери.
- PWA manifest (`Add to Home Screen` сработает в Chrome/Safari).

## Чего ещё нет (по плану — Stage 2+)

- Реальный, проверенный контент. Сейчас задания помечены `"verified": false` — это сигнал для контент-ревью с ребёнком/супругой.
- Service worker / offline. Manifest есть, SW не подключал, чтобы не путать кэш на этапе быстрой итерации.
- Weekly summary, Mercado Pago Link, Privacy Policy — это Stage 2.5 и Stage 3.

## Локальный запуск

```bash
cd app
npm install
npm run dev
```

Vite поднимется на `http://localhost:5173`. Откроется на любом устройстве в той же Wi-Fi сети — посмотри в выводе строку `Network:` (например, `http://192.168.0.12:5173`), отдай ребёнку с телефона.

## Сборка для деплоя

```bash
npm run build
```

Готовый бандл — в `app/dist/`. Развернуть можно двумя способами:

**1. Netlify drag-and-drop (без аккаунта-CI).**
Открой <https://app.netlify.com/drop> и перетащи папку `app/dist`. Получишь публичную ссылку вида `https://random-name.netlify.app` — её можно отправлять родителям в WhatsApp.

**2. Vercel CLI.**
```bash
npm i -g vercel
cd app
vercel --prod
```

Оба варианта — бесплатные, без backend.

## Как проверить, что всё работает

1. `npm run dev`, открой `http://localhost:5173`.
2. На главной нажми «Empezar» на рекомендованной теме.
3. Прочитай правило → «Practicar».
4. Ответь на все 10 вопросов; ошибись 2–3 раза специально, чтобы увидеть тон «Casi. Revisemos el paso clave.»
5. На экране итога — посмотри: precisión, tiempo enfocado, tiempo en pantalla, recomendación.
6. Нажми «Compartir resumen por WhatsApp» — должно открыться `wa.me` с предзаполненным текстом.
7. На главной — «Zona de familia» → создай PIN `1234` → войди → посмотри дашборд.

## Где править контент

Все задания лежат в `src/content/questions/*.json`. Поля одного задания:

```json
{
  "id": "frac_001",
  "topicId": "fracciones",
  "difficulty": 1,
  "type": "multiple_choice",
  "promptEs": "...",
  "options": ["..."],
  "answer": "...",
  "explanationEs": "...",
  "hintEs": "...",
  "commonMistake": "...",
  "skillTags": ["..."],
  "verified": false
}
```

Когда вы с ребёнком/супругой проверите задание — поставьте `"verified": true`. Позже на этом флаге можно отфильтровывать проверенный контент от черновиков.

Темы — в `src/content/topics.json`. Текст правила — поле `lesson_text_es`, абзацы разделять двумя переносами строки.

## Допущения, которые остались открытыми

- Все 30 заданий — это заглушки моего авторства, не проверенный методический контент. Stage 1 — это flow + UX, не финальная программа.
- Idle threshold 60 секунд, focus-tracking через `visibilitychange` — нестабилен; см. раздел «риски» в общем анализе и решение про две раздельные метрики времени.
- `localStorage` теряется при очистке кэша. WhatsApp Share частично закрывает риск (родитель сохраняет отчёт у себя).
