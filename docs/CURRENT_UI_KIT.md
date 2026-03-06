# Cosmiclly UI Kit — Current State

> Reference documentation for the existing design system as implemented in the codebase.
> Auto-generated from source code analysis of `src/index.css`, `tailwind.config.ts`, and `src/components/`.

---

## 1. Design Tokens (CSS Custom Properties)

All colors are defined as HSL values in `src/index.css` `:root` and consumed via `hsl(var(--token))` in Tailwind config.

### 1.1 Core Semantic Colors

| Token | HSL | Hex (approx.) | Role |
|-------|-----|---------------|------|
| `--background` | `260 45% 7%` | `#0f0b1a` | Page background |
| `--foreground` | `270 20% 95%` | `#f2eff7` | Primary text |
| `--card` | `260 40% 11%` | `#161029` | Card surfaces |
| `--card-foreground` | `270 20% 95%` | `#f2eff7` | Card text |
| `--popover` | `260 40% 13%` | `#1a1330` | Popover surfaces |
| `--popover-foreground` | `270 20% 95%` | `#f2eff7` | Popover text |
| `--primary` | `187 94% 43%` | `#07b5d3` | CTAs, headlines, focus rings |
| `--primary-foreground` | `260 45% 10%` | `#0e0a1b` | Text on primary |
| `--secondary` | `263 70% 58%` | `#7c4dff` | Buttons, interactive pills |
| `--secondary-foreground` | `0 0% 100%` | `#ffffff` | Text on secondary |
| `--accent` | `38 92% 50%` | `#f59e0b` | Highlights, badges, callouts |
| `--accent-foreground` | `260 45% 7%` | `#0f0b1a` | Text on accent |
| `--muted` | `260 30% 18%` | `#261e3b` | Muted surfaces |
| `--muted-foreground` | `270 20% 70%` | `#a89bbe` | Secondary text |
| `--destructive` | `0 84% 60%` | `#ef4444` | Error/danger actions |
| `--destructive-foreground` | `0 0% 100%` | `#ffffff` | Text on destructive |
| `--border` | `260 30% 20%` | `#2d2342` | Borders |
| `--input` | `260 35% 16%` | `#211837` | Input backgrounds |
| `--ring` | `187 94% 43%` | `#07b5d3` | Focus ring color |
| `--radius` | — | `0.75rem` (12px) | Default border radius |

### 1.2 Northern Lights Accent Palette

| Token | HSL | Purpose |
|-------|-----|---------|
| `--neon-violet` | `263 70% 58%` | Violet accent |
| `--neon-cyan` | `187 94% 43%` | Cyan/turquoise accent |
| `--neon-pink` | `280 80% 60%` | Pink accent |
| `--neon-lime` | `38 92% 50%` | Gold/amber accent |
| `--deep-purple` | `260 45% 10%` | Deep background purple |
| `--midnight` | `260 50% 4%` | Darkest background |

### 1.3 Status Colors (Functional)

| Token | HSL | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| `--online-green` | `142 70% 45%` | `bg-status-online` | Online indicator |
| `--busy-orange` | `38 92% 50%` | `bg-status-busy` | Busy indicator |
| `--offline-gray` | `260 20% 40%` | `bg-status-offline` | Offline indicator |

Note: `status.online` in tailwind.config uses a different value `hsl(160 84% 39%)` (hardcoded, not via CSS variable).

### 1.4 Legacy Blood Palette (Mapped to Northern Lights)

| Token | HSL | Maps To |
|-------|-----|---------|
| `--blood-deep` | `187 60% 25%` | Dark cyan |
| `--blood-dark` | `187 50% 20%` | Darker cyan |
| `--blood-vibrant` | `187 94% 43%` | = `--primary` |
| `--blood-black` | `260 45% 7%` | = `--background` |

### 1.5 Sidebar Colors

| Token | HSL |
|-------|-----|
| `--sidebar-background` | `260 45% 7%` |
| `--sidebar-foreground` | `270 20% 95%` |
| `--sidebar-primary` | `187 94% 43%` |
| `--sidebar-primary-foreground` | `260 45% 10%` |
| `--sidebar-accent` | `260 35% 18%` |
| `--sidebar-accent-foreground` | `270 20% 95%` |
| `--sidebar-border` | `260 30% 22%` |
| `--sidebar-ring` | `187 94% 43%` |

