# Redesign Tasks Stage 1 — Durillo 2026 UI

## Goal

Safely move the current MVP from prototype UI to serious adaptive learning product UI without breaking learning logic, local progress, premium unlock, review queue, or RU/ES.

## Step 1 — Design Tokens

Files:
- `app/src/styles/base.css`

Tasks:
- Replace current font import with Manrope + Inter.
- Add typography tokens.
- Add color tokens from `DESIGN_DIRECTION_2026.md`.
- Add breakpoints: `--bp-mobile: 480px`, `--bp-tablet: 768px`, `--bp-desktop: 1024px`.
- Normalize shadows, radii, focus states.

Acceptance criteria:
- No negative letter spacing.
- Buttons are at least 44px tall.
- Cards use same radius/shadow.
- Build passes.

## Step 2 — AppShell

Files:
- `app/src/App.tsx`
- `app/src/components/AppShell.tsx`

Tasks:
- Create `AppShell`.
- Move `TopBar`, `SidebarNav`, content area and `MobileBottomNav` into shell.
- Hide desktop navigation on lesson/summary/onboarding/privacy.
- Remove duplicated nav on desktop.

Acceptance criteria:
- Desktop >=1024 uses sidebar.
- Mobile <768 uses bottom nav.
- No layout jump on route change.

## Step 3 — Navigation Components

Files:
- `TopNav.tsx`
- `SidebarNav.tsx`
- `MobileBottomNav.tsx`
- `Icon.tsx`
- `LanguageSwitch.tsx`

Tasks:
- Replace emoji icons with SVG icons.
- Add nav items: Today, Topics, Review, Progress, Parent.
- Review badge: quiet pill style.
- Language switch integrated in sidebar footer / top header.

Acceptance criteria:
- Keyboard focus visible.
- Active state is soft, not heavy capsule.
- Badge aligns and does not overlap.
- Mobile bottom nav max 4 items.

## Step 4 — Shared UI Components

Files:
- `Badge.tsx`
- `ProgressBar.tsx`
- `PrimaryButton.tsx`
- `StatCard.tsx`

Tasks:
- Remove repeated inline styles.
- Add variants: primary, soft, ghost.
- Add progress size variants: `sm`, `md`, `mission`.

Acceptance criteria:
- Same button height and radius everywhere.
- Same badge visual language.
- Progress bars animate with `width 0.4s ease`.

## Step 5 — RecommendedTopicCard

Files:
- `RecommendedTopicCard.tsx`
- `ChildHome.tsx`

Tasks:
- Create mission-style card.
- Show topic, learning outcome, progress %, X/Y skills, estimated time, primary CTA.
- Use calm topic accent.
- Remove huge decorative emoji.

Acceptance criteria:
- Card answers “what should I do now?” in 5 seconds.
- CTA says `Продолжить 15 минут` / `Continuar 15 minutos`.
- Progress bar is 8px.
- Works in RU and ES.

## Step 6 — ReviewCard

Files:
- `ReviewCard.tsx`
- `ChildHome.tsx`

Tasks:
- Replace stressful copy.
- Show small action: 7 questions today, ~8 minutes.
- Badge uses review color, not error red.

Acceptance criteria:
- Copy does not shame the child.
- CTA is specific.
- Empty state hides or says review is clear.

## Step 7 — TopicCard

Files:
- `TopicCard.tsx`
- `TopicsScreen.tsx`
- `ChildHome.tsx`

Tasks:
- Support free, locked, completed, progress, difficulty, estimated time.
- Use SVG icon style.
- Add one clear CTA.

Acceptance criteria:
- Locked card is readable, not faded to unusable.
- Completed card has calm success state.
- Grid: 1 col mobile, 2 tablet, 3 desktop.

## Step 8 — QuestionCard Polish

Files:
- `QuestionCard.tsx`
- `LessonScreen.tsx`

Tasks:
- Keep large tappable answers.
- Add dots progress.
- Move timer into lesson topbar.
- Ensure correct answer always highlighted after answer.

Acceptance criteria:
- Touch targets >=56px.
- Correct answer feedback appears immediately.
- Wrong answer shakes once, 300ms.

## Step 9 — SessionSummary Polish

Files:
- `SessionSummary.tsx`

Tasks:
- Score circle.
- Confetti >=80%.
- Achievement cards.
- Primary button `Ещё раз`, secondary `На главную`.

Acceptance criteria:
- Good result feels like victory.
- Low result still supportive.
- Share WhatsApp remains available but not primary.

## QA Checklist

Viewports:
- 360 x 740
- 390 x 844
- 768 x 1024
- 1024 x 768
- 1280 x 800

States:
- no sessions;
- review queue empty;
- review queue 1, 7, 21, 99+;
- premium locked;
- premium active;
- completed topic;
- RU and ES.

Accessibility:
- WCAG AA text contrast;
- visible keyboard focus;
- no hover-only information;
- safe area on mobile;
- buttons 44px minimum.

