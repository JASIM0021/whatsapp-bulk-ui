# Bot Activation Setup Flow — Design Spec

**Date:** 2026-06-16  
**Status:** Approved  
**Project:** nexBotix (renaming to botx)

---

## Overview

After a new user registers (including via Google OAuth) and their bot draft is auto-applied to their account, they are redirected to a dedicated `/setup` page. This page walks them through 3 sequential steps — reviewing their bot config, connecting their WhatsApp account, and activating the bot — before they can access the rest of the app.

The setup page reappears on every login until all 3 steps are complete. Completion is derived from existing API state, requiring no new backend endpoints or storage fields.

---

## Goals

- Guide new users from "bot created" to "bot live on WhatsApp" in one uninterrupted flow
- Make each step obvious — one action per screen, no distractions
- Block access to the rest of the app until setup is done (sticky redirect)
- Reuse existing API infrastructure (no backend changes)

---

## Non-Goals

- Onboarding for users without a bot draft (they go straight to `/app`)
- Modifying the existing `/bot` page or `/whatsapp` app
- Multi-device or multi-session management

---

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/pages/SetupPage.tsx` | Full-screen 3-step setup wizard |
| `src/hooks/useSetupStatus.ts` | Derives setup completion state from existing APIs |

### Modified Files

| File | Change |
|------|--------|
| `src/main.tsx` | Add `/setup` route + `SetupGuard` that redirects new users to `/setup` after login |
| `src/components/auth/LoginPage.tsx` | After register/login with a bot draft, redirect to `/setup` instead of `/app` |

---

## Setup Completion State

Setup state is derived — no new storage required.

```ts
interface SetupStatus {
  step1Done: boolean;  // bot.businessName is non-empty
  step2Done: boolean;  // GET /api/whatsapp/status → connected === true
  step3Done: boolean;  // GET /api/bot → isEnabled === true
  isComplete: boolean; // all three true
  isLoading: boolean;
}
```

**`useSetupStatus` hook:**
- On mount, calls `GET /api/bot` and `GET /api/whatsapp/status` in parallel
- Returns derived `SetupStatus`
- Exposes `refresh()` to re-check after each step completes

**SetupGuard (in `main.tsx`):**
- Wraps all protected routes
- After auth resolves, calls `useSetupStatus`
- If `!isComplete` and user has a bot (`step1Done`) → redirect to `/setup`
- Users without any bot config skip the guard and go to `/app` normally

---

## The `/setup` Page

Full-screen, no app navigation shell. White/light background. Centered content.

### Layout

```
┌─────────────────────────────────────────────────────┐
│              botx                          Step 2/3  │  ← minimal header
├─────────────────────────────────────────────────────┤
│  ① Review Bot  ──────  ② Connect  ──────  ③ Activate │  ← progress steps
├─────────────────────────────────────────────────────┤
│                                                     │
│         ┌───────────────────────────────┐           │
│         │  [Step content — max-w-lg]    │           │
│         │                               │           │
│         │  [Continue / Action button]   │           │
│         └───────────────────────────────┘           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- No skip button, no exit link — sticky until complete
- Progress indicator: numbered circles (1, 2, 3) connected by lines; active = green fill, done = green check, upcoming = gray

---

## Step 1 — Review Bot Config

**Goal:** Let the user verify and adjust the bot config applied from their onboarding draft.

**Content:**
- Section title: "Your bot config — looks right?"
- Editable fields (pre-filled from `/api/bot` response):
  - Business Name — text input
  - Description — textarea
  - Services — up to 4 editable chips (click to remove, add new via text input + Plus button)
  - Website — URL input (optional)
- CTA button: **"Looks good, continue →"**

**On continue:**
1. If any field was changed, `POST /api/bot` with updated values (`isEnabled: false` preserved)
2. Advance to step 2

**Validation:** Business name and description must be non-empty to proceed.

---

## Step 2 — Connect WhatsApp

**Goal:** Scan a QR code to link their WhatsApp account.