### 1.6 Dark Mode Overrides (`.dark` class)

Slightly deeper variants of the root theme:

| Token | Root | `.dark` |
|-------|------|---------|
| `--background` | `260 45% 7%` | `260 50% 5%` |
| `--card` | `260 40% 11%` | `260 45% 9%` |
| `--popover` | `260 40% 13%` | `260 45% 11%` |
| `--muted` | `260 30% 18%` | `260 30% 15%` |
| `--muted-foreground` | `270 20% 70%` | `270 20% 65%` |
| `--border` | `260 30% 20%` | `260 30% 18%` |
| `--input` | `260 35% 16%` | `260 35% 14%` |

---

## 2. Typography

### 2.1 Font

- **Family:** Lora (serif)
- **Source:** Google Fonts, loaded via `<link>` in `index.html` with `preconnect`
- **Weights:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold) — normal + italic
- **Tailwind mapping:** `font-sans`, `font-serif`, and `font-heading` all resolve to `'Lora', serif`

### 2.2 Type Scale (from `tailwind.config.ts`)

| Class | Size | Line Height | Px Equivalent |
|-------|------|-------------|---------------|
| `text-xs` | 0.8125rem | 1.4 | 13px |
| `text-sm` | 0.9375rem | 1.5 | 15px |
| `text-base` | 1rem | 1.65 | 16px |
| `text-lg` | 1.125rem | 1.55 | 18px |
| `text-xl` | 1.25rem | 1.45 | 20px |
| `text-2xl` | 1.5rem | 1.35 | 24px |
| `text-3xl` | 1.875rem | 1.25 | 30px |
| `text-4xl` | 2.25rem | 1.15 | 36px |
| `text-5xl` | 3rem | 1.1 | 48px |

### 2.3 Heading Styles (from `index.css` `@layer base`)

| Element | Size | Line Height | Weight | Tracking |
|---------|------|-------------|--------|----------|
| `h1` | `clamp(1.75rem, 4vw, 2.5rem)` (28–40px) | 1.2 | 700 | -0.02em |
| `h2` | `clamp(1.375rem, 3vw, 1.875rem)` (22–30px) | 1.3 | 700 | -0.015em |
| `h3` | `clamp(1.125rem, 2.5vw, 1.375rem)` (18–22px) | 1.4 | 600 | -0.01em |
| `h4` | 1.125rem (18px) | 1.45 | 600 | — |
| `h5`/`h6` | 1rem (16px) | 1.5 | 600 | — |

### 2.4 Body Text

| Property | Value |
|----------|-------|
| Font size | 1rem (16px) |
| Line height | 1.65 |
| Letter spacing | 0.01em |
| Paragraph line height | 1.7 |
| `html font-size` | 100% (respects browser prefs) |

---

## 3. Gradients

### 3.1 CSS Variable Gradients

| Variable | Value | Utility Class |
|----------|-------|---------------|
| `--gradient-hero` | `linear-gradient(180deg, hsl(260 45% 9%) 0%, hsl(260 50% 4%) 100%)` | `.bg-hero-gradient` |
| `--gradient-card` | `linear-gradient(180deg, hsl(260 40% 13%) 0%, hsl(260 40% 9%) 100%)` | `.bg-card-gradient` |
| `--gradient-primary` | `linear-gradient(135deg, hsl(263 70% 58%) 0%, hsl(187 94% 43%) 100%)` | `.bg-mystical-gradient` |
| `--gradient-neon` | `linear-gradient(135deg, hsl(263 70% 58%) 0%, hsl(187 94% 50%) 100%)` | `.bg-neon-gradient` |
| `--gradient-mystical` | Same as `--gradient-primary` | — |

### 3.2 Text Gradient Classes

| Class | Gradient Source |
|-------|----------------|
| `.text-gradient` | `--gradient-mystical` (violet → cyan) |
| `.text-gradient-neon` | `--gradient-neon` |
| `.text-gradient-primary` | `--gradient-primary` |

All use `bg-clip-text text-transparent` pattern.

---

## 4. Shadows

