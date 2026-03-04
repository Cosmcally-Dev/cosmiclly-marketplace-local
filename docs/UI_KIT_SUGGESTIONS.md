# Cosmiclly UI Kit — Suggested Improvements & Expansion

> A comprehensive UI Kit specification covering component library, states, layout, iconography, and accessibility.
> Builds on the existing "Northern Lights" dark theme system documented in `CURRENT_UI_KIT.md`.

---

## Executive Summary

The current Cosmiclly UI is functional and visually cohesive, built on a solid Shadcn UI + Tailwind foundation. This document recommends targeted improvements across five areas:

1. **Component Library** — Standardize and extract repeated patterns into reusable components (loading buttons, empty states, breadcrumbs, alerts)
2. **States & Interactions** — Formalize component states, error micro-copy, and transition specifications
3. **Layout & Spacing** — Document the spacing scale, grid system, and z-index hierarchy as enforceable conventions
4. **Iconography & Imagery** — Standardize icon sizes, image treatments, and fallback patterns
5. **Accessibility** — Address contrast ratios, focus management, ARIA attributes, and keyboard navigation

---

## 1. Component Library (The Building Blocks)

### 1.1 Buttons

#### Current State
9 variants (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `hero`, `gold`, `mystical`) and 5 sizes (`default`, `sm`, `lg`, `xl`, `icon`).

#### Suggested Additions

**New Variants:**

| Variant | Use Case | Suggested Styles |
|---------|----------|------------------|
| `success` | Confirmation actions (save, approve) | `bg-emerald-600 text-white hover:bg-emerald-500` |
| `warning` | Caution actions (dismiss, skip) | `bg-amber-500 text-[hsl(260,45%,7%)] hover:bg-amber-400` |

**Loading State Pattern:**

Currently loading is handled ad-hoc per page (`isLoading ? 'Please wait...' : 'Submit'`). Standardize with a built-in pattern:

```tsx
// Suggested: Add `loading` prop to Button
<Button loading>Submit</Button>

// Renders as:
<button disabled>
  <Loader2 className="animate-spin h-4 w-4" />
  Submit
</button>
```

Implementation: Add `loading?: boolean` prop to `ButtonProps`. When `true`, prepend `Loader2` icon, set `disabled`, and add `opacity-80`.

**Button Group:**

Extract a `ButtonGroup` component for grouped related actions (e.g., Chat / Call / Video on AdvisorCard):

```tsx
<ButtonGroup>
  <Button variant="outline"><MessageCircle /> Chat</Button>
  <Button variant="outline"><Phone /> Call</Button>
  <Button variant="outline"><Video /> Video</Button>
</ButtonGroup>
```

Styles: `flex [&>button]:rounded-none [&>button:first-child]:rounded-l-lg [&>button:last-child]:rounded-r-lg [&>button:not(:last-child)]:border-r-0`

**Icon-Only Button Documentation:**

All icon-only buttons (`size="icon"`) MUST include `aria-label`:

```tsx
<Button size="icon" variant="ghost" aria-label="Close menu">
  <X />
</Button>
```

---

### 1.2 Form Controls

#### Current State
Installed: Input, Textarea, Select, Checkbox, Switch, Slider, Date Picker, Time Picker, Form (react-hook-form integration).

#### Suggested Additions

**Password Input** — Extract the repeated show/hide toggle pattern from AuthModal:

```tsx
<PasswordInput placeholder="Enter password" />
```

Wraps `Input` with an eye/eye-off toggle button. States: hidden (dots), visible (plain text).

**Search Input** — Extract the search + clear pattern from AdvisorSearchBar:

```tsx
<SearchInput
  placeholder="Search advisors..."
  onClear={() => {}}
  value={query}
  onChange={setQuery}
/>
```

Includes: `Search` icon prefix, clear `X` button when value present, `Escape` key to clear.

**Character Counter Textarea:**

```tsx
<Textarea maxLength={500} showCount />
// Renders "342 / 500" below the textarea
```

**Radio Group** — Radix `@radix-ui/react-radio-group` is already in `package.json` but has no UI component. Create `radio-group.tsx`:

