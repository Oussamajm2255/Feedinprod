# 🎨 Stitch AI Mockup Prompt – TerraFlow Sensor Readings

## Project Context
**Name:** TerraFlow – Sensor Readings Dashboard  
**Style:** Modern, clean, data-dense master–detail interface  
**Goal:** Real-time IoT sensor monitoring with stunning visuals

---

## 🎯 Deliverables

Create **4 artboards** (light mode only):

1. **Desktop (1440×900)** – Full master–detail layout
2. **Tablet (1024×768)** – Adjusted grid, narrower panels
3. **Mobile (390×844)** – Stacked layout, bottom drawer
4. **Detail View Close-up (800×1200)** – Focus on right panel with chart

---

## 🎨 Design System

### Color Palette
- **Primary Gradient:** `#667eea` → `#764ba2` (vibrant purple)
- **Success/Normal:** `#10b981` (emerald green)
- **Warning:** `#f59e0b` (amber)
- **Critical:** `#ef4444` (red)
- **Offline/Inactive:** `#6b7280` (cool gray)
- **Background:** `#f8f9ff` (very light lavender) → `#ffffff` (white)
- **Text Primary:** `#1f2937` (charcoal)
- **Text Secondary:** `#6b7280` (gray)

### Typography
- **Font:** Inter, SF Pro, or Roboto
- **Sizes:** 28px (hero), 20px (headings), 16px (body), 14px (captions), 12px (labels)
- **Weights:** 700 (bold), 600 (semibold), 500 (medium), 400 (regular)

### Spacing Scale
- 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px

### Border Radius
- Small: 8px
- Medium: 12px–16px
- Large: 20px–24px
- Pill: 999px

### Shadows
- **Soft:** `0 4px 16px rgba(0,0,0,0.04)`
- **Medium:** `0 8px 24px rgba(102,126,234,0.12)`
- **Floating:** `0 12px 32px rgba(0,0,0,0.08)`

### Effects
- **Glassmorphism:** `backdrop-filter: blur(20px)`, semi-transparent backgrounds
- **Gradients:** Linear gradients for primary surfaces, cards, badges
- **Animations:** Subtle hover lifts (4px translateY), smooth 0.3s transitions

---

## 📐 Layout Structure

### Header (Sticky, Compact)
**Height:** 80–100px  
**Background:** Purple gradient (`#667eea` → `#764ba2`) with glassmorphism  
**Border Radius:** 0 0 24px 24px (rounded bottom corners)

**Content (left to right):**
1. **Icon + Title**
   - Icon: 48×48px rounded square (16px radius), white translucent bg, "sensors" icon inside
   - Title: "Sensor Readings" (white, 24px, bold)
   - Subtitle: "Real-time monitoring & insights" (white 90% opacity, 14px)

2. **Filters (center section)**
   - 4 compact dropdowns in a row:
     - **Farm:** Business icon + "All Farms"
     - **Type:** Category icon + "All Types"
     - **Range:** Schedule icon + "Last Hour"
     - **Search:** Search icon + text input (expandable)
   - Each filter: white bg, rounded 12px, soft shadow, ~140px wide (search expands to 200px)

3. **Actions (right)**
   - Refresh button (icon-only, circular, translucent white bg)
   - Auto-refresh toggle (slide toggle + sync icon, translucent bg)
   - Density toggle (icon-only, view_compact / view_comfortable)

---

### Main Content Grid

**Desktop Layout:**
```
┌────────────────────────────────────────────────┐
│  Header (Gradient, Sticky)                     │
└────────────────────────────────────────────────┘
┌──────────────┬─────────────────────────────────┐
│              │                                  │
│   Left Panel │        Right Panel               │
│   (320px)    │        (Fluid)                   │
│              │                                  │
│   Device     │        Device Detail             │
│   List       │        (Charts, KPIs, etc.)      │
│   (Scroll)   │                                  │
│              │                                  │
│              │                                  │
└──────────────┴─────────────────────────────────┘
┌────────────────────────────────────────────────┐
│  Footer Summary (Sticky Bottom)                │
└────────────────────────────────────────────────┘
```

**Padding/Gaps:** 24px around grid, 24px gap between panels

---

### Left Panel – Device List (320px wide)

**Background:** Light lavender gradient → white  
**Border Radius:** 20px  
**Shadow:** Soft floating shadow

**Panel Header:**
- Icon: "devices" (purple)
- Label: "Sensors" (bold, 18px)
- Count Badge: Purple gradient pill, white text, "12"

