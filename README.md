# Sahakari Seva (सहकारी सेवा / সহকারী সেবা / சகாரி சேவா / సహకారి సేవ / सहकारी सेवा / સહકારી સેવા / ಸಹಕಾರಿ ಸೇವಾ)

> **India's First Worker-Owned Cooperative Platform for Urban & Household Gig Services** — restructured as a **mobile-first application** (Expo SDK 52 / React Native) that runs on **Expo Go** for Android & iOS.

---

## 🌟 Key Highlights

- **📱 True Mobile Application** — Expo SDK 52 / React Native app in `mobile/` with role-based bottom tabs (Customer, Worker, Admin), touch-first UI, native safe areas, GPS matching, and offline demo fallback so *every* screen works even without the backend.
- **🗣 8-Language Simultaneous Localization** — English + **7 Indian languages** (हिन्दी Hindi, বাংলা Bengali, தமிழ் Tamil, తెలుగు Telugu, मराठी Marathi, ગુજરાતી Gujarati, ಕನ್ನಡ Kannada). Switching languages swaps **the entire app at once** — tabs, screens, alerts, invoices, admin dashboards — behind a smooth branded cross-fade with **zero glitches**. Your choice persists across restarts.
- **✨ Unique Classy Animations Everywhere** — reusable animation system (`FadeInView`, `ScalePressable`, `AnimatedNumber`, `PulseView`): staggered entrance sequences on every screen, springy haptic press feedback, count-up earnings/KPI numbers, gentle pulsing emergency banner, and cross-fade screen transitions.
- **🤖 AI Demand Forecasting & Workforce Allocation** — Ensemble time-series model (weekend surge ×1.55, OLS trend regression, 95% confidence bounds) plus real-time supply–demand balancing with 1-tap standby worker mobilization.
- **📍 Zero Paid Map APIs** — 100% open-source OpenStreetMap + Haversine geo-matching. Zero Google Maps / Mapbox fees.
- **💰 Fair-Wage Cooperative Economics** — 85% direct to the worker, 10% to the social-security & welfare corpus, 5% cooperative operations — transparent on every booking and invoice.
- **🛡 Cooperative Governance** — worker KYC verification queue, ITI/NSDC certification checks, welfare passbook with Ayushman Bharat + PMSBY integration.

---

## 🚀 Quick Start (Expo Go — Android)

### 1. Install Expo Go on your Android phone
Search **"Expo Go"** in the Google Play Store and install it.

### 2. Start the mobile app
```bash
cd mobile
npm install
npm start
```

### 3. Connect
Put your phone and computer on the **same Wi-Fi**, open **Expo Go**, tap **"Scan QR code"**, and scan the QR shown in the terminal. The app bundles and opens in seconds. No Android Studio, no APK, no build required.

> **Detailed step-by-step guide:** [`docs/EXPO_GO_SETUP.md`](docs/EXPO_GO_SETUP.md) — includes Tunnel mode, LAN troubleshooting, and connecting the live backend API (`EXPO_PUBLIC_API_URL=http://<computer-ip>:5001`).

### 4. Optional — Backend API (port 5001)
```bash
cd backend
npm install
npm run dev
```
Without the backend the app automatically falls back to built-in demo data — every feature still works.

---

## 🌐 Language Switching (7 Indian Languages + English)

| Language | Native | Script |
|---|---|---|
| English | English | Latin |
| Hindi | हिन्दी | Devanagari |
| Bengali | বাংলা | Bengali |
| Tamil | தமிழ் | Tamil |
| Telugu | తెలుగు | Telugu |
| Marathi | मराठी | Devanagari |
| Gujarati | ગુજરાતી | Gujarati |
| Kannada | ಕನ್ನಡ | Kannada |