| Variable | Value | Utility Class |
|----------|-------|---------------|
| `--shadow-glow` | `0 0 40px hsl(187 94% 43% / 0.25)` | `.glow-primary` |
| `--shadow-card` | `0 4px 20px hsl(0 0% 0% / 0.4)` | `.card-shadow` |
| `--shadow-elevated` | `0 8px 40px hsl(0 0% 0% / 0.5)` | `.elevated-shadow` |
| `--shadow-neon` | `0 0 30px hsl(187 94% 43% / 0.3)` | `.glow-neon` |
| Status glow | `0 0 10px hsl(142 70% 45% / 0.6)` | `.status-online` |

---

## 5. Border Radius

| Tailwind Token | Value |
|----------------|-------|
| `rounded-lg` | `var(--radius)` = 0.75rem (12px) |
| `rounded-md` | `calc(var(--radius) - 2px)` = 10px |
| `rounded-sm` | `calc(var(--radius) - 4px)` = 8px |

---

## 6. Shadcn UI Components (46 installed)

Located in `src/components/ui/`.

### 6.1 Button (`button.tsx`)

**Variants (11):**

| Variant | Styles |
|---------|--------|
| `default` | `bg-primary text-primary-foreground hover:bg-primary/90` |
| `destructive` | `bg-destructive text-destructive-foreground hover:bg-destructive/90` |
| `outline` | `border border-primary/50 bg-transparent text-primary hover:bg-primary/10` |
| `secondary` | `bg-secondary text-secondary-foreground hover:bg-secondary/80` |
| `ghost` | `hover:bg-primary/10 hover:text-primary` |
| `link` | `text-primary underline-offset-4 hover:underline` |
| `hero` | Purple gradient (`from-[hsl(252,85%,60%)]` to `[hsl(280,70%,55%)]`) + glow shadow |
| `gold` | `bg-[hsl(45,90%,55%)]` gold with dark text |
| `mystical` | Violet border + translucent bg + glow hover |
| `success` | `bg-emerald-600 text-white hover:bg-emerald-500` |
| `warning` | `bg-amber-500 text-[hsl(260,45%,7%)] hover:bg-amber-400` |

**Sizes (5):**

| Size | Dimensions |
|------|------------|
| `default` | `h-10 px-4 py-2` |
| `sm` | `h-9 rounded-md px-3` |
| `lg` | `h-12 rounded-lg px-8 text-base` |
| `xl` | `h-14 rounded-xl px-10 text-lg` |
| `icon` | `h-10 w-10` |

**Loading prop:** `loading?: boolean` — when true, prepends `<Loader2 className="animate-spin" />`, sets `disabled`, adds `opacity-80`. Usage: `<Button loading={isSubmitting}>Submit</Button>`. For buttons with icons, hide the icon when loading: `{!isLoading && <Icon />}`.

**Base classes:** `rounded-lg text-sm font-medium transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50`

### 6.2 Badge (`badge.tsx`)

**Variants (10):**

| Variant | Styles |
|---------|--------|
| `default` | `bg-primary text-primary-foreground` |
| `secondary` | `bg-secondary text-secondary-foreground` |
| `destructive` | `bg-destructive text-destructive-foreground` |
| `outline` | `text-foreground` (border only) |
| `accent` | `bg-accent/20 text-accent border-accent/30` |
| `success` | `bg-emerald-500/20 text-emerald-400 border-emerald-500/30` |
| `warning` | `bg-amber-500/20 text-amber-400 border-amber-500/30` |
| `online` | Green dot + `bg-emerald-500/15 text-emerald-400 border-emerald-500/30` |
| `busy` | Amber dot + `bg-amber-500/15 text-amber-400 border-amber-500/30` |
| `offline` | Gray dot + `bg-muted text-muted-foreground` |

**Base:** `rounded-full border px-2.5 py-0.5 text-xs font-semibold`

### 6.3 Full Component Inventory

