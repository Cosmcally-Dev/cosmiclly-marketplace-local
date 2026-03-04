/**
 * Generates docs/UI_KIT_SUGGESTIONS.docx from structured content.
 *
 * Run: node scripts/generate-ui-kit-docx.js
 * Requires: npm install -D docx
 */

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  PageBreak,
  TableOfContents,
  StyleLevel,
} = require("docx");
const fs = require("fs");
const path = require("path");

// Brand colors (approximate RGB from HSL)
const COLORS = {
  primary: "07B5D3",       // Cyan/Turquoise
  secondary: "7C4DFF",     // Violet Purple
  accent: "F59E0B",        // Gold Amber
  background: "0F0B1A",    // Deep Purple
  foreground: "F2EFF7",    // Near White
  muted: "A89BBE",         // Muted text
  destructive: "EF4444",   // Red
  emerald: "10B981",       // Success green
  white: "FFFFFF",
  black: "000000",
  darkCard: "161029",      // Card background
  headerBg: "1A1042",      // Table header
};

// Reusable styles
function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, size: 36, color: COLORS.primary, font: "Calibri" })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, size: 28, color: COLORS.secondary, font: "Calibri" })],
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 24, color: COLORS.foreground, font: "Calibri" })],
  });
}

function bodyText(text) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 22, color: COLORS.black, font: "Calibri" })],
  });
}

function italicText(text) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 22, italics: true, color: COLORS.muted, font: "Calibri" })],
  });
}

function bulletPoint(text, bold_prefix = "") {
  const children = [];
  if (bold_prefix) {
    children.push(new TextRun({ text: bold_prefix, bold: true, size: 22, font: "Calibri" }));
  }
  children.push(new TextRun({ text, size: 22, font: "Calibri" }));
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children,
  });
}

function codeBlock(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    shading: { type: ShadingType.SOLID, color: "F3F4F6" },
    children: [new TextRun({ text, size: 20, font: "Consolas", color: COLORS.background })],
  });
}

function tableHeaderCell(text) {
  return new TableCell({
    shading: { type: ShadingType.SOLID, color: COLORS.headerBg },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 20, color: COLORS.foreground, font: "Calibri" })],
      }),
    ],
  });
}

function tableCell(text) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 20, color: COLORS.black, font: "Calibri" })],
      }),
    ],
  });
}

function createTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map(h => tableHeaderCell(h)),
      }),
      ...rows.map(
        row =>
          new TableRow({
            children: row.map(cell => tableCell(cell)),
          })
      ),
    ],
  });
}

function spacer() {
  return new Paragraph({ spacing: { after: 200 }, children: [] });
}

// === BUILD DOCUMENT ===

