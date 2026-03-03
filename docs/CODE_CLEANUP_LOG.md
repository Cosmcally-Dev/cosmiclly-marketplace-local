# Cosmiclly — Code Cleanup Log

**Date:** 2026-03-12

---

## 1. Files Deleted

### Unused Shadcn UI Components (22 files)

All from `src/components/ui/`:

- alert-dialog.tsx
- alert.tsx
- aspect-ratio.tsx
- breadcrumb.tsx
- calendar.tsx
- carousel.tsx
- chart.tsx
- command.tsx
- context-menu.tsx
- drawer.tsx
- hover-card.tsx
- input-otp.tsx
- menubar.tsx
- navigation-menu.tsx
- pagination.tsx
- progress.tsx
- radio-group.tsx
- resizable.tsx
- scroll-area.tsx
- sidebar.tsx
- toggle-group.tsx
- toggle.tsx

**To restore any component:** `npx shadcn@latest add <component-name>` (e.g., `npx shadcn@latest add calendar`)

### Other Files Deleted

- `src/test/example.test.ts` — Placeholder test (`expect(true).toBe(true)`)
- `package-lock.json` — Stale; project uses Bun (`bun.lockb`)

---

## 2. Packages Removed from package.json

| Package | Reason |
|---------|--------|
| `cmdk` | Used by deleted `command.tsx` |
| `embla-carousel-react` | Used by deleted `carousel.tsx` |
| `input-otp` | Used by deleted `input-otp.tsx` |
| `react-day-picker` | Used by deleted `calendar.tsx` |
| `react-resizable-panels` | Used by deleted `resizable.tsx` |
| `vaul` | Used by deleted `drawer.tsx` |

**To restore:** `bun add <package-name>` or `npm install <package-name>`

---

## 3. Duplicate Code Consolidated

### New shared utility files

- `src/utils/formatters.ts` — Shared `formatMessageTime`, `formatDuration`, `formatDate`
- `src/utils/constants.ts` — Shared `RINGING_TIMEOUT_MS`

### Files updated to use shared utilities

| File | Removed | Replaced With |
|------|---------|---------------|
| `src/pages/Chat.tsx` | Local `RINGING_TIMEOUT_MS` + `formatMessageTime` | Imports from `@/utils/constants` + `@/utils/formatters` |
| `src/pages/VoiceCall.tsx` | Local `RINGING_TIMEOUT_MS` | Import from `@/utils/constants` |
| `src/pages/VideoCall.tsx` | Local `RINGING_TIMEOUT_MS` | Import from `@/utils/constants` |
| `src/pages/TwinChat.tsx` | Local `formatMessageTime` | Import from `@/utils/formatters` |
| `src/pages/Activity.tsx` | Local `formatDuration` + `formatDate` | Imports from `@/utils/formatters` |
| `src/pages/AdvisorActivity.tsx` | Local `formatDuration` + `formatDate` | Imports from `@/utils/formatters` |
| `src/pages/Transactions.tsx` | Local `formatDate` | Import from `@/utils/formatters` |

---

## 4. Dead Code Removed

### SessionLog in useAuth.tsx

- Removed `SessionLog` interface (unused export)
- Removed `sessionLogs` state
- Removed `addSessionLog` function
- Removed `localStorage.getItem/setItem("sessionLogs")` calls
- Removed from `AuthContextType` interface and provider value

**Why:** SessionLog was defined but never used by any component in the codebase. It also stored sensitive session data in unencrypted localStorage.

---

## 5. Configuration Changes

| File | Change |
|------|--------|
| `vite.config.ts` | Added `esbuild: { drop: ['console', 'debugger'] }` for production builds — strips ~107 console.log statements from production bundle without modifying source files |
| `tsconfig.app.json` | Enabled `strict: true`, `noUnusedLocals: true`, `noFallthroughCasesInSwitch: true` (kept `noImplicitAny: false` for incremental migration) |
| `package.json` | Changed build script from `"vite build"` to `"tsc --noEmit && vite build"` — TypeScript errors now fail the build |
| `src/App.tsx` | Added `ErrorBoundary` wrapper around Routes — catches React rendering errors with user-friendly fallback UI |

---

## 6. New Files Created

| File | Purpose |
|------|---------|
| `src/utils/formatters.ts` | Shared date/time formatting utilities |
| `src/utils/constants.ts` | Shared constants (RINGING_TIMEOUT_MS) |
| `src/components/ErrorBoundary.tsx` | React error boundary component |
| `.env.example` | Environment variable template (no secrets) |