**List Items (virtualized scroll):**
Each item is a compact row with:
1. **Status Badge (48×48px)**
   - Rounded square (14px radius)
   - Gradient background (status-based)
   - Icon centered (check_circle, warning, error, sensors_off)

2. **Device Info (middle, flex-grow)**
   - Name: Bold, 15px, truncate with ellipsis
   - Type + Time: Light gray, 12px, inline ("Temperature • 2m ago")

3. **Value Display (right)**
   - Large number (20px, bold)
   - Unit below (12px, gray)

4. **Quick Actions (hover only)**
   - Pin icon button (small, 32×32px)

**Item States:**
- **Default:** White bg, 2px transparent border
- **Hover:** Slight right translateX (4px), purple border glow, shadow
- **Selected:** Purple gradient bg (10% opacity), purple left border (4px solid)
- **Pinned:** Amber gradient bg (subtle), pin icon visible

**Sorting:** Pinned first, then Critical → Warning → Offline → Normal

---

### Right Panel – Device Detail (Larger, Fluid)

**Background:** Light lavender gradient → white  
**Border Radius:** 20px  
**Shadow:** Medium floating shadow  
**Padding:** 24px

---

#### Section 1: Header
**Height:** ~100px  
**Background:** White with status-based left border (4px solid)  
**Border Radius:** 16px  
**Padding:** 20px

**Content:**
- **Left:** Status icon (64×64px gradient circle) + Device name (24px bold) + Type (14px gray)
- **Right:** Status chip (pill, uppercase, colored bg)

---

#### Section 2: KPI Cards (3-column grid)

**First Card (spans full width):**
- **Background:** Purple gradient (`#667eea` → `#764ba2`)
- **Color:** White text
- **Content:**
  - Icon: Thermostat (48×48px translucent white bg)
  - Label: "CURRENT VALUE" (12px, uppercase)
  - Value: **"24.5"** (32px, bold) + unit "°C" (16px)
  - Delta: "+1.2" with trending_up icon, translucent white bg pill

**Second & Third Cards (side by side):**
- **Background:** White
- **Content:**
  - Icon: 48×48px gradient circle (schedule, insights)
  - Label: "LAST UPDATE" / "OPTIMAL RANGE" (12px gray uppercase)
  - Text: "12:04 PM" / "18 – 28 °C" (15px bold)

**Spacing:** 16px gap, hover lift effect

---

#### Section 3: Threshold Visualization

**Background:** White  
**Border Radius:** 16px  
**Padding:** 20px

**Header:**
- Icon: "tune" (purple)
- Title: "Threshold Zones" (16px bold)

**Threshold Bar:**
- Track: 12px height, gradient background (red → amber → green → amber → red)
- Optimal Zone: Green gradient overlay bar (shadows, positioned via %)
- Current Marker: 20px circle, purple gradient, white border, pulse ring animation
- Labels: Min / Optimal Min / Optimal Max / Max (12px gray, spaced evenly)

---

#### Section 4: Historical Chart

**Background:** White  
**Border Radius:** 16px  
**Padding:** 20px  
**Height:** 300px (chart area)

**Header:**
- Icon: "show_chart" (purple)
- Title: "Historical Data" (16px bold)

**Chart (ngx-charts style):**
- Line chart with gradient fill below line
- Purple gradient line color
- Grid lines: light gray, dashed
- X-axis: Timeline (hours)
- Y-axis: Value scale
- Smooth curve (not sharp angles)
- Show tooltip on hover

---

### Footer Summary (Sticky Bottom)

**Height:** ~80px  
**Background:** White with status-based top border (4px solid)  
**Border Radius:** 24px 24px 0 0  
**Shadow:** Upward shadow (`0 -4px 24px`)

**Content (left to right):**
1. **Status Icon + Text**
   - Icon: 48×48px gradient circle (status-based)
   - Title: "All Systems Normal" (18px bold)
   - Subtitle: "12 sensors in Green Valley" (14px gray)

2. **Count Pills (4 pills, horizontal)**
   - Each pill: Icon + count + label
   - "✓ 8 Normal" (green gradient bg)
   - "⚠ 2 Warning" (amber gradient bg)
   - "✖ 1 Critical" (red gradient bg)
   - "⊗ 1 Offline" (gray gradient bg)
   - Hover: Slight lift (2px translateY)

---

## 🎭 States to Show

### Desktop Artboard
- Header with all filters visible
- Left panel with 8–10 sensors (mix of statuses)
- One sensor selected (purple highlight)
- Right panel showing full detail with chart populated
- Footer showing "Attention Needed" (1 critical, 2 warning)