```tsx
<RadioGroup defaultValue="chat">
  <RadioGroupItem value="chat" label="Chat" />
  <RadioGroupItem value="audio" label="Audio Call" />
  <RadioGroupItem value="video" label="Video Call" />
</RadioGroup>
```

**Progress Bar** — For session timers, file uploads, onboarding wizards:

```tsx
<Progress value={65} className="h-2" />
```

Styles: `bg-muted` track, `bg-primary` fill, animated width transition.

**Form Field States (Visual Specification):**

| State | Border | Background | Ring | Label Color |
|-------|--------|------------|------|-------------|
| Default | `border-input` | `bg-background` | — | `text-foreground` |
| Placeholder | Same | Same | — | — |
| Filled | Same | Same | — | Same |
| Focus | `border-primary` | Same | `ring-2 ring-ring` | `text-primary` |
| Disabled | `border-input/50` | `bg-muted/50` | — | `text-muted-foreground` |
| Error | `border-destructive` | Same | `ring-2 ring-destructive/30` | `text-destructive` |
| Success | `border-emerald-500` | Same | `ring-2 ring-emerald-500/30` | `text-emerald-500` |

**Icon Placement in Inputs:**

```
┌──────────────────────────────┐
│ 🔍  Search advisors...       │  ← Left icon (Search)
└──────────────────────────────┘

┌──────────────────────────────┐
│ Enter password          👁   │  ← Right icon (Eye toggle)
└──────────────────────────────┘

┌──────────────────────────────┐
│ 📧  email@example.com    ✓  │  ← Both sides
└──────────────────────────────┘
```

Left icon: `pl-10` on input, icon absolutely positioned `left-3 top-1/2 -translate-y-1/2`.
Right icon: `pr-10` on input, icon absolutely positioned `right-3 top-1/2 -translate-y-1/2`.

---

### 1.3 Navigation Elements

#### Current State
Header with desktop dropdowns + mobile Sheet drawer, Tabs, ad-hoc breadcrumbs in AdvisorsListing.

#### Suggested Additions

**Breadcrumb Component:**

```tsx
<Breadcrumb>
  <BreadcrumbItem href="/">Home</BreadcrumbItem>
  <BreadcrumbSeparator />
  <BreadcrumbItem href="/advisors">Advisors</BreadcrumbItem>
  <BreadcrumbSeparator />
  <BreadcrumbItem active>Luna Starweaver</BreadcrumbItem>
</Breadcrumb>
```

Styles: `text-sm text-muted-foreground`, active item `text-foreground font-medium`, separator `ChevronRight w-3.5 h-3.5`.

**Pagination:**

```tsx
<Pagination
  currentPage={3}
  totalPages={12}
  onPageChange={(page) => {}}
/>
```

Layout: `< 1 2 [3] 4 5 ... 12 >` with `Button variant="ghost"` for page numbers, `variant="outline"` for active.

**Step Indicator** — For multi-step flows (AdvisorSetupWizard, onboarding):

```tsx
<StepIndicator
  steps={["Profile", "Schedule", "Payments", "AI Twin"]}
  currentStep={2}
/>
```

Visual: horizontal dots/numbers connected by lines, completed steps in `bg-primary`, current step with glow ring, upcoming in `bg-muted`.

---

### 1.4 Data Display

#### Current State
Table (admin), Card (advisor, dashboard), Avatar, Badge (4 variants).

#### Suggested Additions

**Stat Card** — Extract from AdminDashboard:

```tsx
<StatCard
  icon={<Users />}
  label="Total Users"
  value="1,234"
  change="+12%"
  trend="up"
/>
```

Styles: `bg-card rounded-xl p-5 border border-border`, icon in `bg-primary/10 rounded-lg p-2`, trend arrow green (up) / red (down).

**Empty State:**

```tsx
<EmptyState
  icon={<Heart />}
  title="No favorites yet"
  description="Save your favorite advisors for quick access"
  action={<Button>Browse Advisors</Button>}
/>
```

Styles: Centered vertically, icon `w-12 h-12 text-muted-foreground`, title `text-lg font-semibold`, description `text-muted-foreground text-sm max-w-sm`.

**Star Rating Display** — Extract from AdvisorCard:

```tsx
<StarRating value={4.7} count={128} />
```

