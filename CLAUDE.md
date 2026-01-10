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

The project is in documentation/planning phase. No application code exists yet.

**Existing files:**
- `landing-page.html` - Marketing landing page (static HTML/CSS)
- `docs/prd.md` - Product requirements document
- `docs/design/design-system-specification.md` - Complete design system
- `docs/comm/` - UX writing guidelines and message bank

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