### Tablet Artboard
- Narrower left panel (280px)
- Same layout, adjusted spacing

### Mobile Artboard
- Stacked: Header → Abbreviated list (3 items) → Detail as bottom sheet overlay
- Filters collapse to drawer icon

### Detail Close-up
- Just the right panel at 800px wide
- Show chart with data points, threshold bar with marker, all KPIs

---

## 🎨 Visual Hierarchy

1. **Most Important:** Current value (largest text, gradient bg)
2. **Secondary:** Status indicators (colored badges, icons)
3. **Tertiary:** Chart, threshold bar (visual aids)
4. **Supporting:** Metadata (timestamps, labels)

---

## 🧩 UI Elements Reference

### Status Badges
- **Normal:** Green gradient (#d1fae5 → #a7f3d0), dark green icon
- **Warning:** Amber gradient (#fef3c7 → #fde68a), dark amber icon
- **Critical:** Red gradient (#fee2e2 → #fecaca), dark red icon, pulse animation
- **Offline:** Gray gradient (#f3f4f6 → #e5e7eb), dark gray icon

### Icons (Material Design style)
- sensors, devices, business, category, schedule, search, refresh, sync, check_circle, warning, error, sensors_off, thermostat, insights, tune, show_chart, push_pin, trending_up, trending_down

### Micro-interactions
- Hover lifts (cards, pills, list items)
- Smooth color transitions (0.3s ease)
- Pulse animation on critical badge
- Spin animation on refresh icon when loading
- Floating animation on empty state icon

---

## 📱 Responsive Notes

- **Desktop (≥1280px):** Full master–detail, 320px left
- **Tablet (1024–1279px):** 280px left
- **Mobile (≤768px):** Stacked, detail as drawer

---

## 🔍 Accessibility Notes

- High contrast colors (4.5:1 text, 3:1 UI)
- Icons paired with text labels
- Visible focus rings (3px purple outline)
- Touch targets ≥44×44px on mobile

---

## 🎬 Animation Hints (for mockup presentation)

- Header slides down on load
- List fades in from left
- Detail fades in from right
- Footer slides up
- Hover states: lift + shadow increase

---

## 📝 Sample Data

**Sensors:**
1. Sensor T-101 (Temperature) – 24.5°C – Normal – 2m ago
2. Sensor H-304 (Humidity) – 62% – Normal – 2m ago
3. Sensor SM-22 (Soil Moisture) – 45% – Warning – 5m ago
4. Sensor LUX-7 (Light) – 8,200 lux – Critical – 1m ago (SELECTED)
5. Sensor PH-9 (pH) – 6.8 – Normal – 3m ago
6. Sensor T-102 (Temperature) – 18°C – Warning – 7m ago
7. Sensor P-44 (Pressure) – 1012 kPa – Normal – 4m ago
8. Sensor H-305 (Humidity) – 35% – Warning – 6m ago
9. Sensor T-103 (Temperature) – 32°C – Critical – 30s ago
10. Sensor SM-23 (Soil Moisture) – Offline – 2h ago

**Selected Sensor (LUX-7):**
- Current: 8,200 lux
- Delta: -1,500 (trending_down)
- Last Update: 12:04 PM
- Optimal: 10,000 – 50,000 lux
- Status: Critical (below optimal)

**Chart Data:**
- X-axis: 11:00 AM → 12:00 PM (hourly ticks)
- Y-axis: 5,000 → 15,000 lux
- Line: starts at 12,000, dips to 8,200 at end
- Threshold band: green zone 10,000–50,000

---

## ✅ Final Checklist

- [ ] Purple gradient header with glassmorphism
- [ ] Compact filter controls (4 dropdowns + search)
- [ ] Left panel virtualized list with status badges
- [ ] Selected item has purple highlight + left border
- [ ] Right panel with gradient KPI card + chart
- [ ] Threshold bar with green zone + purple marker
- [ ] Footer with status icon + 4 count pills
- [ ] All shadows, gradients, border-radius per spec
- [ ] Responsive layouts for 3 breakpoints
- [ ] High contrast, readable text
- [ ] Consistent 24px spacing/gaps
- [ ] Smooth, modern, professional aesthetic

---

**Output Format:** High-fidelity mockups, clean spacing, production-ready visuals.

**Style Keywords:** Modern, glassmorphism, gradient, data-dense, clean, professional, IoT dashboard, purple accent, smooth animations.


