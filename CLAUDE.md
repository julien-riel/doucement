# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Doucement** is a progressive habit tracking app inspired by *Atomic Habits*. The name means "gently/slowly" in French. The app helps users build or reduce habits gradually without guilt or pressure.

### Core Concepts
- **Dose du jour** (Daily dose): The central concept - users only see their target for today, never intimidating long-term goals
- **Progressive habits**: Habits that increase or decrease over time (e.g., +3% push-ups/week, -5% cigarettes/week)
- **Partial effort = success**: 70% completion is still a win
- **No failure vocabulary**: Never use words like "failed", "missed", "streak broken"

### Technical Architecture (Planned)
- **100% static SPA** - No backend server, no user accounts
- **Local storage only** - All data stays on user's device (localStorage for MVP, IndexedDB later)
- **Privacy-first** - Zero analytics, zero tracking
- **Data format**: JSON with `schemaVersion` field, dates as `YYYY-MM-DD`
- **Import/Export**: Manual JSON file download/upload with schema validation

## Current State

The project is a functional React SPA with most features implemented.

**Key directories:**
- `src/components/` - React components (Button, Card, Input, HabitCard, etc.)
- `src/pages/` - Page components (Today, Onboarding, CreateHabit, Settings, etc.)
- `src/services/` - Business logic (storage, progression, notifications, importExport)
- `src/hooks/` - Custom hooks (useAppData, useNotifications, useDebugMode)
- `src/types/` - TypeScript type definitions
- `public/test-data/` - Test data files for E2E testing

**Documentation:**
- `docs/prd.md` - Product requirements document
- `docs/design/design-system-specification.md` - Complete design system
- `docs/comm/` - UX writing guidelines and message bank
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

The app is in French. When writing user-facing text:
- Use official terminology from `docs/comm/banque-messages.md`
- Use inclusive writing with middle dot (fier·e, motivé·e)
- Never use: "échec", "raté", "manqué", "retard", "insuffisant"
- Preferred terms: "dose du jour" (not "objectif"), "progression" (not "score"), "archiver" (not "supprimer")

## Testing Strategy

### Unit Tests (Vitest)
- Located in `src/**/*.test.ts`
- Run with `npm test`
- Cover services, hooks, and utility functions

### E2E Tests (Playwright)
- **Framework**: Playwright for end-to-end testing
- **Test data files**: Use existing files in `public/test-data/` to set up test scenarios
- **Writing tests**: Use MCP Playwright server when available for assisted test creation
- **Execution**: Tests should be run against the built app (`npm run build && npm run preview`)

#### Available Test Data Files
Located in `public/test-data/`:
- `goal-reached.json` - Habit close to targetValue (test congratulation messages)
- `growth-plateau.json` - Stagnant habit (test plateau detection)
- `absence-detected.json` - Missing entries for 2-3 days (test WelcomeBackMessage)
- `weekly-review-due.json` - lastWeeklyReviewDate 7+ days ago (test WeeklyReview)
- `habit-stacking.json` - Linked habits via anchorHabitId (test habit stacking display)
- `planned-pause.json` - Active planned pause (test pause behavior)
- `full-scenario.json` - Complete scenario with various habit states

#### E2E Test Guidelines
- Load test data via the Debug Panel's "Charger fichier de test" feature
- Test user journeys: onboarding, habit creation, check-in, weekly review
- Verify UI states match the test data conditions
- No external dependencies - all tests run locally