| Component | File | Radix Primitive | Key Specs |
|-----------|------|-----------------|-----------|
| Accordion | `accordion.tsx` | `@radix-ui/react-accordion` | Animated height transition |
| Avatar | `avatar.tsx` | `@radix-ui/react-avatar` | `h-10 w-10 rounded-full` default |
| Alert | `alert.tsx` | — (CVA) | 5 variants: default, info, success, warning, destructive |
| Avatar Group | `avatar-group.tsx` | — | Overlapping avatars with "+N" overflow |
| Badge | `badge.tsx` | — (CVA) | 10 variants, `rounded-full` |
| Breadcrumb | `breadcrumb.tsx` | — | `<nav aria-label>` + `<ol>` semantics, chevron separators |
| Button | `button.tsx` | `@radix-ui/react-slot` | 11 variants, 5 sizes, `loading` prop |
| Button Group | `button-group.tsx` | — | Flex wrapper, rounds first/last child only |
| Card | `card.tsx` | — | Card/Header/Title/Description/Content/Footer |
| Checkbox | `checkbox.tsx` | `@radix-ui/react-checkbox` | `h-4 w-4 rounded-sm` |
| Collapsible | `collapsible.tsx` | `@radix-ui/react-collapsible` | Trigger + Content |
| Confirm Dialog | `confirm-dialog.tsx` | `@radix-ui/react-alert-dialog` | Standardized confirm/cancel, `confirmVariant`, `loading` |
| Date Picker | `date-picker.tsx` | Custom | `react-day-picker` with dropdown year/month |
| Dialog | `dialog.tsx` | `@radix-ui/react-dialog` | Overlay + zoom-in/out animation |
| Dropdown Menu | `dropdown-menu.tsx` | `@radix-ui/react-dropdown-menu` | Focus: `cyan-500/10` |
| Empty State | `empty-state.tsx` | — | Icon + title + description + optional action button |
| Form | `form.tsx` | — | `react-hook-form` + Zod integration |
| Input | `input.tsx` | — | `h-10 rounded-md border-input bg-background` |
| Label | `label.tsx` | `@radix-ui/react-label` | `text-sm font-medium` |
| Notification Badge | `notification-badge.tsx` | — | Red circle, absolute positioned, caps at "99+" |
| Page Loader | `page-loader.tsx` | — | Full-page centered spinner + message, Suspense fallback |
| Pagination | `pagination.tsx` | — | Page numbers, prev/next arrows, `onPageChange` |
| Password Input | `password-input.tsx` | — | Input + Eye/EyeOff toggle for show/hide password |
| Popover | `popover.tsx` | `@radix-ui/react-popover` | Floating panel |
| Price Display | `price-display.tsx` | — | Original/discounted price with strikethrough |
| Progress | `progress.tsx` | `@radix-ui/react-progress` | Bar with `bg-muted` track + `bg-primary` fill |
| Radio Group | `radio-group.tsx` | `@radix-ui/react-radio-group` | Northern Lights themed circle indicator |
| Search Input | `search-input.tsx` | — | Search icon + clear X button + Escape to clear |
| Select | `select.tsx` | `@radix-ui/react-select` | Focus: `cyan-500/10` |
| Separator | `separator.tsx` | `@radix-ui/react-separator` | `bg-border` |
| Sheet | `sheet.tsx` | `@radix-ui/react-dialog` | Side drawer, top/right/bottom/left |
| Skeleton | `skeleton.tsx` | — | `animate-pulse rounded-md bg-muted` |
| Slider | `slider.tsx` | `@radix-ui/react-slider` | `h-5 w-5` thumb, primary track |
| Sonner | `sonner.tsx` | Sonner library | Themed toast wrapper |
| Spinner | `spinner.tsx` | — | Loader2 + animate-spin, sm/md/lg, `role="status"` |
| Star Rating | `star-rating.tsx` | — | Filled/half/empty stars, `value` + `count` props |
| Stat Card | `stat-card.tsx` | — | Icon + label + value + change/trend for dashboards |
| Step Indicator | `step-indicator.tsx` | — | Horizontal dots + connecting lines, 3 states |
| Switch | `switch.tsx` | `@radix-ui/react-switch` | `h-6 w-11` |
| Table | `table.tsx` | — | Responsive with `overflow-auto` wrapper |
| Tabs | `tabs.tsx` | `@radix-ui/react-tabs` | `bg-muted` list, `shadow-sm` active |
| Textarea | `textarea.tsx` | — | `min-h-[80px] rounded-md border-input` |
| Time Picker | `time-picker.tsx` | Custom | 12h format with AM/PM, popover-based |
| Toast | `toast.tsx` | `@radix-ui/react-toast` | Top (mobile), bottom-right (desktop) |
| Toaster | `toaster.tsx` | — | Toast container |
| Tooltip | `tooltip.tsx` | `@radix-ui/react-tooltip` | `animate-in/out zoom-in-95` |

---

## 7. Custom Components

### 7.1 Layout

