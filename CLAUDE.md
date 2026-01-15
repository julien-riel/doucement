# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Doucement** is a progressive habit tracking app inspired by *Atomic Habits*. The name means "gently/slowly" in French. The app helps users build or reduce habits gradually without guilt or pressure.

### Core Concepts
- **Dose du jour** (Daily dose): The central concept - users only see their target for today, never intimidating long-term goals
- **Progressive habits**: Habits that increase or decrease over time (e.g., +3% push-ups/week, -5% cigarettes/week)
- **Partial effort = success**: 70% completion is still a win
- **No failure vocabulary**: Never use words like "failed", "missed", "streak broken"
- **Tracking modes**: Multiple ways to track habits:
  - `simple` - Binary (done/not done)
  - `detailed` - Numeric value with smart buttons
  - `counter` - Incremental +1/-1 buttons
  - `stopwatch` - Measure time elapsed (e.g., meditation, reading)
  - `timer` - Countdown with overflow (e.g., plank, timed tasks)
  - `slider` - Visual slider with dynamic emoji (e.g., mood, energy, pain)

### Technical Architecture
- **100% static SPA** - React 18 with Vite, no backend server, no user accounts
- **Local storage only** - All data stays on user's device (localStorage)
- **Privacy-first** - Zero analytics, zero tracking
- **Data format**: JSON with `schemaVersion` field (currently v11), dates as `YYYY-MM-DD`
- **Import/Export**: Manual JSON file download/upload with schema validation and auto-migration
- **PWA Support**: Service worker, app shortcuts, offline capability
- **i18n**: French (default) and English supported

## Current State

The project is a functional React SPA with most features implemented.

**Key directories:**
- `src/components/` - React components organized by domain:
  - `ui/` - Reusable UI components (Button, Card, Input, EmojiPicker, etc.)
  - `habits/` - Habit-specific components (HabitCard, CheckInButtons, etc.)
  - `charts/` - Visualization components (ProgressionChart, HeatmapCalendar, etc.)
  - `layout/` - Layout components (MainLayout)
  - `onboarding/` - Onboarding flow components
  - `debug/` - Debug panel and tools
- `src/pages/` - Page components (Today, Onboarding, CreateHabit, Settings, Statistics, etc.)
- `src/services/` - Business logic (storage, progression, notifications, statistics, migration, etc.)
- `src/hooks/` - Custom hooks (useAppData, useNotifications, useDebugMode, useTheme, useCelebrations, useStopwatch, useTimer)
- `src/types/` - TypeScript type definitions
- `src/i18n/` - Internationalization configuration and locales (fr, en)
- `src/utils/` - Utility functions (date, absence detection, habitDisplay, patternAnalysis)
- `src/contexts/` - React contexts (WhatsNewContext)
- `src/styles/` - Global styles and design tokens
- `public/test-data/` - Test data files for E2E testing

**Documentation:**
- `docs/prd.md` - Product requirements document
- `docs/GLOSSARY.md` - Technical terms definitions
- `docs/ARCHITECTURE.md` - Architecture with diagrams
- `docs/features/` - Feature guides (habit-stacking, tracking-modes, etc.)
- `docs/design/design-system-specification.md` - Complete design system
- `docs/comm/` - UX writing guidelines and message bank
- `docs/testing/` - Testing strategy and test data
- `tasks.json` - Task tracking for implementation phases

## Design System Reference

When implementing the UI, follow `docs/design/design-system-specification.md`:
- **Aesthetic**: "Soft Organic" - warm, rounded corners, no cold grays
- **Primary color**: Orange `#F27D16`
- **Secondary color**: Green `#22C55E` (success states)
- **Fonts**: Fraunces (headings), Source Sans 3 (body)
- **No red colors** - Associated with failure, never used
- **Border radius**: 8-24px depending on component
- **Minimum touch targets**: 44x44px

## Language & Tone