Renders: filled/half/empty stars in `text-amber-400`, count in `text-muted-foreground text-xs`.

**Price Display** — Extract the discount pattern from AdvisorCard:

```tsx
<PriceDisplay
  price={5.99}
  discountedPrice={3.99}
  unit="/min"
/>
```

Renders: original struck through `line-through text-muted-foreground`, discounted in `text-primary font-bold`.

**Avatar Group:**

```tsx
<AvatarGroup max={4}>
  <Avatar src="..." alt="User 1" />
  <Avatar src="..." alt="User 2" />
  <Avatar src="..." alt="User 3" />
  <Avatar src="..." alt="User 4" />
  <Avatar src="..." alt="User 5" />
</AvatarGroup>
// Renders 4 overlapping avatars + "+1" counter
```

**Badge — Additional Variants:**

| New Variant | Use Case | Styles |
|-------------|----------|--------|
| `accent` | Gold/premium badges | `bg-accent text-accent-foreground` |
| `success` | Completed/active status | `bg-emerald-500/20 text-emerald-400 border-emerald-500/30` |
| `warning` | Pending/attention | `bg-amber-500/20 text-amber-400 border-amber-500/30` |
| `online` | Status dot + text | `bg-emerald-500/20 text-emerald-400` + dot |
| `busy` | Status dot + text | `bg-amber-500/20 text-amber-400` + dot |
| `offline` | Status dot + text | `bg-muted text-muted-foreground` + dot |

---

### 1.5 Feedback & Alerts

#### Current State
Dialog modals, Sheet drawers, Toast (Sonner), Tooltip, Skeleton loader, Spinner (ad-hoc).

#### Suggested Additions

**Alert Banner** — Inline notification for page-level messages:

```tsx
<Alert variant="info">
  <AlertIcon />
  <AlertTitle>Session reminder</AlertTitle>
  <AlertDescription>Your session starts in 5 minutes.</AlertDescription>
</Alert>
```

| Variant | Icon | Border | Background |
|---------|------|--------|------------|
| `info` | `Info` | `border-primary/30` | `bg-primary/5` |
| `success` | `CheckCircle` | `border-emerald-500/30` | `bg-emerald-500/5` |
| `warning` | `AlertTriangle` | `border-amber-500/30` | `bg-amber-500/5` |
| `error` | `XCircle` | `border-destructive/30` | `bg-destructive/5` |

**Confirmation Dialog:**

```tsx
<ConfirmDialog
  open={showConfirm}
  title="End session?"
  description="This will end your session with Luna and calculate billing."
  confirmLabel="End Session"
  confirmVariant="destructive"
  onConfirm={() => endSession()}
  onCancel={() => setShowConfirm(false)}
/>
```

Wraps Dialog with standardized confirm/cancel pattern. Destructive actions use `variant="destructive"` confirm button.

**Notification Badge:**

```tsx
<NotificationBadge count={3}>
  <Bell />
</NotificationBadge>
```

Red circle (`bg-destructive rounded-full min-w-[18px] h-[18px] text-[10px] font-bold`) positioned `absolute -top-1.5 -right-1.5`. Shows nothing when count is 0.

**Toast Variants:**

| Variant | Icon | Border Accent |
|---------|------|---------------|
| Default | — | — |
| `success` | `CheckCircle` (emerald) | Left `border-l-4 border-emerald-500` |
| `error` | `XCircle` (red) | Left `border-l-4 border-destructive` |
| `warning` | `AlertTriangle` (amber) | Left `border-l-4 border-amber-500` |
| `info` | `Info` (cyan) | Left `border-l-4 border-primary` |

**Loading Spinner (Standardized):**

```tsx
<Spinner size="sm" /> // h-4 w-4
<Spinner size="md" /> // h-6 w-6
<Spinner size="lg" /> // h-8 w-8
```

Uses `Loader2` from lucide-react with `animate-spin`. Can be colored via `className="text-primary"`.

**Full-Page Loader:**

```tsx
<PageLoader message="Loading your session..." />
```

Centered vertically: spinner + text below. Used for Suspense fallback and page transitions.

**Skeleton Variants Needed:**

