# BASHIRI Design Token Migration Mapping - Phase 1

## Overview
This document maps legacy color tokens to the new BASHIRI design token system.

---

## NEW BASHIRI TOKENS (Phase 1)

### Brand Colors
- `--brand-primary: #D4AF37` - Gold identity, Logo, CTA, VIP
- `--brand-accent: #CFAF7B` - AI features, Confidence, Highlights, Active intelligence

### Foundation Colors
- `--background: #09090B` - Main background
- `--surface: #111218` - Cards, panels, elevated surfaces
- `--border: #2A2A2F` - Borders and dividers

### Text Colors
- `--text-primary: #F8FAFC` - Primary text, headings, important content
- `--text-secondary: #A1A1AA` - Secondary text, descriptions, labels

### Semantic Colors (State & Feedback)
- `--success: #22C55E` - Success states, completed, verified, positive
- `--danger: #EF4444` - Danger states, errors, destructive actions
- `--warning: #F59E0B` - Warning states, caution, attention needed
- `--info: #3B82F6` - Info states, neutral information

---

## LEGACY TOKENS → NEW TOKENS MAPPING

### Brand Colors Migration

| Legacy Token | Value | Context | New Token | Notes |
|-------------|-------|---------|-----------|-------|
| `--color-gold` | #F5A623 | Brand identity | `--brand-primary` | Value change: #F5A623 → #D4AF37 |
| `--color-gold-light` | #FFD54A | Brand highlights | `--brand-accent` | Value change: #FFD54A → #CFAF7B |
| `--color-gold-dark` | #D4891A | Brand dark | `--brand-primary` | Use opacity/darken utility |
| `--color-gold-glow` | rgba(245, 166, 35, 0.25) | Brand glow | Custom | Use with `--brand-primary` + opacity |

### Foundation Colors Migration

| Legacy Token | Value | Context | New Token | Notes |
|-------------|-------|---------|-----------|-------|
| `--color-background` | #0A0A0F | Main background | `--background` | Value change: #0A0A0F → #09090B |
| `--color-background-alt` | #050508 | Alt background | `--background` | Use darker variant |
| `--color-surface` | #111118 | Cards, panels | `--surface` | No change needed |
| `--color-surface-alt` | #1A1A24 | Alt surface | `--surface` | Use lighter variant |
| `--color-card` | #1A1A24 | Cards | `--surface` | No change needed |
| `--color-card-alt` | #22222E | Alt cards | `--surface` | Use lighter variant |
| `--color-border` | rgba(255, 255, 255, 0.08) | Borders | `--border` | Value change: rgba → #2A2A2F |
| `--color-border-hover` | rgba(255, 255, 255, 0.14) | Hover borders | `--border` | Use opacity variant |
| `--color-border-active` | rgba(245, 166, 35, 0.35) | Active borders | `--brand-primary` | Use with opacity |

### Text Colors Migration

| Legacy Token | Value | Context | New Token | Notes |
|-------------|-------|---------|-----------|-------|
| `--color-text-primary` | #F0F0F5 | Primary text | `--text-primary` | Value change: #F0F0F5 → #F8FAFC |
| `--color-text-secondary` | #C8C8D8 | Secondary text | `--text-secondary` | Value change: #C8C8D8 → #A1A1AA |
| `--color-text-tertiary` | #8B8BA7 | Tertiary text | `--text-secondary` | Use with lower opacity |
| `--color-text-muted` | #4A4A5C | Muted text | `--text-secondary` | Use with lower opacity |

### Semantic Colors Migration

| Legacy Token | Value | Context | New Token | Notes |
|-------------|-------|---------|-----------|-------|
| `--color-success` | #10B981 | Success states | `--success` | Value change: #10B981 → #22C55E |
| `--color-danger` | #FF2D2D | Danger states | `--danger` | Value change: #FF2D2D → #EF4444 |
| `--color-warning` | #F59E0B | Warning states | `--warning` | No change needed |
| `--color-info` | #3B82F6 | Info states | `--info` | No change needed |

### Decorative Colors (To be deprecated)

| Legacy Token | Value | Context | Migration Path |
|-------------|-------|---------|----------------|
| `--color-purple` | #8B5CF6 | Decorative accent | Deprecate - use semantic colors |
| `--color-purple-light` | #A78BFA | Decorative accent | Deprecate - use semantic colors |
| `--color-purple-dark` | #7C3AED | Decorative accent | Deprecate - use semantic colors |
| `--color-blue` | #3B82F6 | Decorative accent | Use `--info` |
| `--color-blue-light` | #60A5FA | Decorative accent | Use `--info` with opacity |
| `--color-green` | #10B981 | Mixed usage | **Context-dependent** |
| `--color-green-light` | #34D399 | Mixed usage | **Context-dependent** |
| `--color-red` | #FF2D2D | Mixed usage | Use `--danger` |
| `--color-red-light` | #F87171 | Mixed usage | Use `--danger` with opacity |
| `--color-red-glow` | rgba(255, 45, 45, 0.25) | Glow effect | Use `--danger` with opacity |

---

## CRITICAL MIGRATION RULES

### Green Color Confusion
The legacy `--color-green` (#10B981) is incorrectly used for both:
- **Brand/AI features** (confidence indicators, highlights)
- **Success states** (completed, verified, positive)

**Migration Rule:**
- AI Confidence → `--brand-accent` (#CFAF7B)
- Success states → `--success` (#22C55E)

### Gold Color Migration
The legacy `--color-gold` (#F5A623) will change to `--brand-primary` (#D4AF37).
This is a warmer, more premium gold shade.

**Impact:** All gold elements will shift from orange-gold to pure gold.

---

## HARDCODED COLORS FOUND

### #F5A623 (Legacy Gold)
**Occurrences:** 15+ files
**Usage:** Brand identity, confidence badges, buttons, highlights
**Migration:** `--brand-primary`

### #00FF87 (Neon Green)
**Occurrences:** 10+ files
**Usage:** AI confidence, success states, active indicators
**Migration:** 
- AI context → `--brand-accent`
- Success context → `--success`

### #10B981 (Emerald Green)
**Occurrences:** 8+ files
**Usage:** Confidence badges, success states, accuracy indicators
**Migration:**
- AI confidence → `--brand-accent`
- Success states → `--success`

### #8B5CF6 (Purple)
**Occurrences:** 5+ files
**Usage:** Decorative accents, evening recap notifications
**Migration:** Deprecate or use semantic colors

---

## PHASE 2 MIGRATION PLAN

1. Replace all `--color-*` variable usage with new tokens
2. Replace hardcoded HEX colors with CSS variables
3. Remove legacy tokens from globals.css
4. Update all components to use new token names
5. Test visual consistency across all pages

---

## RISKS & NOTES

### Color Value Changes
- Gold: #F5A623 → #D4AF37 (warmer, more premium)
- Success: #10B981 → #22C55E (standard green)
- Background: #0A0A0F → #09090B (slightly darker)

### Breaking Changes
- All components using legacy tokens will need updates
- Hardcoded colors need manual review for context
- Purple decorative colors will be deprecated

### Testing Required
- Visual regression testing for color changes
- Accessibility contrast ratio verification
- Dark mode consistency check
