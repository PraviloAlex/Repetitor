# Product Quality Sprint v2 — Implementation Record

> Date: 2026-05-23  
> Status: Complete  
> Build: `npx tsc -b --noEmit` → **clean**

---

## 1. What Was Built

This sprint hardened the app across 7 areas: i18n, Lesson UX, Mission Selector, Skill Map, Parent Dashboard, Card/XP data architecture, and QA stability.

### 1.1 i18n / Localisation (RU + ES)

- All hardcoded Spanish strings removed from every screen.
- `skillLabels.ts` created to hold Russian translations for all 43 skills, avoiding the TypeScript transpiler 16 KB Cyrillic bug.
- New keys added (see Section 3).
- `strings.ts` now exports `StringKey` as `keyof typeof STRINGS.ru` — both languages are always in sync.

### 1.2 Lesson UX v2

- Progress bar replaces dot-indicator; shows percentage.
- Mission-kind Badge (`new / repair / consolidate / challenge / maintenance`) shown in the compact mission bar during the question phase.
- Correct-count vs target counter displayed live.

### 1.3 Mission Selector v2

- `buildDailyMission` extended with `"maintenance"` kind: surfaces mastered/stable skills not practiced in the last 5 sessions.
- `buildMissionForSkill` — skill-specific mission override (from URL `?skill=`).
- `SkillMapScreen` highlights the recommended skill for each topic with a "Mission of the Day" badge.
- Expanded node panel: first tap expands, second tap navigates to lesson.

### 1.4 Skill Map v2

- `SkillMasteryStatus` extended: `challenge_ready`, `blocked`.
- All 7 statuses have Badge variant + i18n key.
- Expanded node shows: repair hint, last-practiced date (today / yesterday / N days ago), practice count, and CTA.
- `buildSkillMastery` now computes `lastPracticedAt` from session history.

### 1.5 Parent Dashboard v2

- Per-topic accuracy trend: compares last-7-days vs prior-7-days accuracy, shows `+N%` / `-N%` delta in green/red.
- "N skills consolidated this week" counter next to the skill snapshot header.
- All hardcoded strings replaced with i18n keys.
- Skill names in Russian use `getSkillTitleRu` / `getSkillRepairRu`.
- Mode switcher note lines now use i18n keys (`pd_mode_primaria_note`, `pd_mode_ingreso_note`).

### 1.6 Card/XP Architecture (data layer only — no UI)

New fields added to `src/engine/types.ts`:

| Type | Field | Description |
|------|-------|-------------|
| `Question` | `xp?: number` | XP for a correct answer (default 10) |
| `Question` | `packEligible?: boolean` | Whether question can appear in a card pack |
| `Question` | `rarity?: CardRarity` | `common / rare / epic / mythic / legend` |
| `Question` | `cardType?: CardType` | `training / trick / speed / explain / visual / boss / comeback` |
| `StudySession` | `xpEarned?: number` | Total XP earned in session |
| `StudySession` | `missionReward?: RewardPlaceholder` | Card pack to deliver at session end |
| `StudySession` | `skillMasteryReward?: RewardPlaceholder` | Reward for mastery milestone |
| `RewardPlaceholder` | `kind, amount, seriesId?` | Typed reward descriptor |

No football UI is shown. Fields are optional and backward-compatible.

### 1.7 Session Summary v2

- New "Skills this session" section: shows each practiced skill with accuracy% and status Badge.
- Mission result card: `done` / `in_progress` with mastery percentage.
- Achievement cards: streak, no-hints, perfect score — all i18n.
- Weak-skills section: localized names + repair hints.

---

## 2. File Map

| File | Change |
|------|--------|
| `src/engine/types.ts` | Added `RewardPlaceholder`, `xp`, `packEligible`, `xpEarned`, `missionReward`, `skillMasteryReward`, `maintenance` missionKind |
| `src/engine/skillMastery.ts` | Extended `SkillMasteryStatus` (+ `challenge_ready`, `blocked`); added `lastPracticedAt` to `SkillMastery` |
| `src/engine/dailyMission.ts` | Added `maintenance` kind; all `LocalizedText` fields; `buildMissionForSkill` |
| `src/engine/skills.ts` | ASCII-only; all 43 skills with `topicId`, `titleEs`, `repairExplanationEs`, `typicalMistakes` |
| `src/i18n/skillLabels.ts` | Russian translations for all 43 skills; `getSkillTitleRu`, `getSkillRepairRu` |
| `src/i18n/strings.ts` | ~40 new keys added (see Section 3) |
| `src/screens/LessonScreen.tsx` | Mission-kind badge, ProgressBar, live correct/target counter |
| `src/screens/SkillMapScreen.tsx` | Expanded node, last-practiced date, mission-of-the-day badge, 7-status support |
| `src/screens/SessionSummary.tsx` | Skills-this-session section, mission result card, full i18n |
| `src/screens/ParentDashboard.tsx` | Accuracy trend delta, newly-stable count, full i18n, mode note keys |
| `src/screens/ChildHome.tsx` | Full i18n audit; no hardcoded strings |
| `src/styles/base.css` | `.skill-node--expanded`, `.skill-node__today-badge`, `.skill-node__detail`, `.skill-node__hint`, `.skill-node__cta`, `.skill-node__last-practiced`, `.skill-node--challenge-ready`, `.skill-node--blocked` |