| Component | File | Purpose |
|-----------|------|---------|
| Header | `layout/Header.tsx` | Sticky nav with role-based menus (client/advisor/admin) |
| StickyHeader | `layout/StickyHeader.tsx` | `sticky top-0 z-50` wrapper for Header |
| MobileMenu | `layout/MobileMenu.tsx` | Sheet-based left drawer menu for mobile |
| Footer | `layout/Footer.tsx` | 6-column grid, social links, legal links |

### 7.2 Advisor Components

| Component | File | Purpose |
|-----------|------|---------|
| AdvisorCard | `advisors/AdvisorCard.tsx` | Listing card with status ring, badges, ratings, pricing, CTAs |
| AdvisorCardSkeleton | `advisors/AdvisorCardSkeleton.tsx` | Skeleton loader matching AdvisorCard dimensions |
| AdvisorSearchBar | `search/AdvisorSearchBar.tsx` | Search input with autocomplete dropdown |

### 7.3 Home Page Sections

| Component | File | Purpose |
|-----------|------|---------|
| HeroSection | `home/HeroSection.tsx` | Gradient BG, animated stars, search bar, filter pills |
| CategoriesSection | `home/CategoriesSection.tsx` | Full categories grid |
| CategoriesStrip | `home/CategoriesStrip.tsx` | Horizontal scrollable category pills |
| FeaturedAdvisorsSection | `home/FeaturedAdvisorsSection.tsx` | Featured advisors showcase |
| AllAdvisorsSection | `home/AllAdvisorsSection.tsx` | Browse all advisors |
| RecentlyViewedSection | `home/RecentlyViewedSection.tsx` | Recently viewed advisors |
| DailyHoroscope | `home/DailyHoroscope.tsx` | Daily horoscope card |
| HowItWorksSection | `home/HowItWorksSection.tsx` | 4-step flow with connectors |
| TestimonialsSection | `home/TestimonialsSection.tsx` | Testimonial cards with star-field BG |

### 7.4 Modal Components

| Component | File | Purpose |
|-----------|------|---------|
| AuthModal | `modals/AuthModal.tsx` | Sign in/up with Google OAuth + password reset |
| SearchModal | `modals/SearchModal.tsx` | Advisor search overlay |
| WelcomeModal | `modals/WelcomeModal.tsx` | Welcome/onboarding |
| ReviewModal | `modals/ReviewModal.tsx` | Post-session review/rating |
| CardDetailsModal | `modals/CardDetailsModal.tsx` | Credit card entry |
| PaymentMethodModal | `modals/PaymentMethodModal.tsx` | Payment method selector |
| SessionHoldModal | `modals/SessionHoldModal.tsx` | Session hold/waiting |
| AdvisorApplicationModal | `modals/AdvisorApplicationModal.tsx` | Advisor application form |

### 7.5 Admin Components

| Component | File | Purpose |
|-----------|------|---------|
| AdminDashboard | `admin/AdminDashboard.tsx` | Stats cards + analytics |
| AdminSidebar | `admin/AdminSidebar.tsx` | Admin nav sidebar |
| AdminUsersTable | `admin/AdminUsersTable.tsx` | User management |
| AdminSessionsTable | `admin/AdminSessionsTable.tsx` | Session history + filtering |
| AdminTransactionsTable | `admin/AdminTransactionsTable.tsx` | Financial transactions |
| AdminAdvisorApprovals | `admin/AdminAdvisorApprovals.tsx` | Application management |
| AdminApplicationReview | `admin/AdminApplicationReview.tsx` | Individual application review |
| AdminDisputeCenter | `admin/AdminDisputeCenter.tsx` | Dispute management |
| AdminDisputeDetail | `admin/AdminDisputeDetail.tsx` | Dispute detail view |
| AdvisorContractModal | `admin/AdvisorContractModal.tsx` | Contract management |

### 7.6 Advisor Portal Components

| Component | File | Purpose |
|-----------|------|---------|
| AdvisorDashboardView | `advisor/AdvisorDashboardView.tsx` | Dashboard with Recharts analytics |
| AdvisorSettingsView | `advisor/AdvisorSettingsView.tsx` | Settings panel |
| AdvisorSetupWizard | `advisor/AdvisorSetupWizard.tsx` | Multi-step onboarding wizard |
| AvailabilityScheduleCard | `advisor/AvailabilityScheduleCard.tsx` | Schedule management |
| StripeConnectCard | `advisor/StripeConnectCard.tsx` | Stripe payout setup |
| TwinSetupCard | `advisor/TwinSetupCard.tsx` | AI Twin configuration |
| VoiceRecordingCard | `advisor/VoiceRecordingCard.tsx` | Voice cloning recording |