| Skeleton | Matches Component |
|----------|-------------------|
| `AdvisorCardSkeleton` | AdvisorCard (exists) |
| `ProfileHeaderSkeleton` | Profile page header |
| `SessionPageSkeleton` | Chat/Call/Video page connecting state |
| `ActivityRowSkeleton` | Activity list row |
| `TransactionRowSkeleton` | Transaction list row |
| `StatCardSkeleton` | Admin stat cards |

---

## 2. States & Interactions

### 2.1 Component State Matrix

| Component | Default | Hover | Active | Focus | Disabled | Loading | Error | Success |
|-----------|---------|-------|--------|-------|----------|---------|-------|---------|
| Button (default) | `bg-primary` | `bg-primary/90` | `bg-primary/80` | `ring-2 ring-ring` | `opacity-50` | Spinner + disabled | — | — |
| Button (destructive) | `bg-destructive` | `bg-destructive/90` | `bg-destructive/80` | `ring-2 ring-ring` | `opacity-50` | Spinner + disabled | — | — |
| Button (outline) | `border-primary/50` | `bg-primary/10 border-primary` | `bg-primary/20` | `ring-2 ring-ring` | `opacity-50` | Spinner + disabled | — | — |
| Button (ghost) | Transparent | `bg-primary/10` | `bg-primary/15` | `ring-2 ring-ring` | `opacity-50` | Spinner + disabled | — | — |
| Input | `border-input` | — | — | `ring-2 ring-ring` | `opacity-50 cursor-not-allowed` | — | `border-destructive ring-destructive/30` | `border-emerald-500 ring-emerald-500/30` |
| Textarea | Same as Input | — | — | Same | Same | — | Same | Same |
| Select | `border-input` | `bg-muted/50` | — | `ring-2 ring-ring` | `opacity-50` | — | `border-destructive` | — |
| Checkbox | `border-primary` | — | — | `ring-2 ring-ring` | `opacity-50` | — | — | — |
| Switch | `bg-input` | — | — | `ring-2 ring-ring` | `opacity-50` | — | — | — |
| Card | `bg-card border-border` | `border-primary/50 -translate-y-1` | — | — | `opacity-60` | Skeleton | — | — |
| Badge | Per variant | `opacity-80` | — | `ring-2 ring-ring` | — | — | — | — |
| Dialog | — | — | — | Focus trap | — | — | — | — |
| Toast | Auto-dismiss 5s | — | — | — | — | — | Destructive variant | — |

### 2.2 Hover Effect Standardization

| Effect | Class | Use Case |
|--------|-------|----------|
| Lift (small) | `hover:-translate-y-0.5 transition-transform duration-300` | Small interactive elements |
| Lift (medium) | `hover:-translate-y-1 transition-transform duration-300` | Cards, list items |
| Lift (large) | `hover:-translate-y-2 transition-transform duration-300` | Hero cards, featured items |
| Glow | `hover:shadow-[0_0_20px_hsl(187_94%_43%/0.2)]` | Primary action elements |
| Border brighten | `hover:border-primary/50` | Cards, containers |
| Background tint | `hover:bg-primary/10` | Ghost buttons, list items |
| Scale | `hover:scale-[1.02] transition-transform duration-300` | Images, avatars |

### 2.3 Transition Specifications

| Type | Duration | Easing | Properties | Tailwind Class |
|------|----------|--------|------------|----------------|
| Color change | 300ms | ease | `color`, `background-color`, `border-color` | `transition-colors duration-300` |
| Position/size | 300ms | ease-out | `transform` | `transition-transform duration-300` |
| Opacity | 200ms | ease | `opacity` | `transition-opacity duration-200` |
| All properties | 300ms | ease | All | `transition-all duration-300` |
| Dialog open | 200ms | ease-out | `opacity`, `transform` (zoom-in-95) | Via `tailwindcss-animate` |
| Dialog close | 150ms | ease-in | `opacity`, `transform` (zoom-out-95) | Via `tailwindcss-animate` |
| Sheet open | 500ms | ease-in-out | `transform` (slide-in) | Via `tailwindcss-animate` |
| Sheet close | 300ms | ease-in-out | `transform` (slide-out) | Via `tailwindcss-animate` |
| Page enter | 500ms | ease-out | `opacity`, `translateY` | `animate-fade-in` |
| Accordion | 200ms | ease-out | `height` | `animate-accordion-down` |

