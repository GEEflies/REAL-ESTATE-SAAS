# Hidden Features Documentation

This document contains information about features that have been temporarily hidden from the user interface for MVP launch. The features are still in the codebase but are not visible to customers.

## Overview

For the initial launch, we've simplified the feature set to avoid overwhelming new users. The hidden features can be re-enabled in the future by uncommenting the relevant code.

---

## Hidden Features

### 1. Full Enhance (`full`)
**Purpose:** Applies all enhancements at once for professional results.

**Translations:**
- English: "Full Enhance" - "Apply all enhancements at once for professional results"
- Slovak: "Kompletné Vylepšenie" - "Použije všetko naraz pre profi výsledky"

**Icon:** `Sparkles`

**Original Code (enhance pages):**
```typescript
{ id: 'full', icon: Sparkles, label: t('modes.full.label'), description: t('modes.full.description'), bgGradient: 'from-purple-50 to-indigo-50', borderColor: 'border-purple-200' },
```

---

### 2. Relighting (`relighting`)
**Purpose:** Balance brightness throughout the image evenly.

**Translations:**
- English: "Relighting" - "Balance brightness throughout the image evenly"
- Slovak: "Nasvietenie" - "Rovnomerne vyváži jas v celom obrázku"

**Icon:** `Lightbulb`

**Original Code (enhance pages):**
```typescript
{ id: 'relighting', icon: Lightbulb, label: t('modes.relighting.label'), description: t('modes.relighting.description'), bgGradient: 'from-yellow-50 to-amber-50', borderColor: 'border-yellow-100' },
```

**Original Code (landing page features):**
```typescript
{
  key: 'relighting',
  before: '/landing/relighting/religh-before.jpg',
  after: '/landing/relighting/religh-after.jpg',
},
```

---

### 3. RAW Quality (`raw_quality`)
**Purpose:** Enhance image to sharp 4K resolution with details.

**Translations:**
- English: "RAW Quality" - "Enhance image to sharp 4K resolution with details"
- Slovak: "RAW Kvalita" - "Vylepší obrázok na ostré 4K rozlíšenie s detailmi"

**Icon:** `Camera`

**Original Code (enhance pages):**
```typescript
{ id: 'raw_quality', icon: Camera, label: t('modes.raw_quality.label'), description: t('modes.raw_quality.description'), bgGradient: 'from-emerald-50 to-green-50', borderColor: 'border-emerald-100' },
```

**Original Code (landing page features):**
```typescript
{
  key: 'raw',
  before: '/landing/raw/raw-before.jpg',
  after: '/landing/raw/raw-after.jpg',
},
```

---

### 4. Color Fix (`color`)
**Purpose:** Make colors pop and look more vibrant and appealing.

**Translations:**
- English: "Color Fix" - "Make colors pop and look more vibrant and appealing"
- Slovak: "Oprava Farieb" - "Zvýrazní farby pre živší a príťažlivejší vzhľad"

**Icon:** `Palette`

**Original Code (enhance pages):**
```typescript
{ id: 'color', icon: Palette, label: t('modes.color.label'), description: t('modes.color.description'), bgGradient: 'from-violet-50 to-purple-50', borderColor: 'border-violet-100' },
```

**Original Code (landing page features):**
```typescript
{
  key: 'colorCorrection',
  before: '/landing/color correction/cc-before.jpg',
  after: '/landing/color correction/cc-after.jpg',
},
```

---

## Files Modified

1. **Landing Page Features:** `app/[locale]/page.tsx` (lines 43-65)
2. **Landing Page Enhance:** `app/[locale]/enhance/page.tsx` (lines 115-129)
3. **Dashboard Enhance:** `app/[locale]/dashboard/enhance/page.tsx` (lines 90-104)
4. **Mode Selector Component:** `components/EnhanceModeSelector.tsx` (type definition and disabled handling)
5. **English Translations:** `messages/en.json` (added `coming_soon` key)
6. **Slovak Translations:** `messages/sk.json` (added `coming_soon` key)

---

## How to Re-enable Features

### Step 1: Uncomment the feature in the landing page features array
In `app/[locale]/page.tsx`, uncomment the relevant feature object(s).

### Step 2: Uncomment the mode in enhance pages
In both `app/[locale]/enhance/page.tsx` and `app/[locale]/dashboard/enhance/page.tsx`, uncomment the relevant mode object(s) from the `ENHANCE_MODES` array.

### Step 3: (Optional) Remove the "Coming Soon" option
If all features are re-enabled, you may want to remove the `coming_soon` mode from both enhance pages.

---

## "Coming Soon" Placeholder

A "Coming Soon" option has been added to the enhance mode dropdown to indicate that more features will be added later. This option:
- Is visible but grayed out
- Has a dashed border
- Is not clickable/selectable
- Shows in both English and Slovak

To remove this placeholder, remove the `coming_soon` entry from the `ENHANCE_MODES` arrays in both enhance page files.