The app supports multiple languages (French default, English available). When writing user-facing text:
- Use official terminology from `docs/comm/banque-messages.md`
- Use inclusive writing with middle dot (fier·e, motivé·e)
- Never use: "échec", "raté", "manqué", "retard", "insuffisant"
- Preferred terms: "dose du jour" (not "objectif"), "progression" (not "score"), "archiver" (not "supprimer")

## Testing Strategy

> **Full documentation**: See [docs/testing/strategy.md](docs/testing/strategy.md) for detailed testing strategy.

### Unit Tests (Vitest)
- Located in `src/**/*.test.ts`
- Run with `npm test`
- Cover services, hooks, and utility functions

### E2E Tests (Playwright)

**Framework**: Playwright for end-to-end testing with centralized fixtures.

**Execution**:
```bash
npm run test:e2e              # Run all E2E tests
npm run test:e2e -- --grep "pattern"  # Run tests matching pattern
```

**Fixtures location**: `e2e/fixtures/`
- `test-data.ts` - Data factories for habits, entries, app data
- `setup.ts` - Setup helpers (localStorage, navigation, modals)
- `pages/` - Page Objects (TodayPage, StatisticsPage, CreateHabitPage, etc.)

**Writing new tests**:

```typescript
import { test, expect } from './base-test'
import {
  setupLocalStorage,
  createAppData,
  createIncreaseHabit,
  TodayPage,
} from './fixtures'

test('example test', async ({ page }) => {
  // 1. Setup test data using factories
  const testData = createAppData({
    habits: [
      createIncreaseHabit({
        id: 'test-habit',
        name: 'Push-ups',
        startValue: 10,
        unit: 'reps',
      }),
    ],
  })
  await setupLocalStorage(page, testData)

  // 2. Navigate and interact using Page Objects
  const todayPage = new TodayPage(page)
  await todayPage.goto()

  // 3. Assert
  await expect(todayPage.habitCard('Push-ups')).toBeVisible()
})
```

**Available factories**:
- `createIncreaseHabit()`, `createDecreaseHabit()`, `createMaintainHabit()`
- `createCounterHabit()`, `createWeeklyHabit()`
- `createEntry()`, `createEntriesForDays()`
- `createAppData()`, `createFreshAppData()`

**Setup helpers**:
- `setupLocalStorage(page, data)` - Initialize app state
- `setupFromTestFile(page, filename)` - Load from `public/test-data/`
- `closeCelebrationModalIfVisible(page)` - Handle celebration popups
- `closeBlockingModals(page)` - Clear all blocking modals

**Page Objects**:
- `TodayPage` - Today view interactions
- `CreateHabitPage` - Habit creation wizard
- `StatisticsPage` - Statistics page
- `WeeklyReviewPage` - Weekly review
- `SettingsPage`, `EditHabitPage` - Settings and edit

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run unit tests (Vitest)
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
npm run format       # Format code with Prettier
```

## Code Health Check

A health check script is available to audit the codebase quality:

```bash
./scripts/health-check.sh
```

### What it checks

1. **Empty directories** - Detects leftover empty folders from refactoring
2. **Test file sizes** - Warns if test files exceed 3x source file size
3. **TypeScript compilation** - Ensures no type errors
4. **ESLint** - Validates code style
5. **Documentation** - Checks required docs exist (PRD, design system, coherence matrix)

### Interpreting results

- **✓ Green** - All checks pass
- **⚠ Yellow** - Warnings (non-blocking but should be reviewed)
- **✗ Red** - Errors that need immediate attention

### Recommended frequency

Run the health check:
- Before each release
- After major refactoring
- When onboarding new contributors
- Monthly as part of maintenance

### Reference documentation

- `docs/coherence-matrix.md` - Types and their usage across the codebase
- `docs/GLOSSARY.md` - Technical terms definitions (trackingMode, entryMode, etc.)
- `docs/ARCHITECTURE.md` - Architecture diagrams (data flow, component structure)
- `docs/prd.md` - Product requirements
- `docs/design/design-system-specification.md` - UI guidelines
- `docs/features/` - Feature-specific guides