### 2.4 Error & Success States

**Form Field Error Pattern:**

```tsx
<div className="space-y-1.5">
  <Label className="text-destructive">Email</Label>
  <Input
    className="border-destructive focus-visible:ring-destructive/30"
    value="invalid-email"
  />
  <p className="text-xs text-destructive flex items-center gap-1">
    <AlertCircle className="w-3 h-3" />
    Please enter a valid email address
  </p>
</div>
```

**Form Field Success Pattern:**

```tsx
<div className="space-y-1.5">
  <Label className="text-emerald-500">Email</Label>
  <Input
    className="border-emerald-500 focus-visible:ring-emerald-500/30"
    value="user@example.com"
  />
  <p className="text-xs text-emerald-500 flex items-center gap-1">
    <CheckCircle className="w-3 h-3" />
    Email verified
  </p>
</div>
```

**Standard Error Messages:**

| Field Type | Error Message |
|------------|---------------|
| Required field | "This field is required" |
| Email | "Please enter a valid email address" |
| Password (min) | "Password must be at least 8 characters" |
| Password (match) | "Passwords do not match" |
| Number (range) | "Must be between {min} and {max}" |
| Select | "Please select an option" |
| File (size) | "File must be under {size}MB" |
| File (type) | "Only {types} files are accepted" |

---

## 3. Layout & Spacing System

### 3.1 Spacing Scale

Based on Tailwind's 4px base unit. Recommended usage contexts:

| Tailwind Class | Px | Rem | Recommended Usage |
|----------------|-----|------|-------------------|
| `0.5` | 2px | 0.125 | Hairline gaps, icon-text micro-spacing |
| `1` | 4px | 0.25 | Tight inline spacing |
| `1.5` | 6px | 0.375 | Badge padding, compact layouts |
| `2` | 8px | 0.5 | Small gaps between related items |
| `3` | 12px | 0.75 | Form field internal padding |
| `4` | 16px | 1 | Standard gap, component padding |
| `5` | 20px | 1.25 | Card internal padding |
| `6` | 24px | 1.5 | Section spacing (compact) |
| `8` | 32px | 2 | Between components |
| `10` | 40px | 2.5 | Major section spacing |
| `12` | 48px | 3 | Section vertical padding (mobile) |
| `16` | 64px | 4 | Section vertical padding (desktop) |
| `20` | 80px | 5 | Hero section padding |
| `24` | 96px | 6 | Large section vertical padding |

**Spacing Conventions:**

| Context | Spacing |
|---------|---------|
| Between form fields | `space-y-3` or `space-y-3.5` (12–14px) |
| Card internal padding | `p-5` or `p-6` (20–24px) |
| Section vertical padding | `py-12 md:py-16` or `py-16 md:py-24` |
| Container horizontal padding | `px-4` (16px, built into container) |
| Grid gaps (tight) | `gap-2` (8px) |
| Grid gaps (standard) | `gap-4` or `gap-6` (16–24px) |
| Grid gaps (loose) | `gap-8` (32px) |
| Between page sections | `space-y-8 md:space-y-12` |
| Button group gap | `gap-2` or `gap-3` |
| Icon-text gap | `gap-1.5` or `gap-2` |

### 3.2 Grid System

**Recommended Grid Configurations:**

| Layout | Mobile | Tablet (md) | Desktop (lg) | Wide (xl) |
|--------|--------|-------------|-------------|-----------|
| Card grid | 1 col | 2 col | 3 col | 4 col |
| Stat cards | 2 col | 4 col | 4 col | 4 col |
| Footer | 2 col | 3 col | 6 col | 6 col |
| Form fields | 1 col | 2 col | 2 col | 2 col |
| Category grid | 2 col | 3 col | 4 col | 6 col |
| Settings sidebar + content | Stack | Stack | Sidebar + main | Sidebar + main |

**Container:**

```css
max-width: 1400px (2xl breakpoint)
padding: 0 1rem (16px each side)
centering: auto margins
```

### 3.3 Z-Index Hierarchy

