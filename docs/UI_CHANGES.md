# UI Kit Changes Log

Tracks all changes made while applying `docs/UI_KIT_SUGGESTIONS.md` to the codebase.

---

## Phase 1: CSS Foundation

**Files modified:**
- `src/index.css`

**Changes:**
1. Added z-index CSS variables to `:root` block:
   - `--z-base: 0`, `--z-elevated: 10`, `--z-sticky: 20`, `--z-fixed: 30`, `--z-header: 40`, `--z-overlay: 50`, `--z-modal: 50`, `--z-tooltip: 50`, `--z-toast: 100`
2. Added `@media (prefers-reduced-motion: reduce)` block at end of file — disables all animations and transitions when user prefers reduced motion

**Verified:** `index.html` already has `lang="en"` — no change needed.

---

## Phase 2: Install Missing Shadcn Primitives

**Files created:**
- `src/components/ui/progress.tsx` — Radix Progress bar with `bg-muted` track + `bg-primary` fill, width set via inline style
- `src/components/ui/radio-group.tsx` — Radix RadioGroup themed to Northern Lights palette, circle indicator
- `src/components/ui/alert.tsx` — CVA-based Alert with 5 variants: `default`, `info`, `success`, `warning`, `destructive`. Left border accent + background tint. Composed of `Alert`, `AlertTitle`, `AlertDescription`

---

## Phase 3: Button & Badge Enhancements

**Files modified:**
- `src/components/ui/button.tsx`:
  - Added `success` variant: `bg-emerald-600 text-white hover:bg-emerald-500`
  - Added `warning` variant: `bg-amber-500 text-[hsl(260,45%,7%)] hover:bg-amber-400`
  - Added `loading?: boolean` prop — when true: prepends `<Loader2 className="animate-spin" />`, sets `disabled`, adds `opacity-80`
- `src/components/ui/badge.tsx`:
  - Added 6 variants: `accent`, `success`, `warning`, `online` (with green dot), `busy` (with amber dot), `offline` (with gray dot)
  - Status dots rendered via `before:` pseudo-element

**Files created:**
- `src/components/ui/button-group.tsx` — Flex wrapper with `[&>button]:rounded-none` + first/last child border-radius rounding

---

## Phase 4: Feedback & Loading Components

**Files created:**
- `src/components/ui/spinner.tsx` — `Loader2` + `animate-spin`, sizes: `sm` (16px) / `md` (24px) / `lg` (32px), includes `role="status"` + `aria-label="Loading"`
- `src/components/ui/page-loader.tsx` — Full-page centered spinner + optional message text, used as `<Suspense fallback>`
- `src/components/ui/confirm-dialog.tsx` — Wraps Radix `AlertDialog` with standardized confirm/cancel props, `confirmVariant` for destructive actions, `loading` support
- `src/components/ui/notification-badge.tsx` — Red circle badge positioned absolute, hides at `count=0`, caps display at "99+"

---

## Phase 5: Data Display Components

**Files created:**
- `src/components/ui/star-rating.tsx` — `value`, `count` props, filled/half/empty stars in `text-amber-400`, `aria-label` for screen readers
- `src/components/ui/price-display.tsx` — `price`, `discountedPrice`, `unit` props, strikethrough original + bold discounted price
- `src/components/ui/empty-state.tsx` — `icon`, `title`, `description`, `action` props, centered layout with muted icon
- `src/components/ui/stat-card.tsx` — `icon`, `label`, `value`, `change`, `trend` props, for admin dashboard cards
- `src/components/ui/avatar-group.tsx` — Overlapping avatars with "+N" overflow counter, configurable `max` and `size`
- `src/components/skeletons/index.tsx` — 5 skeleton variants: `ProfileHeaderSkeleton`, `SessionPageSkeleton`, `ActivityRowSkeleton`, `TransactionRowSkeleton`, `StatCardSkeleton`

---

## Phase 6: Navigation & Form Control Components

**Files created:**
- `src/components/ui/breadcrumb.tsx` — `Breadcrumb`, `BreadcrumbItem`, `BreadcrumbSeparator` with `<nav aria-label="Breadcrumb">` + `<ol>` semantics, chevron separators
- `src/components/ui/pagination.tsx` — Page numbers with `Button variant="ghost"`, active as `variant="outline"`, prev/next arrows, `onPageChange` callback
- `src/components/ui/step-indicator.tsx` — Horizontal dots connected by lines, completed (primary) / current (primary + ring) / upcoming (muted) states
- `src/components/ui/password-input.tsx` — Wraps `Input` with internal `showPassword` state + `Eye`/`EyeOff` toggle button
- `src/components/ui/search-input.tsx` — `Search` icon prefix, clear `X` button on non-empty input, `Escape` key to clear