const doc = new Document({
  creator: "Cosmiclly UI Kit Generator",
  title: "Cosmiclly UI Kit - Suggested Improvements & Expansion",
  description: "Comprehensive UI Kit specification for the Cosmiclly spiritual reading platform",
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 22 },
      },
    },
  },
  sections: [
    // === COVER PAGE ===
    {
      properties: {},
      children: [
        new Paragraph({ spacing: { before: 2000 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "COSMICLLY", bold: true, size: 56, color: COLORS.primary, font: "Calibri" }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "UI Kit", bold: true, size: 48, color: COLORS.secondary, font: "Calibri" }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({
              text: "Suggested Improvements & Expansion",
              size: 28,
              color: COLORS.muted,
              font: "Calibri",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 600 },
          children: [
            new TextRun({
              text: "Comprehensive specification covering components, states, layout, iconography, and accessibility.",
              size: 22,
              italics: true,
              color: COLORS.muted,
              font: "Calibri",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 800 },
          children: [
            new TextRun({
              text: `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
              size: 20,
              color: COLORS.muted,
              font: "Calibri",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
          children: [
            new TextRun({
              text: "Tech Stack: React 18 + Vite + TypeScript + Tailwind CSS + Shadcn UI",
              size: 20,
              color: COLORS.muted,
              font: "Calibri",
            }),
          ],
        }),
      ],
    },

    // === TABLE OF CONTENTS ===
    {
      properties: {},
      children: [
        heading1("Table of Contents"),
        spacer(),
        bodyText("1. Component Library (The Building Blocks)"),
        bodyText("   1.1 Buttons"),
        bodyText("   1.2 Form Controls"),
        bodyText("   1.3 Navigation Elements"),
        bodyText("   1.4 Data Display"),
        bodyText("   1.5 Feedback & Alerts"),
        bodyText("2. States & Interactions"),
        bodyText("   2.1 Component State Matrix"),
        bodyText("   2.2 Hover Effects"),
        bodyText("   2.3 Transition Specifications"),
        bodyText("   2.4 Error & Success States"),
        bodyText("3. Layout & Spacing System"),
        bodyText("   3.1 Spacing Scale"),
        bodyText("   3.2 Grid System"),
        bodyText("   3.3 Z-Index Hierarchy"),
        bodyText("   3.4 Responsive Breakpoints"),
        bodyText("4. Iconography & Imagery Guidelines"),
        bodyText("   4.1 Icon Set"),
        bodyText("   4.2 Image Treatment"),
        bodyText("   4.3 Decorative Elements"),
        bodyText("5. Accessibility (a11y) Guidelines"),
        bodyText("   5.1 Contrast Ratios"),
        bodyText("   5.2 Focus Management"),
        bodyText("   5.3 Screen Reader Notes"),
        bodyText("   5.4 Keyboard Navigation"),
      ],
    },

    // === SECTION 1: COMPONENT LIBRARY ===
    {
      properties: {},
      children: [
        heading1("1. Component Library (The Building Blocks)"),
        bodyText(
          "Every reusable piece of the interface documented with all of its potential variations."
        ),
        spacer(),

        // 1.1 BUTTONS
        heading2("1.1 Buttons"),
        bodyText("The Button component uses class-variance-authority (CVA) for type-safe variant composition."),
        spacer(),

        heading3("Current Variants (9)"),
        createTable(
          ["Variant", "Visual", "Use Case"],
          [
            ["default", "Solid cyan background, dark text", "Primary CTAs (Submit, Connect, Start)"],
            ["destructive", "Solid red background, white text", "Dangerous actions (Delete, End Session)"],
            ["outline", "Cyan border, transparent background", "Secondary actions (Cancel, Back)"],
            ["secondary", "Solid violet background, white text", "Alternative primary actions"],
            ["ghost", "Transparent, cyan on hover", "Tertiary actions, toolbar buttons"],
            ["link", "Cyan text with underline on hover", "Navigation-style links"],
            ["hero", "Purple gradient with glow shadow", "Landing page CTAs"],
            ["gold", "Gold/amber solid with dark text", "Premium/special actions"],
            ["mystical", "Violet border + translucent tint", "Themed/mystical actions"],
          ]
        ),
        spacer(),

        heading3("Current Sizes (5)"),
        createTable(
          ["Size", "Height", "Padding", "Font Size"],
          [
            ["default", "40px (h-10)", "px-4 py-2", "14px (text-sm)"],
            ["sm", "36px (h-9)", "px-3", "14px (text-sm)"],
            ["lg", "48px (h-12)", "px-8", "16px (text-base)"],
            ["xl", "56px (h-14)", "px-10", "18px (text-lg)"],
            ["icon", "40x40px", "—", "—"],
          ]
        ),
        spacer(),

        heading3("Suggested New Variants"),
        createTable(
          ["Variant", "Styles", "Use Case"],
          [
            ["success", "bg-emerald-600 text-white hover:bg-emerald-500", "Confirmation actions (Save, Approve, Accept)"],
            ["warning", "bg-amber-500 text-dark hover:bg-amber-400", "Caution actions (Dismiss, Skip)"],
          ]
        ),
        spacer(),

        heading3("Suggested: Loading State Pattern"),
        bodyText("Add a loading prop to Button. When true: prepend Loader2 spinner, set disabled, add opacity-80."),
        codeBlock('<Button loading>Submit</Button>  →  renders spinner + "Submit" text + disabled state'),
        spacer(),

        heading3("Suggested: Button Group"),
        bodyText("Extract a ButtonGroup component for grouped related actions (e.g., Chat / Call / Video on AdvisorCard)."),
        bodyText("Styles: flex, first-child rounded-l, last-child rounded-r, shared borders between."),
        spacer(),

        heading3("Icon-Only Button Requirement"),
        bodyText("All icon-only buttons (size=\"icon\") MUST include aria-label for accessibility."),
        codeBlock('<Button size="icon" variant="ghost" aria-label="Close menu"><X /></Button>'),
        spacer(),

        // 1.2 FORM CONTROLS
        heading2("1.2 Form Controls"),
        heading3("Current Components"),
        createTable(
          ["Component", "File", "Specs"],
          [
            ["Input", "ui/input.tsx", "h-10, rounded-md, border-input, focus ring-2"],
            ["Textarea", "ui/textarea.tsx", "min-h-[80px], rounded-md, border-input"],
            ["Select", "ui/select.tsx", "Radix-based, focus cyan-500/10"],
            ["Checkbox", "ui/checkbox.tsx", "h-4 w-4, rounded-sm, Radix-based"],
            ["Switch", "ui/switch.tsx", "h-6 w-11, Radix-based"],
            ["Slider", "ui/slider.tsx", "h-5 w-5 thumb, primary track"],
            ["Date Picker", "ui/date-picker.tsx", "react-day-picker, dropdown year/month"],
            ["Time Picker", "ui/time-picker.tsx", "12h format, AM/PM, popover"],
            ["Form", "ui/form.tsx", "react-hook-form + Zod integration"],
          ]
        ),
        spacer(),

        heading3("Suggested New Components"),
        bulletPoint(" — Wraps Input with eye/eye-off toggle", "Password Input"),
        bulletPoint(" — Search icon prefix + clear X button + Escape to clear", "Search Input"),
        bulletPoint(" — Textarea wrapper showing '342 / 500' counter", "Character Counter Textarea"),
        bulletPoint(" — Radix primitive is installed but no UI component exists", "Radio Group"),
        bulletPoint(" — For session timers, file uploads, onboarding wizards", "Progress Bar"),
        bulletPoint(" — Number input with +/- increment buttons", "Number Input"),
        spacer(),

        heading3("Form Field States"),
        createTable(
          ["State", "Border", "Background", "Ring", "Label Color"],
          [
            ["Default", "border-input", "bg-background", "—", "text-foreground"],
            ["Placeholder", "border-input", "bg-background", "—", "—"],
            ["Filled", "border-input", "bg-background", "—", "text-foreground"],
            ["Focus", "border-primary", "bg-background", "ring-2 ring-ring", "text-primary"],
            ["Disabled", "border-input/50", "bg-muted/50", "—", "text-muted-foreground"],
            ["Error", "border-destructive", "bg-background", "ring-2 ring-destructive/30", "text-destructive"],
            ["Success", "border-emerald-500", "bg-background", "ring-2 ring-emerald-500/30", "text-emerald-500"],
          ]
        ),
        spacer(),

        heading3("Icon Placement in Inputs"),
        bodyText("Left icon: pl-10 on input, icon absolutely positioned left-3 top-1/2 -translate-y-1/2."),
        bodyText("Right icon: pr-10 on input, icon absolutely positioned right-3 top-1/2 -translate-y-1/2."),
        spacer(),

        // 1.3 NAVIGATION
        heading2("1.3 Navigation Elements"),
        heading3("Current Components"),
        bulletPoint(" — Sticky, role-based menus (client/advisor/admin), desktop dropdown + mobile Sheet", "Header"),
        bulletPoint(" — Shadcn Tabs with bg-muted list, shadow-sm active", "Tabs"),
        bulletPoint(" — Sheet-based left drawer for mobile", "Mobile Menu"),
        spacer(),

        heading3("Suggested New Components"),
        createTable(
          ["Component", "Description", "Key Specs"],
          [
            ["Breadcrumb", "Hierarchical navigation trail", "text-sm, muted text, ChevronRight separator, active item bold"],
            ["Pagination", "Page navigation for listings", "Ghost buttons for pages, outline for active, < > arrows"],
            ["Step Indicator", "Multi-step flow progress", "Dots/numbers connected by lines, primary=completed, glow=current, muted=upcoming"],
          ]
        ),
        spacer(),

        // 1.4 DATA DISPLAY
        heading2("1.4 Data Display"),
        heading3("Current Components"),
        bulletPoint(" — Admin data tables with overflow-auto wrapper", "Table"),
        bulletPoint(" — AdvisorCard (rich card with status, ratings, pricing, CTAs)", "Card"),
        bulletPoint(" — Radix-based with fallback initials", "Avatar"),
        bulletPoint(" — 4 variants (default, secondary, destructive, outline)", "Badge"),
        spacer(),

        heading3("Suggested New Components"),
        createTable(
          ["Component", "Description", "Visual Spec"],
          [
            ["Stat Card", "Dashboard metric display", "bg-card rounded-xl p-5, icon in bg-primary/10 rounded-lg, trend arrow"],
            ["Empty State", "No-data placeholder", "Centered, w-12 h-12 icon, title text-lg, description text-sm, optional CTA button"],
            ["Star Rating", "Rating display with count", "Filled/half/empty stars in amber-400, count text in muted-foreground"],
            ["Price Display", "Price with optional discount", "Original crossed out in muted, discounted in primary font-bold"],
            ["Avatar Group", "Overlapping avatar stack", "Negative margin overlap, +N counter circle at end"],
          ]
        ),
        spacer(),

        heading3("Badge — Suggested Additional Variants"),
        createTable(
          ["Variant", "Use Case", "Styles"],
          [
            ["accent", "Gold/premium badges", "bg-accent text-accent-foreground"],
            ["success", "Completed/active", "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"],
            ["warning", "Pending/attention", "bg-amber-500/20 text-amber-400 border-amber-500/30"],
            ["online", "Online status", "bg-emerald-500/20 text-emerald-400 + dot indicator"],
            ["busy", "Busy status", "bg-amber-500/20 text-amber-400 + dot indicator"],
            ["offline", "Offline status", "bg-muted text-muted-foreground + dot indicator"],
          ]
        ),
        spacer(),

        // 1.5 FEEDBACK & ALERTS
        heading2("1.5 Feedback & Alerts"),
        heading3("Current Components"),
        bulletPoint(" — Radix-based centered modal with zoom animation", "Dialog"),
        bulletPoint(" — Side drawer panel (top/right/bottom/left)", "Sheet"),
        bulletPoint(" — Sonner library + legacy Radix toast", "Toast/Sonner"),
        bulletPoint(" — Radix tooltip with zoom-in-95 animation", "Tooltip"),
        bulletPoint(" — animate-pulse bg-muted placeholder", "Skeleton"),
        bulletPoint(" — Ad-hoc Loader2 animate-spin", "Loading Spinner"),
        spacer(),

        heading3("Suggested New Components"),

        bodyText("Alert Banner — Inline notification for page-level messages:"),
        createTable(
          ["Variant", "Icon", "Border", "Background"],
          [
            ["info", "Info", "border-primary/30", "bg-primary/5"],
            ["success", "CheckCircle", "border-emerald-500/30", "bg-emerald-500/5"],
            ["warning", "AlertTriangle", "border-amber-500/30", "bg-amber-500/5"],
            ["error", "XCircle", "border-destructive/30", "bg-destructive/5"],
          ]
        ),
        spacer(),

        bodyText("Confirmation Dialog — Standardized confirm/cancel pattern with destructive variant support."),
        spacer(),

        bodyText("Notification Badge — Red circle counter positioned absolute -top-1.5 -right-1.5. Shows nothing when count is 0."),
        spacer(),

        bodyText("Toast Variants — Add left border accent per type:"),
        createTable(
          ["Variant", "Icon", "Border Accent"],
          [
            ["success", "CheckCircle (emerald)", "border-l-4 border-emerald-500"],
            ["error", "XCircle (red)", "border-l-4 border-destructive"],
            ["warning", "AlertTriangle (amber)", "border-l-4 border-amber-500"],
            ["info", "Info (cyan)", "border-l-4 border-primary"],
          ]
        ),
        spacer(),

        bodyText("Standardized Spinner — Three sizes: sm (h-4 w-4), md (h-6 w-6), lg (h-8 w-8). Uses Loader2 with animate-spin."),
        spacer(),

        bodyText("Skeleton Variants Needed:"),
        createTable(
          ["Skeleton", "Matches Component"],
          [
            ["AdvisorCardSkeleton", "AdvisorCard (already exists)"],
            ["ProfileHeaderSkeleton", "Profile page header"],
            ["SessionPageSkeleton", "Chat/Call/Video connecting state"],
            ["ActivityRowSkeleton", "Activity list row"],
            ["TransactionRowSkeleton", "Transaction list row"],
            ["StatCardSkeleton", "Admin stat cards"],
          ]
        ),
        spacer(),
      ],
    },

    // === SECTION 2: STATES & INTERACTIONS ===
    {
      properties: {},
      children: [
        heading1("2. States & Interactions"),
        bodyText(
          "Every interactive component must have its states defined. A static design doesn't translate well to a dynamic interface."
        ),
        spacer(),

        heading2("2.1 Component State Matrix"),
        createTable(
          ["Component", "Default", "Hover", "Focus", "Disabled", "Loading", "Error"],
          [
            ["Button (default)", "bg-primary", "bg-primary/90", "ring-2 ring-ring", "opacity-50", "Spinner + disabled", "—"],
            ["Button (destructive)", "bg-destructive", "bg-destructive/90", "ring-2 ring-ring", "opacity-50", "Spinner + disabled", "—"],
            ["Button (outline)", "border-primary/50", "bg-primary/10 border-primary", "ring-2 ring-ring", "opacity-50", "Spinner + disabled", "—"],
            ["Button (ghost)", "Transparent", "bg-primary/10", "ring-2 ring-ring", "opacity-50", "Spinner + disabled", "—"],
            ["Input", "border-input", "—", "ring-2 ring-ring", "opacity-50, no-cursor", "—", "border-destructive"],
            ["Select", "border-input", "bg-muted/50", "ring-2 ring-ring", "opacity-50", "—", "border-destructive"],
            ["Card", "bg-card border-border", "-translate-y-1, border-primary/50", "—", "opacity-60", "Skeleton", "—"],
            ["Badge", "Per variant", "opacity-80", "ring-2 ring-ring", "—", "—", "—"],
          ]
        ),
        spacer(),

        heading2("2.2 Hover Effects"),
        createTable(
          ["Effect", "Class", "Use Case"],
          [
            ["Lift (small)", "hover:-translate-y-0.5 transition-transform duration-300", "Small interactive elements"],
            ["Lift (medium)", "hover:-translate-y-1 transition-transform duration-300", "Cards, list items"],
            ["Lift (large)", "hover:-translate-y-2 transition-transform duration-300", "Hero cards, featured items"],
            ["Glow", "hover:shadow-[0_0_20px_hsl(187_94%_43%/0.2)]", "Primary action elements"],
            ["Border brighten", "hover:border-primary/50", "Cards, containers"],
            ["Background tint", "hover:bg-primary/10", "Ghost buttons, list items"],
            ["Scale", "hover:scale-[1.02] transition-transform duration-300", "Images, avatars"],
          ]
        ),
        spacer(),

        heading2("2.3 Transition Specifications"),
        createTable(
          ["Type", "Duration", "Easing", "Properties"],
          [
            ["Color change", "300ms", "ease", "color, background-color, border-color"],
            ["Position/size", "300ms", "ease-out", "transform"],
            ["Opacity", "200ms", "ease", "opacity"],
            ["All properties", "300ms", "ease", "all"],
            ["Dialog open", "200ms", "ease-out", "opacity, transform (zoom-in-95)"],
            ["Dialog close", "150ms", "ease-in", "opacity, transform (zoom-out-95)"],
            ["Sheet open", "500ms", "ease-in-out", "transform (slide-in)"],
            ["Sheet close", "300ms", "ease-in-out", "transform (slide-out)"],
            ["Page enter", "500ms", "ease-out", "opacity, translateY (animate-fade-in)"],
            ["Accordion", "200ms", "ease-out", "height"],
          ]
        ),
        spacer(),

        heading2("2.4 Error & Success States"),
        heading3("Form Field Error Pattern"),
        bodyText("Label turns text-destructive. Input gets border-destructive and ring-destructive/30 on focus."),
        bodyText("Error message below: text-xs text-destructive with AlertCircle icon (w-3 h-3)."),
        spacer(),

        heading3("Form Field Success Pattern"),
        bodyText("Label turns text-emerald-500. Input gets border-emerald-500 and ring-emerald-500/30 on focus."),
        bodyText("Success message below: text-xs text-emerald-500 with CheckCircle icon (w-3 h-3)."),
        spacer(),

        heading3("Standard Error Messages"),
        createTable(
          ["Field Type", "Error Message"],
          [
            ["Required", "This field is required"],
            ["Email", "Please enter a valid email address"],
            ["Password (min)", "Password must be at least 8 characters"],
            ["Password (match)", "Passwords do not match"],
            ["Number (range)", "Must be between {min} and {max}"],
            ["Select", "Please select an option"],
            ["File (size)", "File must be under {size}MB"],
            ["File (type)", "Only {types} files are accepted"],
          ]
        ),
        spacer(),
      ],
    },

    // === SECTION 3: LAYOUT & SPACING ===
    {
      properties: {},
      children: [
        heading1("3. Layout & Spacing System"),
        bodyText("Consistent spacing is what makes a UI look professional and polished."),
        spacer(),

        heading2("3.1 Spacing Scale"),
        bodyText("Based on Tailwind's 4px base unit. All spacing values should come from this scale."),
        createTable(
          ["Tailwind", "Pixels", "Rem", "Recommended Usage"],
          [
            ["0.5", "2px", "0.125", "Hairline gaps, icon-text micro-spacing"],
            ["1", "4px", "0.25", "Tight inline spacing"],
            ["1.5", "6px", "0.375", "Badge padding, compact layouts"],
            ["2", "8px", "0.5", "Small gaps between related items"],
            ["3", "12px", "0.75", "Form field internal padding"],
            ["4", "16px", "1", "Standard gap, component padding"],
            ["5", "20px", "1.25", "Card internal padding"],
            ["6", "24px", "1.5", "Section spacing (compact)"],
            ["8", "32px", "2", "Between components"],
            ["10", "40px", "2.5", "Major section spacing"],
            ["12", "48px", "3", "Section vertical padding (mobile)"],
            ["16", "64px", "4", "Section vertical padding (desktop)"],
            ["20", "80px", "5", "Hero section padding"],
            ["24", "96px", "6", "Large section vertical padding"],
          ]
        ),
        spacer(),

        heading3("Spacing Conventions"),
        createTable(
          ["Context", "Spacing"],
          [
            ["Between form fields", "space-y-3 or space-y-3.5 (12-14px)"],
            ["Card internal padding", "p-5 or p-6 (20-24px)"],
            ["Section vertical padding", "py-12 md:py-16 or py-16 md:py-24"],
            ["Container horizontal padding", "px-4 (16px, built into container)"],
            ["Grid gaps (tight)", "gap-2 (8px)"],
            ["Grid gaps (standard)", "gap-4 or gap-6 (16-24px)"],
            ["Grid gaps (loose)", "gap-8 (32px)"],
            ["Between page sections", "space-y-8 md:space-y-12"],
            ["Button group gap", "gap-2 or gap-3"],
            ["Icon-text gap", "gap-1.5 or gap-2"],
          ]
        ),
        spacer(),

        heading2("3.2 Grid System"),
        createTable(
          ["Layout", "Mobile", "Tablet (md)", "Desktop (lg)", "Wide (xl)"],
          [
            ["Card grid", "1 col", "2 col", "3 col", "4 col"],
            ["Stat cards", "2 col", "4 col", "4 col", "4 col"],
            ["Footer", "2 col", "3 col", "6 col", "6 col"],
            ["Form fields", "1 col", "2 col", "2 col", "2 col"],
            ["Category grid", "2 col", "3 col", "4 col", "6 col"],
          ]
        ),
        spacer(),
        bodyText("Container: max-width 1400px (2xl breakpoint), padding 0 1rem, auto margins."),
        spacer(),

        heading2("3.3 Z-Index Hierarchy"),
        createTable(
          ["Layer", "Z-Index", "Suggested CSS Var", "Elements"],
          [
            ["Base", "auto / 0", "--z-base", "Page content, cards, sections"],
            ["Elevated", "10", "--z-elevated", "Floating elements, decorative orbs"],
            ["Sticky", "20", "--z-sticky", "Sticky elements within scrollable areas"],
            ["Fixed", "30", "--z-fixed", "Fixed position elements (reserved)"],
            ["Header", "40", "--z-header", "Sticky header/navigation"],
            ["Overlay", "50", "--z-overlay", "Dialog/Sheet backdrops"],
            ["Modal", "50", "--z-modal", "Dialog/Sheet content, dropdowns"],
            ["Tooltip", "50", "--z-tooltip", "Tooltips, popovers"],
            ["Toast", "100", "--z-toast", "Toast notification viewport"],
          ]
        ),
        spacer(),

        heading2("3.4 Responsive Breakpoints"),
        createTable(
          ["Breakpoint", "Min Width", "Design Pattern"],
          [
            ["Base (mobile)", "0px", "Single column, stacked layout, full-width cards"],
            ["sm", "640px", "2-column grids, slightly larger text"],
            ["md", "768px", "Side-by-side layouts, tablet padding"],
            ["lg", "1024px", "Desktop nav, 3+ column grids, sidebar layouts"],
            ["xl", "1280px", "4-column grids, wider content areas"],
            ["2xl", "1400px", "Container max-width reached"],
          ]
        ),
        spacer(),

        heading3("Mobile-First Rules"),
        bulletPoint("All base styles are mobile styles"),
        bulletPoint("Use sm:, md:, lg: to progressively enhance for larger screens"),
        bulletPoint("Navigation: mobile Sheet drawer for < lg, desktop dropdown for >= lg"),
        bulletPoint("Touch targets: minimum 44x44px on mobile (h-11 w-11)"),
        bulletPoint("Hide non-essential elements on mobile with hidden lg:block"),
        spacer(),
      ],
    },

    // === SECTION 4: ICONOGRAPHY & IMAGERY ===
    {
      properties: {},
      children: [
        heading1("4. Iconography & Imagery Guidelines"),
        spacer(),

        heading2("4.1 Icon Set"),
        bodyText("Library: lucide-react v0.462.0. Default stroke weight: 2px. Color: currentColor (inherits)."),
        spacer(),

        heading3("Standardized Sizes"),
        createTable(
          ["Context", "Size Class", "Pixels", "Usage"],
          [
            ["Micro", "w-3 h-3", "12px", "Inline indicators, error icons next to text"],
            ["Small", "w-3.5 h-3.5", "14px", "Breadcrumb separators, badge icons"],
            ["Default", "w-4 h-4", "16px", "Button icons, form field icons, nav items"],
            ["Medium", "w-5 h-5", "20px", "Header navigation, standalone actions"],
            ["Large", "w-6 h-6", "24px", "Card action icons, feature highlights"],
            ["XL", "w-8 h-8", "32px", "Card accent icons, empty states"],
            ["Hero", "w-12 h-12", "48px", "Hero section features, step indicators"],
          ]
        ),
        spacer(),

        heading3("Icon Color Rules"),
        createTable(
          ["Context", "Color"],
          [
            ["Default", "text-current (inherits)"],
            ["Muted/decorative", "text-muted-foreground"],
            ["Primary action", "text-primary"],
            ["Success", "text-emerald-500"],
            ["Warning", "text-amber-500"],
            ["Error", "text-destructive"],
            ["On dark background", "text-foreground"],
            ["On primary background", "text-primary-foreground"],
          ]
        ),
        spacer(),

        heading2("4.2 Image Treatment"),
        heading3("Avatar Sizes"),
        createTable(
          ["Context", "Size", "Class"],
          [
            ["Inline / list", "32px", "h-8 w-8"],
            ["Header / nav", "40px", "h-10 w-10"],
            ["Card header", "48-64px", "h-12 w-12 to h-16 w-16"],
            ["Profile page", "96-128px", "h-24 w-24 to h-32 w-32"],
          ]
        ),
        spacer(),

        heading3("Avatar Specs"),
        bulletPoint("Shape: rounded-full (circle)"),
        bulletPoint("Fallback: Initials on bg-muted background"),
        bulletPoint("Status ring: ring-2 ring-offset-2 ring-offset-card + status color"),
        bulletPoint("Loading: Skeleton circle with animate-pulse"),
        spacer(),

        heading3("Card Images"),
        bulletPoint("Aspect ratio: 16:9 for hero cards, 1:1 for square cards"),
        bulletPoint("Object fit: object-cover"),
        bulletPoint("Border radius: Matches card rounded-xl (top corners only: rounded-t-xl)"),
        bulletPoint("Fallback: Gradient background (bg-gradient-to-br from-primary/20 to-secondary/20)"),
        bulletPoint("Loading: Skeleton rectangle with animate-pulse"),
        bulletPoint("Below-fold images: loading=\"lazy\" attribute"),
        spacer(),

        heading2("4.3 Decorative Elements"),
        createTable(
          ["Element", "Implementation", "Location"],
          [
            ["Gradient orbs", "w-64 h-64 rounded-full blur-3xl opacity-20 bg-primary", "Hero section background"],
            ["Animated stars", "1px-1.5px circles with animate-twinkle + random delays", "Hero section"],
            ["Connector lines", "h-px bg-gradient-to-r from-transparent via-border to-transparent", "How It Works steps"],
            ["Glow effects", "box-shadow: 0 0 Xpx hsl(...)", "Status indicators, hero CTAs"],
          ]
        ),
        spacer(),
      ],
    },

    // === SECTION 5: ACCESSIBILITY ===
    {
      properties: {},
      children: [
        heading1("5. Accessibility (a11y) Guidelines"),
        spacer(),

        heading2("5.1 Contrast Ratios"),
        bodyText(
          "WCAG 2.1 requires 4.5:1 for normal text and 3:1 for large text (18px+ or 14px+ bold)."
        ),
        createTable(
          ["Foreground", "Background", "Est. Ratio", "WCAG AA", "WCAG AAA"],
          [
            ["--foreground (#f2eff7)", "--background (#0f0b1a)", "~16:1", "Pass", "Pass"],
            ["--primary (#07b5d3)", "--background (#0f0b1a)", "~7.5:1", "Pass", "Pass"],
            ["--primary (#07b5d3)", "--card (#161029)", "~6:1", "Pass", "Pass"],
            ["--muted-foreground (#a89bbe)", "--background (#0f0b1a)", "~5.5:1", "Pass", "Borderline"],
            ["--muted-foreground (#a89bbe)", "--card (#161029)", "~4.5:1", "Pass", "Fail"],
            ["--primary-foreground (#0e0a1b)", "--primary (#07b5d3)", "~6.5:1", "Pass", "Pass"],
            ["--secondary-foreground (#fff)", "--secondary (#7c4dff)", "~4.6:1", "Pass", "Fail"],
            ["--accent-foreground (#0f0b1a)", "--accent (#f59e0b)", "~8:1", "Pass", "Pass"],
          ]
        ),
        spacer(),

        heading3("Action Items"),
        bulletPoint("Verify all ratios with browser DevTools computed colors"),
        bulletPoint("--muted-foreground on --card is borderline - consider lightening to 270 20% 75%"),
        bulletPoint("Test with contrast checker (WebAIM, Polypane, Chrome DevTools)"),
        spacer(),

        heading2("5.2 Focus Management"),
        heading3("Focus Ring Standard"),
        bodyText("All interactive elements: focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"),
        spacer(),

        heading3("Recommendations"),
        bulletPoint("Use focus-visible: instead of focus: to avoid rings on mouse click"),
        bulletPoint("Add skip-to-content link as first element in body (sr-only, visible on focus)"),
        bulletPoint("Custom modals MUST use Radix Dialog or implement manual focus trapping"),
        bulletPoint("Focus should return to trigger element when modal closes (Radix handles this)"),
        spacer(),

        heading2("5.3 Screen Reader Notes"),
        heading3("Required ARIA Attributes"),
        createTable(
          ["Component", "Required ARIA", "Example"],
          [
            ["Icon-only Button", "aria-label", '<Button aria-label="Close">'],
            ["Status Badge", "role=\"status\" + aria-label", '<span role="status" aria-label="Online">'],
            ["Loading Spinner", "role=\"status\" + aria-label", '<Loader2 role="status" aria-label="Loading">'],
            ["Avatar Image", "alt with name", '<img alt="Luna Starweaver">'],
            ["Star Rating", "aria-label", '<div aria-label="Rating: 4.7 out of 5">'],
            ["Navigation", "nav + aria-label", '<nav aria-label="Main navigation">'],
            ["Breadcrumb", "nav + aria-label", '<nav aria-label="Breadcrumb">'],
            ["Form Error", "aria-describedby + aria-invalid", "Link error message to input"],
          ]
        ),
        spacer(),

        heading3("Live Regions"),
        bulletPoint("Toast notifications: aria-live=\"polite\" aria-atomic=\"true\""),
        bulletPoint("Loading states: aria-busy=\"true\" aria-live=\"polite\""),
        bulletPoint("Session status changes: aria-live=\"assertive\""),
        bulletPoint("Route changes: Add RouteAnnouncer component with role=\"status\" aria-live=\"assertive\""),
        spacer(),

        heading2("5.4 Keyboard Navigation"),
        heading3("Handled by Radix"),
        bulletPoint("Dialog: Escape to close, Tab to cycle, focus trap"),
        bulletPoint("Dropdown Menu: Arrow keys to navigate, Enter to select, Escape to close"),
        bulletPoint("Tabs: Arrow keys to switch"),
        bulletPoint("Accordion: Arrow keys to navigate, Enter/Space to toggle"),
        bulletPoint("Select: Arrow keys, Enter to select"),
        bulletPoint("Sheet: Escape to close"),
        spacer(),

        heading3("Needs Implementation"),
        bulletPoint("AdvisorCard: Ensure logical tab order across many interactive elements"),
        bulletPoint("Search Modal: Auto-focus search input on open"),
        bulletPoint("Session shortcuts (future): M=mute, E=end, C=camera toggle"),
        spacer(),

        heading2("5.5 Additional Checklist"),
        bulletPoint("All images have descriptive alt text"),
        bulletPoint("Color is never the sole meaning indicator (pair with icon/text)"),
        bulletPoint("Touch targets >= 44x44px on mobile"),
        bulletPoint("Text resizable to 200% without content loss"),
        bulletPoint("Respect prefers-reduced-motion media query"),
        bulletPoint("Forms have visible labels (not just placeholders)"),
        bulletPoint("Error messages programmatically linked via aria-describedby"),
        bulletPoint("Logical heading hierarchy (h1 > h2 > h3, no skips)"),
        bulletPoint("lang=\"en\" on <html> element"),
        bulletPoint("Decorative images use alt=\"\" or aria-hidden=\"true\""),
        spacer(),

        heading3("Reduced Motion Support"),
        bodyText("Add to src/index.css to respect user preferences:"),
        codeBlock("@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }"),
        spacer(),
      ],
    },
  ],
});

// === WRITE FILE ===
const outputPath = path.join(__dirname, "..", "docs", "UI_KIT_SUGGESTIONS.docx");

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated: ${outputPath}`);
  console.log(`File size: ${(buffer.length / 1024).toFixed(1)} KB`);
});