Formalized layer system to prevent stacking conflicts:

| Layer | Z-Index | CSS Variable (Suggested) | Elements |
|-------|---------|--------------------------|----------|
| Base | `auto` / `0` | `--z-base` | Page content, cards, sections |
| Elevated | `10` | `--z-elevated` | Floating elements within content, decorative orbs |
| Sticky | `20` | `--z-sticky` | Sticky elements within scrollable areas |
| Fixed | `30` | `--z-fixed` | Fixed position elements (reserved) |
| Header | `40` | `--z-header` | Sticky header/navigation |
| Overlay | `50` | `--z-overlay` | Dialog/Sheet overlays, backdrops |
| Modal | `50` | `--z-modal` | Dialog/Sheet content, dropdown menus |
| Tooltip | `50` | `--z-tooltip` | Tooltips, popovers |
| Toast | `100` | `--z-toast` | Toast notification viewport |

**Note:** Currently Header, Overlays, Modals, and Tooltips all share `z-50`. This works because Radix manages layering via portal injection. Separating into `z-40` (header) and `z-50` (overlays) would be cleaner.

### 3.4 Responsive Breakpoints

| Breakpoint | Min Width | Design Pattern |
|------------|-----------|----------------|
| Base (mobile) | 0px | Single column, stacked layout, full-width cards |
| `sm` | 640px | 2-column grids, slightly larger text |
| `md` | 768px | Side-by-side layouts, tablet-optimized padding |
| `lg` | 1024px | Desktop navigation visible, 3+ column grids, sidebar layouts |
| `xl` | 1280px | 4-column grids, wider content areas |
| `2xl` | 1400px | Container max-width reached |

**Mobile-First Strategy Rules:**

1. All base styles are mobile styles
2. Use `sm:`, `md:`, `lg:` etc. to progressively enhance
3. Navigation: mobile drawer (`Sheet`) for `< lg`, desktop dropdown for `>= lg`
4. Touch targets: minimum 44x44px on mobile (Tailwind `h-11 w-11`)
5. Hide non-essential elements on mobile with `hidden lg:block`

---

## 4. Iconography & Imagery Guidelines

### 4.1 Icon Set

**Library:** `lucide-react` v0.462.0

**Standardized Sizes:**

| Context | Size Class | Px | Stroke | Usage |
|---------|-----------|-----|--------|-------|
| Micro | `w-3 h-3` | 12px | 2px | Inline indicators, error icons next to text |
| Small | `w-3.5 h-3.5` | 14px | 2px | Breadcrumb separators, badge icons |
| Default | `w-4 h-4` | 16px | 2px | Button icons, form field icons, nav items |
| Medium | `w-5 h-5` | 20px | 2px | Header navigation, standalone actions |
| Large | `w-6 h-6` | 24px | 2px | Card action icons, feature highlights |
| XL | `w-8 h-8` | 32px | 2px | Card accent icons, empty states |
| Hero | `w-12 h-12` | 48px | 1.5px | Hero section features, step indicators |

**Icon Color Rules:**

| Context | Color |
|---------|-------|
| Default | `text-current` (inherits) |
| Muted/decorative | `text-muted-foreground` |
| Primary action | `text-primary` |
| Success | `text-emerald-500` |
| Warning | `text-amber-500` |
| Error | `text-destructive` |
| On dark background | `text-foreground` |
| On primary background | `text-primary-foreground` |

**Commonly Used Icons:**

| Category | Icons |
|----------|-------|
| Navigation | `Menu`, `X`, `ChevronDown`, `ChevronRight`, `ChevronLeft`, `ArrowLeft` |
| Session types | `MessageCircle` (chat), `Phone` (audio), `Video` (video) |
| Actions | `Send`, `Edit`, `Trash2`, `Download`, `Copy`, `Share2` |
| Status | `CheckCircle`, `AlertCircle`, `XCircle`, `Loader2`, `Clock` |
| User | `User`, `LogOut`, `Settings`, `Heart`, `Star`, `Bell` |
| Thematic | `MoonStar`, `Sun`, `Flame`, `Waves`, `Feather`, `BookOpen`, `Compass`, `Sparkles` |
| Financial | `CreditCard`, `DollarSign`, `Wallet` |