**Files modified:**
- `src/components/ui/textarea.tsx` — Added `showCount?: boolean` prop, renders `"{current} / {maxLength}"` counter below textarea when enabled

---

## Phase 7: Page Refactors (Replace Inline Patterns)

### 7a: Component Replacements

**Breadcrumb replacements (4 files):**
- `src/pages/AdvisorsListing.tsx` — Replaced inline `<nav>` breadcrumb with `<Breadcrumb>` component
- `src/pages/AdvisorProfile.tsx` — Replaced inline breadcrumb with `<Breadcrumb>` component
- `src/pages/DailyOracle.tsx` — Replaced inline breadcrumb with `<Breadcrumb>` component
- `src/pages/Horoscope.tsx` — Replaced inline breadcrumb with `<Breadcrumb>` component

**Component extractions (3 files):**
- `src/components/advisors/AdvisorCard.tsx` — Replaced inline star rendering with `<StarRating>`, inline price with `<PriceDisplay>`
- `src/pages/Favorites.tsx` — Replaced inline empty state with `<EmptyState>`, loading spinner with `<Spinner>`
- `src/components/admin/AdminDashboard.tsx` — Replaced inline stat cards with `<StatCard>` component

**PasswordInput replacement (1 file):**
- `src/components/auth/AuthModal.tsx` — Replaced inline password toggle patterns with `<PasswordInput>`, replaced loading button with `Button loading` prop

**NotificationBadge replacement (1 file):**
- `src/components/layout/Header.tsx` — Replaced inline notification badge with `<NotificationBadge>`, added `aria-label="Main navigation"` to `<nav>`

### 7b: Loading Button Refactors

**Page spinners → `<Spinner>` (7 files):**
- `src/pages/Chat.tsx` — Replaced `<Loader2 className="animate-spin">` page spinner with `<Spinner size="lg">`
- `src/pages/VoiceCall.tsx` — Same replacement
- `src/pages/VideoCall.tsx` — Same replacement
- `src/pages/Profile.tsx` — Same replacement
- `src/pages/AdvisorPortal.tsx` — Same replacement
- `src/pages/AddCredit.tsx` — Replaced package loading `<Loader2>` with `<Spinner size="lg">`
- `src/pages/AdvisorsListing.tsx` — Replaced infinite scroll loader with `<Spinner size="sm">`

**Button `loading` prop refactors (8 files):**
- `src/components/modals/AdvisorApplicationModal.tsx` — Submit button: replaced `disabled={isLoading}` + Loader2 ternary with `loading={isLoading}`
- `src/components/advisor/AdvisorSetupWizard.tsx` — Upload Photo button + Finish Setup button: added `loading` prop, conditional icon hide
- `src/components/advisor/TwinSetupCard.tsx` — Loading text → `<Spinner>`, upload area → `<Spinner>`, Save button → `loading` prop
- `src/components/admin/AdminDisputeDetail.tsx` — Investigate, Refund, Reject buttons: all use `loading={isProcessing}` + conditional icon hide
- `src/components/admin/AdminSessionsTable.tsx` — Create Dispute button: `loading={isFlagging}` prop
- `src/components/modals/SessionHoldModal.tsx` — Authorize button: `loading={isProcessing}` prop
- `src/components/advisor/VoiceRecordingCard.tsx` — Uploading state: replaced `<Loader2>` with `<Spinner>`

**Skipped (custom inline styles, not `<Button>` components):**
- `src/components/advisor/StripeConnectCard.tsx` — Uses `<Loader2 size={16} style={{color: T.cyan}}>` in raw inline-styled elements
- `src/components/advisor/AdvisorSettingsView.tsx` — Same pattern with inline styles

### 7c: App.tsx Refactor

- `src/App.tsx` — Replaced inline `LoadingFallback` with `<PageLoader>` as `<Suspense fallback>`

---

## Phase 8: Accessibility + Documentation

### 8a: RouteAnnouncer & Skip-to-Content

**Files created:**
- `src/components/RouteAnnouncer.tsx` — Announces route changes to screen readers via `aria-live="assertive"` region. Converts pathname to human-readable name.

**Files modified:**
- `src/App.tsx`:
  - Added `<RouteAnnouncer />` component after `<BrowserRouter>`
  - Added skip-to-content link: `<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to content</a>`
  - Wrapped `<Routes>` in `<div id="main-content">` for skip-link target

### 8b: Icon-Only Button Aria-Labels