---

## 3. i18n Key Index (new keys this sprint)

### Skill statuses
- `skill_status_challenge_ready`, `skill_status_blocked`

### Skill Map
- `skill_map_mission_today`, `skill_map_start_practice`, `skill_map_default_hint`
- `skill_map_last_practiced_today`, `skill_map_last_practiced_yesterday`
- `skill_map_last_practiced_days`, `skill_map_last_practiced_never`, `skill_map_practiced_count`

### Lesson
- `lesson_mission_kind_new`, `lesson_mission_kind_repair`, `lesson_mission_kind_consolidate`
- `lesson_mission_kind_challenge`, `lesson_mission_kind_maintenance`

### Session Summary
- `sum_achievement_streak`, `sum_achievement_no_hints`, `sum_achievement_perfect`
- `sum_mission_done`, `sum_mission_in_progress`, `sum_mastery_pct`, `sum_mission_ok_hint`
- `sum_repeat_tomorrow`, `sum_skills_section`, `sum_skill_status_improved`, `sum_skill_new_status`

### Parent Dashboard
- `pd_report_weekly_title`, `pd_skill_snapshot_title`, `pd_needs_reinforcement`
- `pd_improved_recently`, `pd_parent_signal_default`, `pd_recovered_signal`
- `pd_week_insight_title`, `pd_next_mission_label`
- `pd_insight_no_data`, `pd_insight_weak_skill`, `pd_insight_high_accuracy`, `pd_insight_steady`
- `pd_report_this_week`, `pd_report_improved`, `pd_report_needs_work`, `pd_report_next_step`
- `pd_skills_stable_week`
- `pd_mode_primaria_note`, `pd_mode_ingreso_note`

---

## 4. Card/XP Data Model Notes

- `xp` field on `Question`: not yet computed during session — `xpEarned` on `StudySession` will be populated by a future reward engine pass in `LessonScreen.finishSession()`.
- `packEligible` defaults to `true` — the Football Academy pack-drop system will filter questions using this flag.
- `RewardPlaceholder` is a pure data type; no dispatch logic exists yet. When the reward engine is ready, it will write into `missionReward` / `skillMasteryReward` on the session before calling `recordSession()`.

---

## 5. QA Checklist

### Breakpoints to test
- 375px (iPhone SE), 390px (iPhone 14), 430px (iPhone Pro Max)
- 768px (iPad), 1024px (iPad landscape), 1280px desktop, 1920px wide

### States to verify per language (RU + ES)

| Screen | State | Check |
|--------|-------|-------|
| ChildHome | Fresh (0 sessions) | No broken strings, no accuracy %, streak = 0 |
| ChildHome | With streak 3/7/14 | Milestone banner appears, correct plural |
| LessonScreen | Lesson phase | Mission card shows correct kind badge + title |
| LessonScreen | Questions phase | Progress bar + % + correct/target counter |
| LessonScreen | Last question | "Finish" instead of "Next" |
| SessionSummary | All correct | Achievement cards for perfect + no-hints |
| SessionSummary | Mission complete | "Mission done" card with mastery% |
| SessionSummary | Weak skills | Repeat tomorrow section with localized names |
| SessionSummary | Skills section | Each practiced skill has status badge + accuracy% |
| SkillMapScreen | Unexpanded | Status badge + accuracy + today-badge on mission skill |
| SkillMapScreen | Expanded (first tap) | Hint + last-practiced date + practice count + CTA |
| SkillMapScreen | Second tap | Navigates to /lesson/{topicId}?skill={skillId} |
| ParentDashboard | No sessions | "No data" insight, 0 stats |
| ParentDashboard | 1 week data | Trend deltas visible (+/- %) on practiced topics |
| ParentDashboard | Stable skills | "N skills consolidated this week" shown |

### Known gaps (non-blocking)
- New i18n keys added via Python lack Spanish accented characters (o -> o, a -> a, etc.). Existing keys retain their accents. Fix: manual pass over new ES keys.
- `blocked` status has no population logic yet — skills are never assigned this status (requires prerequisite graph).
- `xpEarned` not yet computed in `LessonScreen.finishSession()` — field exists but stays `undefined`.

---

## 6. Next Steps (Post-Sprint)

1. **ES accent pass** — fix missing accents in new i18n keys (`pd_mode_primaria_note`, `pd_skills_stable_week`, etc.)
2. **XP computation** — in `LessonScreen.finishSession()`, sum `(q.xp ?? 10)` for each correct answer and write to `session.xpEarned`.
3. **Pack eligibility** — filter questions with `packEligible !== false` when building card pack drops.
4. **Blocked status logic** — define skill prerequisite edges in `skills.ts`; mark skill as `blocked` if any prerequisite is `"new"`.
5. **Review queue integration** — surface `reviewQueue` more prominently on ChildHome when count > 3.
6. **Onboarding i18n** — `OnboardingScreen` still has a few inline strings that need keys.