### 4.2 Image Treatment

**Avatar Images:**

| Property | Value |
|----------|-------|
| Shape | `rounded-full` (circle) |
| Default size | `h-10 w-10` (40px) |
| Large (profile) | `h-24 w-24` or `h-32 w-32` |
| Fallback | Initials on `bg-muted` background |
| Status ring | `ring-2 ring-offset-2 ring-offset-card` + status color ring |
| Loading | Skeleton circle with `animate-pulse` |

**Standard Avatar Sizes:**

| Context | Size | Class |
|---------|------|-------|
| Inline / list | 32px | `h-8 w-8` |
| Header / nav | 40px | `h-10 w-10` |
| Card header | 48–64px | `h-12 w-12` to `h-16 w-16` |
| Profile page | 96–128px | `h-24 w-24` to `h-32 w-32` |

**Card Images:**

| Property | Value |
|----------|-------|
| Aspect ratio | 16:9 for hero cards, 1:1 for square cards |
| Object fit | `object-cover` |
| Border radius | Matches card `rounded-xl` (top corners only: `rounded-t-xl`) |
| Fallback | Gradient background (`bg-gradient-to-br from-primary/20 to-secondary/20`) |
| Loading | Skeleton rectangle with `animate-pulse` |

**Broken Image Fallback:**

```tsx
<img
  src={advisor.avatar_url}
  alt={advisor.name}
  onError={(e) => {
    e.currentTarget.src = '/default-avatar.png';
  }}
/>
```

**Lazy Loading:**

All images below the fold should use `loading="lazy"`:

```tsx
<img loading="lazy" src={...} alt={...} />
```

### 4.3 Decorative Elements

| Element | Implementation | Location |
|---------|---------------|----------|
| Gradient orbs | `w-64 h-64 rounded-full blur-3xl opacity-20 bg-primary` | Hero section background |
| Animated stars | 1px–1.5px circles with `animate-twinkle` + random delays | Hero section |
| Connector lines | `h-px bg-gradient-to-r from-transparent via-border to-transparent` | How It Works steps |
| Glow effects | `box-shadow: 0 0 Xpx hsl(...)` | Status indicators, hero CTAs |
| Noise texture | CSS `background-image: url(noise.svg)` (optional) | Card backgrounds |

---

## 5. Accessibility (a11y) Guidelines

### 5.1 Contrast Ratios

Estimated contrast ratios for key color pairs (WCAG 2.1 requires 4.5:1 for normal text, 3:1 for large text):

