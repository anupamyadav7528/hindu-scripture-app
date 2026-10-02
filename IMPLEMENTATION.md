# Sanatan Path - Scripture App MVP

## Overview
A polished, multilingual Hindu scripture reading and listening companion built with Expo + React Native. The same codebase runs on web, iOS, and Android.

## Core Features Implemented

### 📚 Scripture Collections
- **Bhagavad Gita**: Full 18-chapter structure with original summaries; 3 sample Sanskrit verses with English & Hindi translations
- **Ramayana**: 7 Kandas (Bala, Ayodhya, Aranya, Kishkindha, Sundara, Yuddha, Uttara) with navigation summaries
- **Mahabharata**: 18 Parvas with brief descriptions of each major section
- **Story Collections**: Panchatantra, Vikram & Betal, Shiva Purana, Vishnu Purana (discovery cards; full content coming soon)

### 🌍 Multilingual Support
- Hindi, English, Sanskrit, Tamil, Telugu, Marathi, Gujarati, Bengali
- Language selection persists locally and switches all UI text
- Translation fallback to English when a language is not yet available for a piece of content
- Extensible language model in `src/data/scriptures.ts`

### 📖 Reader Experience
- **Home Screen**: Hero section with animated video background (web), daily verse, featured collections, story cards
- **Library**: Browse any collection by chapter/kanda/parva; see offline status badge; tap to open chapter reader
- **Chapter Reader**: Full-screen verse + translation view; bookmarks with heart icon; offline download badge; audio player
- **Saved Section**: Personal bookmarks and offline-downloaded chapters organized and recoverable
- **Premium Screen**: Demo subscription plans (₹99/month or ₹499/year) with feature list; demo unlock for testing
- **Services/Support**: Donation amounts (₹51, ₹101, ₹501, ₹1001); early-stage cards for temple/puja and spiritual marketplace

### 🎙️ Audio Features
- Chapter audio via platform speech engine (reads sample verse + summary; adjustable playback speed)
- Free tier limited to first 3 Gita chapters; premium unlocks all
- Demo unlock to test premium audio features on the device
- Speed controls: 0.75×, 1×, 1.25×, 1.5×
- Clear indication of audio availability and premium gate