**11 icon-only buttons fixed across 5 files:**

- `src/pages/TwinChat.tsx` — Back button: `aria-label="Go back"`
- `src/pages/AdvisorCall.tsx`:
  - Back button: `aria-label="Leave session"`
  - Mic toggle: `aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}`
  - Video toggle: `aria-label={isCameraOff ? 'Turn on camera' : 'Turn off camera'}`
  - End call: `aria-label="End call"`
  - Speaker toggle: `aria-label={isSpeakerOn ? 'Mute speaker' : 'Unmute speaker'}`
- `src/components/home/CategoriesStrip.tsx`:
  - Left scroll: `aria-label="Scroll categories left"`
  - Right scroll: `aria-label="Scroll categories right"`
- `src/components/home/FeaturedAdvisorsSection.tsx`:
  - Left scroll: `aria-label="Scroll advisors left"`
  - Right scroll: `aria-label="Scroll advisors right"`
- `src/components/advisor/VoiceRecordingCard.tsx`:
  - Play/Pause toggle: `aria-label={isPlaying ? 'Pause recording' : 'Play recording'}`

### 8c: Documentation

- `docs/UI_CHANGES.md` — This file (complete changelog for all 8 phases)
- `docs/CURRENT_UI_KIT.md` — Updated to reflect all new components, variants, and patterns
- `CLAUDE.md` — Updated File Map with new components, documented `Button loading` pattern and `Breadcrumb` component

---

## Phase 9: Mobile Responsiveness

### 9a: Critical Bug Fix — Mobile Auth Buttons

**Problem:** "Join Free" and "Sign In" buttons in the mobile menu drawer had no `onClick` handlers — they rendered but did nothing when tapped. Additionally, the header "Sign In" button was hidden below 1024px (`hidden lg:inline-flex`), and the mobile menu showed auth buttons even for logged-in users.

**Files modified:**
- `src/components/layout/MobileMenu.tsx`:
  - Extended `MobileMenuProps` with `onAuth?: (mode: 'signin' | 'signup') => void` and `isAuthenticated?: boolean`
  - Wired "Join Free" to `onAuth('signup')` + `onClose()`, "Sign In" to `onAuth('signin')` + `onClose()`
  - Auth buttons only render when `!isAuthenticated`
  - Split menu items into `publicMenuItems` (always visible) and `authMenuItems` (only when authenticated: Activity, Favorites, Add Funds, Transactions)
- `src/components/layout/Header.tsx`:
  - Passed `onAuth={handleAuth}` and `isAuthenticated={isAuthenticated}` to `<MobileMenu>`
  - Made "Sign In" button visible on all screens: `hidden lg:inline-flex` -> `inline-flex`
  - Increased "Sign Up" button touch target: `h-8` -> `h-9 sm:h-8`

### 9b: Touch Targets (44x44px minimum)

**Files modified:**
- `src/components/advisors/AdvisorCard.tsx`:
  - Favorite heart button: `p-1.5` -> `p-2.5 min-w-11 min-h-11 flex items-center justify-center`
  - Video & AI Twin buttons: `h-9` -> `h-10` for consistent touch targets
- `src/components/home/FeaturedAdvisorsSection.tsx`:
  - Scroll left/right buttons: `w-8 h-8` -> `w-10 h-10 sm:w-8 sm:h-8` (larger on mobile, compact on desktop)

### 9c: Responsive Layouts

**Files modified:**
- `src/pages/AdvisorsListing.tsx`:
  - Filter sheet: added `max-w-[85vw]` alongside `w-80` to prevent overflow on narrow devices
  - Sort select: `w-[160px]` -> `w-[130px] sm:w-[160px]`
- `src/pages/Activity.tsx`:
  - Type filter select: `w-[140px]` -> `w-[120px] sm:w-[140px]`
  - Status filter select: `w-[150px]` -> `w-[120px] sm:w-[150px]`
- `src/components/home/AllAdvisorsSection.tsx`:
  - Filter panel gap: `gap-6` -> `gap-4 md:gap-6`
  - All filter select triggers: `w-[160px]` -> `w-full sm:w-[160px]`
- `src/pages/Settings.tsx`:
  - Main grid gap: `gap-8` -> `gap-4 lg:gap-8`
  - Settings nav: converted to horizontal scrollable strip on mobile (`flex lg:flex-col overflow-x-auto lg:overflow-visible`), buttons use `shrink-0 whitespace-nowrap` for horizontal scroll
- `src/components/layout/Footer.tsx`:
  - Grid gap: `gap-8` -> `gap-6 md:gap-8`