Tap the **🌐 chip** in any header to open the language picker. The switch is
orchestrated by `LanguageSwitchProvider` (`mobile/src/animations/`) — a
branded overlay cross-fades in (140 ms), i18next swaps all ~300 UI strings in a
single render, then the overlay fades out (280 ms). **No text jumps, no
partial translation, ever.** The selected language is saved with
AsyncStorage and restored on launch.

---

## 📱 Mobile App Screens & Flows

| Role | Screens & Capabilities |
|---|---|
| **Customer** | **Home**: animated category grid, pulsing emergency trigger, nearby highlights, 85/10/5 fair-split banner.<br>**Search**: trade chips (localized), rating & emergency filters, Haversine ranking.<br>**Map**: fullscreen OpenStreetMap with radius perimeter and worker pins.<br>**Detail**: worker background, verified ITI certificates, reviews, cooperative affiliation.<br>**Booking**: transparent wage-split breakdown, emergency dispatch toggle, instant confirmation.<br>**Invoice**: official cooperative tax receipt with 85/10/5 distribution & share. |
| **Worker** | **Dashboard**: count-up direct earnings, welfare corpus, live availability toggle.<br>**Jobs**: active task lifecycle (Accept → Start → Complete) with emergency badges.<br>**Welfare**: social-security passbook (Ayushman Bharat, PMSBY, cooperative pension).<br>**Credentials**: cooperative digital ID card, trade profile editor, certification upload.<br>**GPS & Radius**: live GPS sync, address resolution, service radius picker, privacy notice. |
| **Admin** | **Federation**: KPI grid with animated counters & welfare corpus.<br>**Verify KYC**: pending/verified queue with approve/reject workflows.<br>**AI Forecast**: 7-day demand curve, weekend surge (+55%), confidence bounds, cold-start fallback.<br>**Allocation**: live supply-demand clusters with 1-tap standby mobilization. |

---

## 🧱 Architecture

```
mobile/            → Expo SDK 52 React Native app (primary deliverable)
  src/animations/  → FadeInView, ScalePressable, AnimatedNumber, PulseView,
                     LanguageSwitchProvider (glitch-free whole-app switching)
  src/i18n/        → 8 complete locales (en, hi, bn, ta, te, mr, gu, kn)
  src/screens/     → auth / customer / worker / admin role flows
  src/components/  → ui, common (Header, modals, WorkerCard), map
  src/services/    → ApiClient (auto LAN host detection + offline fallback), GPS
  src/theme/       → design tokens (colors, spacing, typography, radii, shadows)
backend/           → Express 5 + TypeScript REST API (port 5001)
docs/              → EXPO_GO_SETUP.md + architecture, API & ML documentation
```

---

## 📚 Documentation

| Guide | Description |
|---|---|
| [`docs/EXPO_GO_SETUP.md`](docs/EXPO_GO_SETUP.md) | **Run on Android via Expo Go** — step-by-step, QR scanning, Tunnel mode, backend hookup, troubleshooting |
| [`docs/MOBILE_ARCHITECTURE.md`](docs/MOBILE_ARCHITECTURE.md) | Mobile navigation, touch targets, offline-resilient architecture |
| [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) | Complete REST API reference |
| [`docs/ML_FORECASTING.md`](docs/ML_FORECASTING.md) | Time-series OLS regression, EMA smoothing, surge multipliers |
| [`docs/GEOLOCATION_MATCHING.md`](docs/GEOLOCATION_MATCHING.md) | Haversine engine, 5-factor scoring, privacy masking |
| [`docs/WORKFORCE_ALLOCATION.md`](docs/WORKFORCE_ALLOCATION.md) | Supply-demand balancing and mobilization |
| [`docs/INTERNATIONALIZATION.md`](docs/INTERNATIONALIZATION.md) | Localization architecture |

---

## ⚖️ License & Cooperative Ethics

Sahakari Seva is developed under the MIT License for open-source cooperative public goods. Dedicated to the dignity of informal gig labor and digital sovereignty for worker cooperatives.