### 🎨 User Interface
- **Responsive Design**: Sidebar + main content on desktop (900px+); mobile-optimized bottom nav for phones
- **Theme Toggle**: Light/Dark mode with carefully tuned color palette (earthy greens, golds, serif typography)
- **Light Palette**: Warm ivory background (#F7F5EF), deep green text (#1D2B24), gold accents (#B9742D)
- **Dark Palette**: Deep forest background (#111D19), warm text (#F4F2E9), brighter gold (#E4B57C)
- **Accessibility**: Semantic labels, ARIA roles, contrast-compliant colors, reduced-motion support

### 💾 Persistence & Offline
- Reading language preference (stored locally)
- Dark/light theme toggle (persisted)
- Bookmarks (heart-marked verses and chapters, stored as string keys)
- Offline chapters (downloaded chapter text and metadata available on device)
- Premium demo state (device-only unlock for testing features)
- **No cloud sync**: All data stays on-device only

### 🔔 Daily Reminders (Native Apps Only)
- Optional 8:00 AM local notification on iOS/Android
- Delivers current day's verse with translation
- Permission-gated; user must approve notifications
- Not available in web build

### 🎬 Background Video
- **Web**: Native HTML5 `<video>` element with autoplay, loop, muted, playsInline
- **Mobile**: Static fallback with overlay (video playback optimized for web for MVP)
- Graceful degradation for reduced-motion preferences
- Contrast overlay (32% opacity) ensures hero text legibility

### 💳 Premium & Monetization
- Demo premium button (no real payment): toggles device-only demo state
- Sample donation amounts available in Support section (no checkout integrated)
- Ad placement seams (visual integration points; hidden when premium demo is active)
- Coming-soon cards for temple/puja/prasad delivery and spiritual marketplace

## Architecture

### Stack
- **Framework**: Expo 52 + React Native 0.76
- **Language**: TypeScript 5.3
- **Styling**: React Native StyleSheet with theme-aware palettes
- **Storage**: AsyncStorage (device-local only)
- **Notifications**: expo-notifications (iOS/Android)
- **Speech**: expo-speech (cross-platform text-to-speech)
- **Builds**: Web (Expo), iOS (Xcode simulator or device), Android (emulator or device)

### File Structure
```
.
├── App.tsx                          # Main app entry + all page components
├── app.json                         # Expo config
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── public/
│   └── assets/
│       └── bg.mp4                   # Hero background video
├── README.md                        # Setup instructions
└── src/
    ├── data/
    │   └── scriptures.ts            # All scripture data, language defs, sample verses
    ├── storage.ts                   # AppState type, localStorage persistence
    └── components/
        └── BackgroundVideo.tsx      # Responsive video background component
```

### App State
```typescript
type AppState = {
  language: string;                  // "en", "hi", "sa", etc.
  darkMode: boolean;
  bookmarks: string[];               // Array of keys like "gita:2:verse:2.47"
  offlineChapters: string[];         // Array of keys like "gita:2"
  offlineContent: Record<string, {   // Cached chapter text & metadata
    collectionTitle: string;
    chapter: Chapter;
  }>;
  premiumDemo: boolean;
  dailyReminder: boolean;            // iOS/Android only
};
```

## Demo Boundaries

This MVP is **intentionally limited** to establish product viability and UX:

### What's Included (Demo Complete)
✅ Full Gita chapter index + 18 unique summaries  
✅ 3 sample public-domain Gita verses (2.47, 2.48, 18.66) with English & Hindi  
✅ Ramayana + Mahabharata chapter/parva lists with summaries  
✅ 8 languages with fallback  
✅ Local storage for preferences, bookmarks, offline chapters  
✅ Chapter-level audio playback (sample verse + summary)  
✅ Responsive UI for web + mobile  
✅ Light/dark themes, language switching, bookmarks  
✅ Demo premium unlock (device-only)  
✅ Background video (web)  
✅ Daily verse reminders (iOS/Android)  

### What's Not Included (Clearly Marked)
❌ **Real Payments**: No Stripe, Razorpay, or Apple/Google subscription integration  
❌ **Real Ads**: Ad placement boxes are visual seams only; no AdMob/AdSense  
❌ **Complete Scriptures**: Sample Gita verses only; full texts would require sourcing or canonical editions  
❌ **Full Translations**: Most languages show English fallback; translation sourcing requires review  
❌ **Audio Library**: Speech synthesis only; no professional audiobook recordings  
❌ **Cloud Sync**: All data device-local; no backend or account system  
❌ **Temple/Puja/Marketplace**: Coming-soon cards; no checkout or booking integration  
❌ **Push Notifications**: Local only; no remote notification service  
❌ **Mobile App Stores**: Not yet published; export + manual build required  

## Running the App

### Prerequisites
- Node.js 18+
- npm

### Web (Instant)
```bash
npm install
npm run web
# Opens http://localhost:8081 automatically
```

### iOS (Simulator or Device)
```bash
npm install
npm run ios
```

### Android (Emulator or Device)
```bash
npm install
npm run android
```

### Validation
```bash
npm run typecheck     # TypeScript checking
npm run build:web     # Static web export (experimental)
```

## What's Implemented vs. What Remains

| Feature | Status | Notes |
|---------|--------|-------|
| Scripture content structure | ✅ Complete | Gita full; epics organized; sample data seeded |
| Language selector UI | ✅ Complete | 8 languages; fallback to English |
| Reader interface | ✅ Complete | Verses, translations, audio player, bookmarks |
| Offline reading | ✅ Complete | Chapter text saved locally |
| Bookmarks | ✅ Complete | Heart-marked verses/chapters stored locally |
| Dark/light theme | ✅ Complete | Persisted user preference |
| Audio playback | ✅ Complete | Speech synthesis, speed controls, premium gate |
| Daily reminders | ✅ Complete | iOS/Android local notifications; 8 AM trigger |
| Background video | ✅ Complete | Web (HTML5); mobile fallback |
| Premium UI | ✅ Complete | Demo unlock (device-only) |
| Ad integration seams | ✅ Complete | Visual placeholders; no real inventory |
| Donation UI | ✅ Complete | Amount selector + preview button |
| Marketplace/Temple cards | ✅ Complete | Coming-soon placeholders |
| Responsive design | ✅ Complete | Desktop sidebar + mobile bottom nav |
| Accessibility | ✅ Complete | Labels, roles, contrast, reduced-motion |
| — | — | — |
| Real payments | ⏳ Future | Requires payment provider integration |
| Real ads | ⏳ Future | AdMob/AdSense requires platform setup |
| Complete scripture editions | ⏳ Future | Requires sourcing/canonical review |
| Cloud sync | ⏳ Future | Requires backend + authentication |
| Professional audio | ⏳ Future | Requires recording partnerships |
| Push notifications | ⏳ Future | Requires backend service |
| App Store distribution | ⏳ Future | Requires app review + signing |

## How to Extend

1. **Add Verses**: Edit `src/data/scriptures.ts` and add to the `Verse[]` arrays.
2. **Add Languages**: Add language code to `languages[]` and provide `translations` for content.
3. **Custom UI**: Modify `makeStyles()` in `App.tsx` or create new components in `src/components/`.
4. **Storage**: Extend `AppState` in `src/storage.ts` and persist/load in `loadAppState()`.
5. **Audio**: Replace `Speech.speak()` with a custom audio URL or library.
6. **Notifications**: Extend the daily reminder with additional times via `expo-notifications`.

## License & Attribution

This demo app is built for educational and product-exploration purposes. It showcases modern Expo + React Native practices for cross-platform scripture apps.

- Public-domain Sanskrit verses used for demonstration.
- Sample translations are brief, original, and provided for context only.
- Not a canonical or complete scripture edition.

---

**Built with Expo 52 • React Native 0.76 • TypeScript • AsyncStorage • Expo Speech**

A small space to practice presence and wisdom.