### 7.7 Other

| Component | File | Purpose |
|-----------|------|---------|
| RouteAnnouncer | `RouteAnnouncer.tsx` | Screen reader route change announcements (`aria-live`) |
| ErrorBoundary | `ErrorBoundary.tsx` | Full-screen error state with refresh button |
| CookieConsent | `CookieConsent.tsx` | Fixed bottom cookie banner |
| LowCreditWarning | `session/LowCreditWarning.tsx` | Low balance dialog |
| SessionHistory | `settings/SessionHistory.tsx` | Session history list |
| NavLink | `NavLink.tsx` | Navigation link wrapper |
| AdvisorPrivateProfile | `profile/AdvisorPrivateProfile.tsx` | Advisor's own profile view |
| Skeletons | `skeletons/index.tsx` | 5 variants: ProfileHeader, SessionPage, ActivityRow, TransactionRow, StatCard |

---

## 8. Animations & Transitions

### 8.1 Keyframes (tailwind.config.ts)

| Name | Description | Duration | Easing |
|------|-------------|----------|--------|
| `accordion-down` | Height: 0 → content height | 0.2s | ease-out |
| `accordion-up` | Height: content height → 0 | 0.2s | ease-out |
| `shimmer` | Background position sweep | 2s | linear (infinite) |
| `fade-in` | Opacity 0 + translateY(10px) → visible | 0.5s | ease-out |
| `slide-in-right` | Opacity 0 + translateX(20px) → visible | 0.3s | ease-out |

### 8.2 Keyframes (index.css)

| Name | Description | Duration | Easing |
|------|-------------|----------|--------|
| `float` | translateY(0) → -20px → 0 | 6s | ease-in-out (infinite) |
| `twinkle` | opacity 0.3 + scale(1) → 1 + scale(1.2) | 3s | ease-in-out (infinite) |
| `glow-pulse` | box-shadow 20px → 40px | 2s | ease-in-out (infinite) |

### 8.3 Tailwind Animate Plugin

From `tailwindcss-animate`: `animate-in`, `animate-out`, `fade-in-0`, `zoom-in-95`, `slide-in-from-*`, etc.

### 8.4 Common Transition Patterns

| Pattern | Classes | Usage |
|---------|---------|-------|
| Color/BG shift | `transition-all duration-300` | Buttons, cards, links |
| Card hover lift | `hover:-translate-y-1` | AdvisorCard |
| Opacity hover | `hover:opacity-90` | Hero button |
| Border glow | `hover:border-primary/50` | Card hover |
| Spin loader | `animate-spin` | Loader2 icon |
| Pulse | `animate-pulse` | Online status badge, skeleton |
| Bounce | `animate-bounce` | Notification bell |

---

## 9. Layout System

### 9.1 Container

- **Max width:** 1400px (at `2xl` breakpoint)
- **Padding:** 1rem (16px) horizontal
- **Centering:** `container mx-auto`

### 9.2 Responsive Breakpoints

| Breakpoint | Min Width | Common Usage |
|------------|-----------|-------------|
| `sm` | 640px | 2-column grids, larger text |
| `md` | 768px | Side-by-side layouts, increased padding |
| `lg` | 1024px | Desktop nav visible, 3+ columns |
| `xl` | 1280px | 4-column grids |
| `2xl` | 1400px | Container max-width |

### 9.3 Common Grid Patterns

| Context | Grid Classes |
|---------|-------------|
| Advisor cards | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` |
| Dashboard stats | `grid-cols-2 md:grid-cols-4` |
| Footer columns | `grid-cols-2 md:grid-cols-6` |
| Form 2-col | `grid-cols-2 gap-3.5` |
| How it works | `md:grid-cols-4` |
| Horoscope grid | `grid-cols-2 md:grid-cols-6` |

### 9.4 Page Structure Pattern

```
<div className="min-h-screen bg-background overflow-x-hidden">
  <StickyHeader /> or <Header />
  <main>
    {/* Page sections with container mx-auto px-4 */}
  </main>
  <Footer />
  <CookieConsent />
