📄 Smart Farm Management System — Product Requirements Document (PRD)
🧭 1. Purpose & Vision

The Smart Farm Management System (MY_Transporter B2B - Smart Farming) is a next-generation web application designed to empower farmers and administrators to monitor, control, and optimize agricultural operations through IoT-driven data, automation, and analytics.
The system integrates IoT devices (Raspberry Pi + sensors), AI analytics, and real-time dashboards to deliver actionable insights in a modern, user-friendly interface.

Vision:
To provide farmers with intelligent control and visibility over their farms using IoT technology — transforming raw data into practical actions that enhance productivity, sustainability, and crop health.

🌐 2. Target Users

👨‍🌾 Farmers:

Monitor field conditions (temperature, humidity, soil moisture, light).

Control connected devices (pumps, fans, irrigation).

Receive smart alerts and AI-driven recommendations.

View detailed reports and farm insights.

🧑‍💼 Administrators:

Manage farmers, devices, and sensors.

Monitor global statistics across all farms.

Oversee system health, performance, and automation rules.

Generate performance and usage reports.

⚙️ 3. System Overview

The system is a web-based platform built with:

Frontend: Angular 19 (Material Design, signals, SCSS)

Backend: Spring Boot REST API

Database: PostgreSQL

IoT Layer: Raspberry Pi + connected sensors

Realtime Data: WebSockets / MQTT bridge for live readings

The application supports dark/light mode, i18n (Arabic / English / French), and responsive design for all devices.

🧩 4. Core Modules
🟢 A. Farmer Dashboard

Purpose: Give farmers a complete real-time overview of their farm’s health and operations.

Main Features:

KPI Header:

Total sensors, devices, online/offline ratio, quick summary.

Live Readings Panel:

Grid of sensor tiles (value, unit, sparkline, thresholds, color-coded statuses).

Filter by device, farm, or sensor type.

Smooth refresh & live update capabilities.

Map Section:

Shows farm locations and active devices.

Click on a device → quick stats pop-up.

Weather Forecast Widget:

Displays temperature, humidity, and rainfall prediction.

Quick Action FAB (Floating Button):

Global action shortcut (e.g., add device, trigger pump, export data).

Context-aware (changes per page).

Automation & Action Center:

Manual Control (turn on/off pumps, fans, heaters).

Recent Actions.

Action History (timeline + table hybrid view).

Notifications Center:

Real-time alerts from devices/sensors.

Grouped by farm, type, and priority.

Read/unread differentiation with smooth transitions.

Profile Management:

Edit personal info, change password, view account data.

🟣 B. Admin Dashboard

Purpose: Provide global visibility and control over all farmers, devices, and farms.

Main Features:

User & Farm Management

Device Overview (status, ownership, location)

Global KPIs (total farms, sensors, uptime)

Report Generation (PDF, CSV export)

Role-based Access & Activity Logs

🔔 5. Notification System

Purpose: Alert users about real-time changes, warnings, and actions.
Features:

Fetches notifications from backend via API.

Displays categorized cards (Critical / Warning / Info).

Live updates via WebSocket.

Mark-as-read, delete, and mark-all-read actions.

Dynamic translation of messages.

Glassmorphic UI with vertical timeline layout and smooth animations.

Default farm selection to auto-load relevant notifications.

⚡ 6. Action Center
1️⃣ Manual Control

Grid of glowing control buttons (e.g., “Turn Pump On”, “Turn Fan Off”).

Live feedback with action confirmation toast or SweetAlert2.

Safe Mode indicator (to avoid dangerous operations).

2️⃣ Recent Actions

Live stream of latest user-triggered or automated events.

Filters for time, farm, device, and user.

Interactive compact timeline with hover details.

3️⃣ Action History

Hybrid Tabs layout (Table + Timeline).

KPI header (Total Actions, Manual %, Automated %, Last Action).

Smooth transitions and sorting/filtering tools.

💬 7. User Interface & Experience (UI/UX Rules)

Design Philosophy:
Elegant. Smooth. Futuristic. Farmer-friendly.

Visual Style:

Glassmorphism + Soft Neumorphism: translucent layers, blurred backgrounds, soft shadows.

Color Palette:

Light Mode → whites, greens, soft neutrals.

Dark Mode → deep blues (#002043), glowing greens, accent cyan.

Typography: Inter / Poppins.

Transitions: Subtle (0.3–0.4s) ease-in-out for hover/focus/entry.

Spacing System: 8px grid (8/16/24/32px).

Icons: Outline (light mode) / Solid (dark mode).

Buttons: Rounded corners, soft hover elevation.

A11y:

WCAG AA contrast (≥4.5:1 for text).

Focus indicators visible.

Keyboard navigation support.

🌐 8. Internationalization (i18n)

Supported Languages: English (en-US), French (fr-FR), Arabic (ar-TN).

Uses LanguageService + translate pipe.

RTL support for Arabic (auto layout flipping).

All text keys exist in /assets/i18n/en-US.json, /fr-FR.json, /ar-TN.json.

Smooth fade transition when switching language (0.3s).

🧱 9. Technical & Performance Requirements

Angular 19 Standalone Components with Signals.

OnPush Change Detection for performance-critical components.

Lazy Loading for feature modules (Notifications, Actions, Profile).

Caching: Farm/device data memoized client-side.

API Handling:

Use firstValueFrom() instead of deprecated toPromise().

Graceful fallbacks and error handling with snackbars.

Test Readiness:

TestSprite MCP-compatible.

No mock data; real backend connectivity.

🧠 10. Future Enhancements

AI-driven irrigation scheduling recommendations.

Mobile PWA version.

Real-time map overlay of sensor heatmaps.

Voice assistant integration for farmers.

Predictive maintenance notifications for devices.

Automation workflow builder (drag & drop).

📈 11. Success Criteria

✅ System runs smoothly across all browsers and devices.
✅ Real-time data is stable and visually appealing.
✅ Farmers can act confidently through simple, safe UI.
✅ Translation and theme systems are consistent across all modules.
✅ Code passes TestSprite MCP validation and follows modular best practices.
✅ App gives a premium first impression via the landing page and login flow.

💎 12. Landing Page

Glassmorphic hero section (animated gradient background).

Key Features section (IoT, Analytics, Sustainability, AI).

“Who We Are” + “Our Vision” + “Contact FeedIn” form.

Lazy-loaded images with blur placeholder.

Smooth scrolling transitions and parallax layers.

Multilingual (EN/FR/AR).

Call-to-Action: “Try the Platform” → Redirect to login.

🧩 13. Integration Dependencies

Angular Material

SweetAlert2

Popper.js (for floating tooltips/dropdowns)

Chart.js / ApexCharts for analytics

ngx-translate or custom LanguageService

SCSS variables for color theming

RxJS for live updates

⚙️ 14. Summary

This system blends IoT precision, AI guidance, and modern UI craftsmanship to help farmers operate smarter.
The experience should feel calm, futuristic, and intuitive — making technology invisible so users can focus on farming, not complexity.