**Content:**
- Section title: "Connect your WhatsApp"
- Subtitle: "Open WhatsApp on your phone → Linked Devices → Link a Device → scan this code"
- Initial state: "Connect WhatsApp" green button
- On click: calls `POST /api/whatsapp/init`, then opens SSE stream at `GET /api/whatsapp/qr`
- QR code renders **inline** inside the step card (not a modal)
- Status bar below QR:
  - `waiting` → "Waiting for scan…" (pulsing dot)
  - `qr` → "QR ready — scan with your phone"
  - `authenticated` → "Scanning…" (spinner)
  - `ready` → "Connected ✓" (green check) → auto-advances to step 3 after 800ms

**Error handling:**
- If SSE connection fails → "Failed to start — try again" with retry button
- QR expires after 60s → "QR expired — click to refresh" with refresh button

---

## Step 3 — Activate Bot

**Goal:** Enable the bot so it starts auto-replying on the connected WhatsApp account.

**Content:**
- Section title: "Activate your bot"
- Summary card showing:
  - Business name
  - Connected WhatsApp number (from `/api/whatsapp/status`)
  - Services list (chips)
- Short description: "Once activated, your bot will automatically reply to WhatsApp messages from your customers."
- CTA button: **"Activate My Bot →"** (large, green gradient)

**On activate:**
1. `POST /api/bot` with `isEnabled: true`
2. Show success state: green checkmark animation + "Your bot is live! 🎉"
3. Redirect to `/app` after 2 seconds

---

## Redirect Logic

### After Registration (new users)

In `LoginPage.tsx` / `AuthContext.tsx`:
- After `register()` or `loginWithToken()` (Google OAuth) completes:
  - If `botx_bot_draft` was present (draft was just applied) → redirect to `/setup`
  - Otherwise → redirect to `/app` (existing behavior)

Inside `applyBotDraft()` in `AuthContext.tsx`, right before `localStorage.removeItem('botx_bot_draft')`, set `sessionStorage.setItem('botx_show_setup', '1')`. This flag survives the auth state update and is read by the post-login redirect logic in `LoginPage.tsx` to send the user to `/setup`.

### On Every Login (returning users with incomplete setup)

`SetupGuard` (wraps all protected routes in `main.tsx`):
```
1. Auth resolves (isAuthenticated = true)
2. Call useSetupStatus → GET /api/bot + GET /api/whatsapp/status
3. If step1Done && !isComplete → navigate('/setup')
4. If !step1Done → skip guard (user has no bot, go to /app normally)
```

---

## State Machine

```
REGISTERED → has draft → applyBotDraft → set botx_show_setup → redirect /setup

/setup
  STEP_1 → [save bot config] → STEP_2
  STEP_2 → [WhatsApp connected] → STEP_3
  STEP_3 → [bot enabled] → COMPLETE → redirect /app

RETURNING LOGIN
  → [step1Done && !isComplete] → redirect /setup at current incomplete step
  → [isComplete || !step1Done] → /app
```

---

## Storage

| Key | Storage | Value | Cleared when |
|-----|---------|-------|-------------|
| `botx_show_setup` | `sessionStorage` | `"1"` | After `/setup` redirect happens |

No new localStorage keys. Setup completion is always derived from live API state.

---

## API Usage (existing endpoints only)

| Step | Endpoint | Method |
|------|----------|--------|
| Load step 1 | `GET /api/bot` | GET |
| Save step 1 | `POST /api/bot` | POST |
| Start QR | `POST /api/whatsapp/init` | POST |
| Stream QR | `GET /api/whatsapp/qr` (SSE) | GET |
| Check connection | `GET /api/whatsapp/status` | GET |
| Activate | `POST /api/bot` with `isEnabled: true` | POST |

---

## Out of Scope (future)

- Setup flow for users who don't have a bot draft (manual bot creation wizard)
- "Skip for now" option with reminder emails
- Progress persistence across devices (currently session-based)
