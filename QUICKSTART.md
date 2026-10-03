# Quick Start

## Try the App in 30 Seconds

```bash
npm install  # Already done; dependencies installed
npm run web
```

Then open **http://localhost:8081** in your browser.

## What You'll See

### 🏠 Home Screen
- Animated background video hero (with ॐ mandala)
- Today's daily verse (Bhagavad Gita 2.47) with English + Hindi translation
- Featured collections (Gita, Ramayana, Mahabharata)
- Story cards (Panchatantra, Vikram & Betal, etc.)
- Premium banner and support section

### 📖 Library
- Tap "Bhagavad Gita" or use the ▤ menu to browse chapters
- See all 18 chapters with summaries
- Language picker in top bar switches all text
- Tap a chapter to read it

### 📖 Chapter Reader
- Full-screen view of chapter title, subtitle, summary
- Sample verses with Sanskrit + translations (Gita chapter 2 has 3 verses)
- Audio player with speed controls (web: uses speech synthesis)
- Heart ♡ bookmark icon; ↓ offline save icon
- Next/Previous navigation

### ♥ Saved / Bookmarks
- View all heart-marked verses and chapters
- See offline-downloaded chapters
- Tap to re-open

### ✧ Premium Demo
- Tap "Premium" in top or bottom nav
- Two plans shown (₹99/month, ₹499/year)
- "Try monthly · demo" or "Try yearly · demo" button unlocks ALL chapters for audio on this device
- Premium hides ad slots

### Donate / Support
- Tap the support nav item
- Choose donation amount: ₹51, ₹101, ₹501, ₹1001
- "Offer support · preview" button (no real checkout)
- Coming-soon: temple/puja booking and spiritual marketplace

## Test These Features

| Feature | How to Test |
|---------|------------|
| Language | Top bar: tap 文 → select Hindi/Sanskrit/Tamil/etc. |
| Dark mode | Top bar: tap ☾ → text and colors update |
| Bookmarks | In reader, tap ♡ → verse saved → go to "Saved" nav |
| Offline | In reader, tap ↓ → chapter text saved → "Saved" nav shows it |
| Audio | In reader, tap ▶ → hears verse + summary in Sanskrit |
| Premium | Tap ✧ in nav → tap "Try · demo" → unlock all chapters → ▶ works for all |
| Ads | Free tier has ad slots; premium hides them |
| Daily verse | Home screen shows Gita 2.47 + translation |

## Mobile (iOS/Android)

```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android
```

On device, use **Expo Go** app or build standalone binary.

## Key Files

| File | Purpose |
|------|---------|
| `App.tsx` | All pages, UI, state logic |
| `src/data/scriptures.ts` | Gita, Ramayana, Mahabharata data + sample verses |
| `src/storage.ts` | Local persistence (bookmarks, theme, etc.) |
| `src/components/BackgroundVideo.tsx` | Responsive video bg component |
| `public/assets/bg.mp4` | Hero background video |
| `package.json` | Expo + React Native + dependencies |

## Architecture at a Glance

```
User selects language → appState.language updates
    ↓
All text keys look up: translations[appState.language] ?? translations.en
    ↓
localStorage auto-persists appState when it changes
    ↓
Dark mode, bookmarks, offline chapters all stored locally
    ↓
Premium demo flag unlocks paid features on THIS DEVICE ONLY
```

No backend, no accounts, no real payments.

## Extend It

- Add more verses: Edit `gitaVerses` in `src/data/scriptures.ts`
- Add a language: Add language code to `languages[]`, then provide translations
- Change colors: Modify `LIGHT` and `DARK` palettes in `App.tsx`
- Add a new collection: Create new Chapter/Collection in `src/data/scriptures.ts`

## Known Limitations

✓ Web: ✅ Full audio playback (speech synthesis)
✓ iOS/Android: ✅ Speech synthesis + local notifications
✗ Web: ❌ No native video (fallback to color overlay)
✗ iOS/Android: ⏳ Audio requires native build with Expo
✗ All: ❌ No real payment processing, ads, accounts, or cloud sync

---

**Ready to explore timeless wisdom?** 🙏

Start: `npm run web`
