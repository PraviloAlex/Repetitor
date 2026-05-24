# 07 — Tech Architecture

## Рекомендация
Начать с **Vite + React PWA-ready** или простого static web app. Backend не нужен для первой проверки.

## MVP stack
- React/Vite или HTML/CSS/JS;
- JSON контент;
- localStorage/IndexedDB;
- Netlify/Vercel;
- без регистрации;
- без оплаты в первой версии.

## Модули
```text
src/
  components/
    LessonCard.tsx
    QuestionCard.tsx
    ParentSummary.tsx
  content/
    topics.json
    questions/*.json
  engine/
    answerChecker.ts
    sessionTracker.ts
    recommendationEngine.ts
  storage/
    localProgress.ts
  screens/
    ChildHome.tsx
    LessonScreen.tsx
    QuestionScreen.tsx
    SessionSummary.tsx
    ParentDashboard.tsx
```

## Data models
```ts
type Question = {
  id: string;
  topicId: string;
  difficulty: 1|2|3|4|5;
  type: "multiple_choice" | "numeric_input" | "true_false";
  promptEs: string;
  options?: string[];
  answer: string | number | boolean;
  explanationEs: string;
  hintEs?: string;
  skillTags: string[];
  verified: boolean;
};
```

```ts
type StudySession = {
  id: string;
  startedAt: string;
  endedAt?: string;
  topicId: string;
  totalSeconds: number;
  activeSeconds: number;
  focusLossCount: number;
  pauseCount: number;
  questionsAnswered: number;
  correctAnswers: number;
  hintsUsed: number;
};
```

## Answer checker
- multiple_choice: exact match;
- true_false: boolean;
- numeric_input: нормализовать запятую/точку, пробелы, число.

## Recommendation rules
- accuracy < 60% → повторить тему;
- 2+ ошибки с одним skill_tag → дать похожие задания;
- hints_used > 3 → снизить сложность;
- activeSeconds < 60% totalSeconds → рекомендовать короткое занятие завтра.