| Foreground | Background | Pair | Estimated Ratio | WCAG AA | WCAG AAA |
|------------|------------|------|-----------------|---------|----------|
| `--foreground` (#f2eff7) | `--background` (#0f0b1a) | Primary text | ~16:1 | Pass | Pass |
| `--primary` (#07b5d3) | `--background` (#0f0b1a) | Headings/CTAs | ~7.5:1 | Pass | Pass |
| `--primary` (#07b5d3) | `--card` (#161029) | Primary on card | ~6:1 | Pass | Pass |
| `--muted-foreground` (#a89bbe) | `--background` (#0f0b1a) | Secondary text | ~5.5:1 | Pass | Borderline |
| `--muted-foreground` (#a89bbe) | `--card` (#161029) | Secondary on card | ~4.5:1 | Pass | Fail |
| `--primary-foreground` (#0e0a1b) | `--primary` (#07b5d3) | Text on buttons | ~6.5:1 | Pass | Pass |
| `--secondary-foreground` (#fff) | `--secondary` (#7c4dff) | Text on purple | ~4.6:1 | Pass | Fail |
| `--accent-foreground` (#0f0b1a) | `--accent` (#f59e0b) | Text on gold | ~8:1 | Pass | Pass |

**Action Items:**
- Verify all ratios with browser DevTools (computed colors may differ from estimates)
- `--muted-foreground` on `--card` is borderline — consider lightening to `270 20% 75%` for safer margin
- Test with a contrast checker tool (e.g., WebAIM, Polypane)

### 5.2 Focus Management

**Focus Ring Standard:**

All interactive elements use: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`

**Recommendations:**

1. **Use `focus-visible:` instead of `focus:`** — Already implemented on Button and Input. Audit other interactive elements (links, custom clickable divs) to ensure they use `focus-visible:` to avoid showing focus rings on mouse click.

2. **Skip-to-Content Link** — Add as first element in `<body>`:
   ```tsx
   <a
     href="#main-content"
     className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg"
   >
     Skip to content
   </a>
   ```

3. **Focus Trap in Modals** — Already handled by Radix Dialog/Sheet. Document that custom modals MUST use Radix Dialog or implement manual focus trapping.

4. **Focus Restoration** — When a modal closes, focus should return to the trigger element. Radix handles this automatically.

### 5.3 Screen Reader Notes

**Required ARIA Attributes by Component:**

| Component | Required ARIA | Example |
|-----------|--------------|---------|
| Icon-only Button | `aria-label` | `<Button size="icon" aria-label="Close">` |
| Status Badge | `role="status"` + `aria-label` | `<span role="status" aria-label="Advisor is online">` |
| Loading Spinner | `role="status"` + `aria-label` | `<Loader2 role="status" aria-label="Loading" />` |
| Toast Container | `role="region"` + `aria-label="Notifications"` | Already via Radix |
| Avatar Image | `alt` with name | `<img alt="Luna Starweaver" />` |
| Star Rating | `aria-label` | `<div aria-label="Rating: 4.7 out of 5 stars">` |
| Price | No special needs | Use `<span>` with visible text |
| Navigation | `<nav aria-label="Main navigation">` | Header component |
| Breadcrumb | `<nav aria-label="Breadcrumb">` | Breadcrumb component |
| Form Error | `aria-describedby` + `aria-invalid` | Link error message to input |

**Live Regions:**

```tsx
// Toast notifications
<div aria-live="polite" aria-atomic="true">
  {/* Toast content */}
</div>

// Loading states
<div aria-busy="true" aria-live="polite">
  Loading advisors...
</div>

// Session status changes
<div aria-live="assertive">
  Session connected
</div>
```

**Route Change Announcements:**

React Router doesn't announce route changes by default. Add a `RouteAnnouncer` component:

```tsx
function RouteAnnouncer() {
  const location = useLocation();
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const title = document.title;
    setAnnouncement(`Navigated to ${title}`);
  }, [location]);

  return (
    <div role="status" aria-live="assertive" aria-atomic="true" className="sr-only">
      {announcement}
    </div>
  );
}
```

### 5.4 Keyboard Navigation

**Already Handled (via Radix):**
- Dialog: `Escape` to close, `Tab` to cycle focusable elements
- Dropdown Menu: `Arrow keys` to navigate, `Enter` to select, `Escape` to close
- Tabs: `Arrow keys` to switch tabs
- Accordion: `Arrow keys` to navigate, `Enter`/`Space` to toggle
- Select: `Arrow keys`, `Enter` to select
- Sheet: `Escape` to close

**Needs Implementation:**
- **Mobile Menu:** Ensure `Escape` closes the sheet (already via Radix Sheet)
- **AdvisorCard:** Many interactive elements — ensure logical tab order (avatar → name link → favorite → chat → call → video → ai twin)
- **Search Modal:** Auto-focus search input on open
- **Session Pages:** Keyboard shortcuts for mute (`M`), end call (`E`), toggle camera (`C`) — consider as future enhancement

### 5.5 Additional Accessibility Checklist

- [ ] All images have descriptive `alt` text (not just "avatar" or "image")
- [ ] Color is never the sole indicator of meaning (always pair with icon or text)
- [ ] Touch targets are at least 44x44px on mobile
- [ ] Text can be resized to 200% without content loss (test `html { font-size: 200% }`)
- [ ] No content relies on animation for understanding (respect `prefers-reduced-motion`)
- [ ] Forms have visible labels (not just placeholders)
- [ ] Error messages are programmatically associated with inputs (`aria-describedby`)
- [ ] Page has a logical heading hierarchy (h1 → h2 → h3, no skipped levels)
- [ ] Language attribute set on `<html>` (`lang="en"`)
- [ ] Decorative images use `alt=""` or `aria-hidden="true"`

**Reduced Motion Support:**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Add to `src/index.css` to respect user motion preferences.