</div>
```

---

## 10. Z-Index Hierarchy

| Layer | Z-Index | Elements |
|-------|---------|----------|
| Base | 0 (default) | Page content |
| Elevated | `z-10` | Background decorations, relative content |
| Header | `z-50` | Sticky header |
| Overlays | `z-50` | Dialog, Sheet, Dropdown, Tooltip, Mobile menu |
| Toasts | `z-[100]` | Toast viewport |

---

## 11. Icons

### 11.1 Library

- **Package:** `lucide-react` v0.462.0
- **Stroke weight:** 2px (default)
- **Color:** Inherits from `currentColor`

### 11.2 Standard Sizes

| Context | Classes | Px |
|---------|---------|-----|
| Button inline | `[&_svg]:size-4` (auto via Button base) | 16px |
| Small inline | `w-3 h-3` or `w-3.5 h-3.5` | 12–14px |
| Standard | `w-4 h-4` | 16px |
| Navigation | `w-5 h-5` | 20px |
| Card accent | `w-8 h-8` | 32px |
| Feature/hero | `w-12 h-12` | 48px |

### 11.3 Custom Icons

- `src/assets/ai-twin-icon.png` — AI Twin feature icon (raster)

---

## 12. Utility Classes

### 12.1 Scrollbar

| Class | Effect |
|-------|--------|
| `.scrollbar-hide` | Hide scrollbar completely (all browsers) |
| `.scrollbar-styled` | 5px thin scrollbar, cyan-themed, hover brightens |

### 12.2 Status Indicators

| Class | Effect |
|-------|--------|
| `.status-online` | `bg-status-online` + green glow shadow |
| `.status-busy` | `bg-status-busy` (amber) |
| `.status-offline` | `bg-status-offline` (gray) |

### 12.3 3D Card Flip

| Class | CSS |
|-------|-----|
| `.perspective-1000` | `perspective: 1000px` |
| `.transform-style-3d` | `transform-style: preserve-3d` |
| `.backface-hidden` | `backface-visibility: hidden` |
| `.rotate-y-180` | `transform: rotateY(180deg)` |

---

## 13. Third-Party UI Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | 3.4.17 | Utility-first CSS |
| `tailwindcss-animate` | 1.0.7 | Animation utilities |
| `@tailwindcss/typography` | — | Prose/article styling |
| `class-variance-authority` | — | Type-safe component variants |
| `clsx` | — | Conditional class merging |
| `tailwind-merge` | — | Smart class deduplication |
| `lucide-react` | 0.462.0 | Icon library |
| `sonner` | 1.7.4 | Toast notifications |
| `recharts` | 2.15.4 | Data visualization (admin dashboard) |
| `react-day-picker` | 8.10.1 | Calendar date picker |
| `date-fns` | 3.6.0 | Date formatting |
| `next-themes` | 0.3.0 | Theme management |
| `@radix-ui/*` | Various | Accessible UI primitives |

---

## 8. Mobile Guidelines

### Touch Targets
All interactive elements must be at least 44x44px on mobile. Use `min-w-11 min-h-11` (44px) as the minimum for icon-only buttons and small tap targets.

### Responsive Width Patterns
Avoid hardcoded fixed widths on always-visible elements. Prefer responsive patterns:
- Select triggers: `w-full sm:w-[160px]` or `w-[120px] sm:w-[150px]`
- Filter sheets/drawers: always add `max-w-[85vw]` alongside fixed widths (e.g., `w-80 max-w-[85vw]`)
- Sidebars: convert to horizontal scrollable strip on mobile (`flex lg:flex-col overflow-x-auto lg:overflow-visible`)

### Responsive Gap Pattern
Scale gaps down on smaller screens:
- Standard: `gap-4 md:gap-6`
- Grid layouts: `gap-4 lg:gap-8`
- Avoid `gap-6` or `gap-8` without a smaller mobile value

### Sticky Elements
Use `lg:sticky` for sidebars that appear below main content on mobile (single-column layout). Unconditional `sticky` wastes vertical space on mobile.

### MobileMenu Auth Awareness
The `MobileMenu` component accepts `onAuth` and `isAuthenticated` props. Always pass these from the Header to ensure:
- Auth buttons (Join Free / Sign In) only show for logged-out users
- Auth-required menu items (Activity, Favorites, etc.) only show for logged-in users
