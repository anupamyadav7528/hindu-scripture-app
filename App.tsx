import * as Notifications from "expo-notifications";
import * as Speech from "expo-speech";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Chapter,
  Collection,
  collections,
  dailyVerse,
  gita,
  languages,
  stories,
} from "./src/data/scriptures";
import { AppState, defaultState, loadAppState, saveAppState } from "./src/storage";
import { BackgroundVideo } from "./src/components/BackgroundVideo";

type Page = "home" | "library" | "saved" | "reader" | "premium" | "services";
type Palette = {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  line: string;
  accent: string;
  accentSoft: string;
  gold: string;
  goldSoft: string;
  inverse: string;
};

const LIGHT: Palette = {
  background: "#F7F5EF",
  surface: "#FFFFFF",
  surfaceAlt: "#F0EEE6",
  text: "#1D2B24",
  muted: "#738077",
  line: "#E5E6DD",
  accent: "#286047",
  accentSoft: "#E7F0E9",
  gold: "#B9742D",
  goldSoft: "#F8EDDE",
  inverse: "#142820",
};

const DARK: Palette = {
  background: "#111D19",
  surface: "#1B2B24",
  surfaceAlt: "#25372E",
  text: "#F4F2E9",
  muted: "#A7B2AA",
  line: "#34473D",
  accent: "#9BC6A9",
  accentSoft: "#263B30",
  gold: "#E4B57C",
  goldSoft: "#3D3326",
  inverse: "#F4F2E9",
};

const font = { display: "Georgia" } as const;
const FREE_AUDIO_CHAPTERS = 3;

export default function App() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [appState, setAppState] = useState<AppState>(defaultState);
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState<Page>("home");
  const [selectedCollection, setSelectedCollection] = useState<Collection>(gita);
  const [selectedChapter, setSelectedChapter] = useState<Chapter>(gita.chapters[1]);
  const [languageMenu, setLanguageMenu] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [toast, setToast] = useState("");
  const [donationAmount, setDonationAmount] = useState(101);
  const [submittingDemo, setSubmittingDemo] = useState(false);
  const palette = appState.darkMode ? DARK : LIGHT;
  const styles = useMemo(() => makeStyles(palette, wide), [palette, wide]);

  useEffect(() => {
    loadAppState()
      .then(setAppState)
      .catch((error: unknown) => console.error("Could not load saved preferences", error))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveAppState(appState).catch((error: unknown) => console.error("Could not save preferences", error));
  }, [appState, ready]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timeout);
  }, [toast]);

  const currentLanguage = languages.find((item) => item.code === appState.language) ?? languages[1];
  const chapterKey = `${selectedCollection.id}:${selectedChapter.number}`;
  const savedChapters = useMemo(
    () =>
      appState.offlineChapters
        .map((key) => {
          const [collectionId, numberText] = key.split(":");
          const collection = collections.find((item) => item.id === collectionId);
          const chapter = appState.offlineContent[key]?.chapter ?? collection?.chapters.find((item) => item.number === Number(numberText));
          return collection && chapter ? { collection, chapter, key } : null;
        })
        .filter((item): item is { collection: Collection; chapter: Chapter; key: string } => item !== null),
    [appState.offlineChapters, appState.offlineContent],
  );

  function updateState(updater: (current: AppState) => AppState) {
    setAppState((current) => updater(current));
  }

  function openReader(collection: Collection, chapter: Chapter) {
    setSelectedCollection(collection);
    setSelectedChapter(chapter);
    setPage("reader");
    setPlaying(false);
    Speech.stop();
  }

  function goHome() {
    setPage("home");
    setPlaying(false);
    Speech.stop();
  }

  function toggleBookmark(key: string) {
    const isSaved = appState.bookmarks.includes(key);
    updateState((current) => ({
      ...current,
      bookmarks: isSaved ? current.bookmarks.filter((item) => item !== key) : [...current.bookmarks, key],
    }));
    setToast(isSaved ? "Removed from your saved verses" : "Verse saved for later");
  }

  function saveOffline(key: string) {
    if (appState.offlineChapters.includes(key)) {
      setToast("This chapter is already saved offline");
      return;
    }
    updateState((current) => ({
      ...current,
      offlineChapters: [...current.offlineChapters, key],
      offlineContent: {
        ...current.offlineContent,
        [key]: { collectionTitle: selectedCollection.title, chapter: selectedChapter },
      },
    }));
    setToast("Chapter saved for offline reading");
  }

  async function setDailyReminder(enabled: boolean) {
    if (Platform.OS === "web") {
      setToast("Daily reminders are available in the iOS and Android app");
      return;
    }
    try {
      if (!enabled) {
        await Notifications.cancelAllScheduledNotificationsAsync();
        updateState((current) => ({ ...current, dailyReminder: false }));
        setToast("Daily verse reminder turned off");
        return;
      }
      let permission = await Notifications.getPermissionsAsync();
      if (permission.status !== "granted") permission = await Notifications.requestPermissionsAsync();
      if (permission.status !== "granted") {
        setToast("Allow notifications in device settings to set a reminder");
        return;
      }
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "A moment for reflection",
          body: `Bhagavad Gita ${dailyVerse.reference} · ${dailyVerse.translations[appState.language] ?? dailyVerse.translations.en ?? "A verse from the Bhagavad Gita"}`,
          data: { screen: "daily-verse", reference: dailyVerse.reference },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 8, minute: 0 },
      });
      updateState((current) => ({ ...current, dailyReminder: true }));
      setToast("Daily verse reminder set for 8:00 AM");
    } catch (error) {
      console.error("Could not update daily verse reminder", error);
      setToast("Could not update the reminder; check notification settings");
    }
  }

  function playChapter() {
    const locked = selectedChapter.number > FREE_AUDIO_CHAPTERS && !appState.premiumDemo;
    if (locked) {
      setPage("premium");
      return;
    }
    if (playing) {
      Speech.stop();
      setPlaying(false);
      return;
    }
    const verse = selectedChapter.verses?.[0] ?? dailyVerse;
    Speech.speak(`${selectedCollection.title}, ${selectedChapter.subtitle}. ${selectedChapter.summary}. ${verse.sanskrit}`, {
      language: "sa-IN",
      rate: speed,
      onDone: () => setPlaying(false),
      onStopped: () => setPlaying(false),
      onError: (error) => {
        setPlaying(false);
        console.error("Speech playback failed", error);
        setToast("Audio is not available on this device");
      },
    });
    setPlaying(true);
  }

  function purchaseDemo() {
    setSubmittingDemo(true);
    setTimeout(() => {
      updateState((current) => ({ ...current, premiumDemo: true }));
      setSubmittingDemo(false);
      setToast("Demo premium unlocked on this device");
      setPage("home");
    }, 550);
  }

  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.accent} />
      </View>
    );
  }

  const navItems: { label: string; icon: string; page: Page }[] = [
    { label: "Home", icon: "⌂", page: "home" },
    { label: "Library", icon: "▤", page: "library" },
    { label: "Saved", icon: "♡", page: "saved" },
  ];

  function TopBar() {
    return (
      <View style={styles.topBar}>
        <Pressable style={styles.brand} onPress={goHome} accessibilityRole="button" accessibilityLabel="Sanatan Path home">
          <View style={styles.brandMark}><Text style={styles.brandOm}>ॐ</Text></View>
          <View>
            <Text style={styles.brandName}>sanatan path</Text>
            <Text style={styles.brandCaption}>A little closer, every day</Text>
          </View>
        </Pressable>
        <View style={styles.topActions}>
          <Pressable
            style={styles.languageButton}
            onPress={() => setLanguageMenu((visible) => !visible)}
            accessibilityRole="button"
            accessibilityLabel={`Choose language, currently ${currentLanguage.name}`}
          >
            <Text style={styles.languageIcon}>文</Text>
            <Text style={styles.languageName}>{currentLanguage.nativeName}</Text>
            <Text style={styles.chevron}>⌄</Text>
          </Pressable>
          <Pressable
            style={styles.themeButton}
            onPress={() => updateState((current) => ({ ...current, darkMode: !current.darkMode }))}
            accessibilityRole="switch"
            accessibilityState={{ checked: appState.darkMode }}
            accessibilityLabel="Toggle dark theme"
          >
            <Text style={styles.themeGlyph}>{appState.darkMode ? "☼" : "☾"}</Text>
          </Pressable>
        </View>
        {languageMenu && (
          <View style={styles.languageMenu}>
            {languages.map((language) => (
              <Pressable
                key={language.code}
                style={[styles.languageOption, language.code === appState.language && styles.languageOptionActive]}
                onPress={() => {
                  updateState((current) => ({ ...current, language: language.code }));
                  setLanguageMenu(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: language.code === appState.language }}
              >
                <Text style={styles.languageOptionNative}>{language.nativeName}</Text>
                <Text style={styles.languageOptionLabel}>{language.name}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  }

  function BottomNav() {
    return (
      <View style={styles.bottomNav}>
        {navItems.map((item) => {
          const active = page === item.page || (page === "reader" && item.page === "library");
          return (
            <Pressable key={item.page} style={styles.navItem} onPress={() => setPage(item.page)} accessibilityRole="button">
              <Text style={[styles.navIcon, active && styles.navActive]}>{item.icon}</Text>
              <Text style={[styles.navLabel, active && styles.navActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
        <Pressable style={styles.navItem} onPress={() => setPage("premium")} accessibilityRole="button">
          <Text style={[styles.navIcon, page === "premium" && styles.navActive]}>✧</Text>
          <Text style={[styles.navLabel, page === "premium" && styles.navActive]}>Premium</Text>
        </Pressable>
      </View>
    );
  }

  function ScriptureCard({ collection, featured = false }: { collection: Collection; featured?: boolean }) {
    const marks: Record<string, string> = { gita: "ॐ", ramayana: "ध", mahabharata: "✺" };
    const taglines: Record<string, string> = { gita: "18 chapters", ramayana: "7 Kandas", mahabharata: "18 Parvas" };
    return (
      <Pressable
        style={[styles.scriptureCard, featured && styles.featuredScriptureCard]}
        onPress={() => {
          setSelectedCollection(collection);
          setPage("library");
        }}
        accessibilityRole="button"
      >
        <View style={[styles.collectionMark, collection.id === "gita" && styles.collectionMarkGita]}>
          <Text style={styles.collectionMarkText}>{marks[collection.id]}</Text>
        </View>
        <View style={styles.scriptureCopy}>
          <Text style={styles.cardOverline}>{taglines[collection.id]}</Text>
          <Text style={styles.scriptureTitle}>{collection.title}</Text>
          <Text style={styles.scriptureDescription}>{collection.description}</Text>
        </View>
        <Text style={styles.cardArrow}>↗</Text>
      </Pressable>
    );
  }

  function DailyCard() {
    const translated = dailyVerse.translations[appState.language] ?? dailyVerse.translations.en ?? "";
    const dailyKey = `gita:2:verse:${dailyVerse.reference}`;
    return (
      <View style={styles.dailyCard}>
        <View style={styles.dailyTop}>
          <View style={styles.dailyTag}><Text style={styles.dailyTagText}>✦  YOUR DAILY MOMENT</Text></View>
          <Text style={styles.dailyReference}>BHAGAVAD GITA · {dailyVerse.reference}</Text>
        </View>
        <Text style={styles.dailySanskrit}>{dailyVerse.sanskrit}</Text>
        <Text style={styles.dailyTranslation}>{translated}</Text>
        <View style={styles.dailyBottom}>
          <Text style={styles.dailyPrompt}>Carry this thought with you today.</Text>
          <Pressable
            style={styles.saveButton}
            onPress={() => toggleBookmark(dailyKey)}
            accessibilityRole="button"
            accessibilityLabel={appState.bookmarks.includes(dailyKey) ? "Remove daily verse bookmark" : "Bookmark daily verse"}
          >
            <Text style={styles.saveButtonText}>{appState.bookmarks.includes(dailyKey) ? "♥  Saved" : "♡  Save verse"}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function AdSlot() {
    if (appState.premiumDemo) return null;
    return (
      <View style={styles.adSlot}>
        <Text style={styles.adLabel}>SPONSORED</Text>
        <Text style={styles.adText}>A quiet space for a thoughtful message</Text>
        <Text style={styles.adDisclosure}>Ad placement preview · no ads are currently served</Text>
      </View>
    );
  }

  function PageTitle({ kicker, title, subtitle }: { kicker: string; title: string; subtitle?: string }) {
    return (
      <View style={styles.pageTitleBlock}>
        <Text style={styles.eyebrow}>{kicker}</Text>
        <Text style={styles.pageTitle}>{title}</Text>
        {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
      </View>
    );
  }

  function HomePage() {
    return (
      <>
        <BackgroundVideo
          source="./assets/bg.mp4"
          overlayColor={palette.inverse}
          overlayOpacity={0.32}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroPill}><Text style={styles.heroPillText}>YOUR DAILY SPACE FOR WISDOM</Text></View>
            <Text style={styles.heroTitle}>Find a little{`\n`}stillness in the{`\n`}everyday.</Text>
            <Text style={styles.heroSubtitle}>Ancient stories and timeless words, here whenever you need them.</Text>
            <Pressable style={styles.heroButton} onPress={() => openReader(gita, gita.chapters[1])} accessibilityRole="button">
              <Text style={styles.heroButtonText}>Continue reading  →</Text>
            </Pressable>
          </View>
          <View style={styles.heroArt} pointerEvents="none">
            <View style={styles.mandalaOuter}><View style={styles.mandalaMiddle}><View style={styles.mandalaInner}><Text style={styles.mandalaOm}>ॐ</Text></View></View></View>
            <Text style={styles.heroArtCaption}>शान्तिः · PEACE</Text>
          </View>
          <View style={styles.heroBottomLine}><Text style={styles.heroMeta}>01 / 18</Text><View style={styles.heroProgress}><View style={styles.heroProgressFill} /></View><Text style={styles.heroMeta}>BHAGAVAD GITA</Text></View>
        </BackgroundVideo>

        {appState.premiumDemo ? (
          <View style={styles.memberBanner}><Text style={styles.memberBannerText}>✧  Premium demo is active on this device</Text></View>
        ) : null}

        <View style={styles.contentSection}>
          <View style={styles.sectionHeader}>
            <View><Text style={styles.eyebrow}>A MOMENT FOR YOU</Text><Text style={styles.sectionTitle}>Today's reflection</Text></View>
            <Pressable onPress={() => toggleBookmark(`gita:2:verse:${dailyVerse.reference}`)} accessibilityRole="button">
              <Text style={styles.linkText}>{appState.bookmarks.includes(`gita:2:verse:${dailyVerse.reference}`) ? "Saved ♥" : "Save for later  ♡"}</Text>
            </Pressable>
          </View>
          <DailyCard />
        </View>

        <View style={styles.contentSection}>
          <View style={styles.sectionHeader}>
            <View><Text style={styles.eyebrow}>BEGIN YOUR JOURNEY</Text><Text style={styles.sectionTitle}>Explore the scriptures</Text></View>
            <Pressable onPress={() => setPage("library")} accessibilityRole="button"><Text style={styles.linkText}>View all  →</Text></Pressable>
          </View>
          <View style={styles.cardsGrid}>
            {collections.map((collection, index) => <ScriptureCard key={collection.id} collection={collection} featured={index === 0} />)}
          </View>
        </View>

        <View style={styles.contentSection}>
          <View style={styles.sectionHeader}>
            <View><Text style={styles.eyebrow}>TALES TO RETURN TO</Text><Text style={styles.sectionTitle}>Stories & traditions</Text></View>
            <Pressable onPress={() => setPage("library")} accessibilityRole="button"><Text style={styles.linkText}>Explore  →</Text></Pressable>
          </View>
          <View style={styles.storyGrid}>
            {stories.map((story) => (
              <Pressable key={story.title} style={styles.storyCard} onPress={() => setToast(`${story.title} · story collection coming soon`)} accessibilityRole="button">
                <Text style={styles.storyMark}>{story.mark}</Text><Text style={styles.storyCategory}>{story.category.toUpperCase()}</Text>
                <Text style={styles.storyTitle}>{story.title}</Text><Text style={styles.storyDescription}>{story.description}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <AdSlot />

        <Pressable style={styles.premiumBanner} onPress={() => setPage("premium")} accessibilityRole="button">
          <View style={styles.premiumBannerIcon}><Text style={styles.premiumBannerIconText}>✧</Text></View>
          <View style={styles.premiumBannerCopy}><Text style={styles.premiumBannerOverline}>A LITTLE MORE ROOM TO EXPLORE</Text><Text style={styles.premiumBannerTitle}>Make space for your practice.</Text><Text style={styles.premiumBannerBody}>Every chapter. Every listening. Yours to return to.</Text></View>
          <Text style={styles.premiumBannerAction}>Explore premium  →</Text>
        </Pressable>

        <View style={styles.supportRow}>
          <View style={styles.supportCopy}><Text style={styles.supportTitle}>Keep the lamp lit</Text><Text style={styles.supportBody}>Support a thoughtful, ad-light reading space.</Text></View>
          <Pressable style={styles.secondaryButton} onPress={() => setPage("services")} accessibilityRole="button"><Text style={styles.secondaryButtonText}>Offer support</Text></Pressable>
        </View>
      </>
    );
  }

  function CollectionPicker() {
    return (
      <View style={styles.collectionTabs}>
        {collections.map((collection) => (
          <Pressable
            key={collection.id}
            style={[styles.collectionTab, selectedCollection.id === collection.id && styles.collectionTabActive]}
            onPress={() => setSelectedCollection(collection)}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedCollection.id === collection.id }}
          >
            <Text style={[styles.collectionTabText, selectedCollection.id === collection.id && styles.collectionTabTextActive]}>{collection.title}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  function LibraryPage() {
    return (
      <>
        <PageTitle kicker="THE LIBRARY" title="Stories worth returning to." subtitle="Choose a collection to explore. A few sample passages are included; this is not a complete canonical edition." />
        <CollectionPicker />
        <View style={styles.libraryIntro}>
          <View><Text style={styles.libraryCollectionTitle}>{selectedCollection.title}</Text><Text style={styles.libraryCollectionSubtitle}>{selectedCollection.description}</Text></View>
          <Text style={styles.libraryCount}>{selectedCollection.chapters.length} {selectedCollection.id === "ramayana" ? "KANDAS" : selectedCollection.id === "mahabharata" ? "PARVAS" : "CHAPTERS"}</Text>
        </View>
        <View style={styles.chapterList}>
          {selectedCollection.chapters.map((chapter) => {
            const key = `${selectedCollection.id}:${chapter.number}`;
            const isOffline = appState.offlineChapters.includes(key);
            return (
              <Pressable key={key} style={styles.chapterRow} onPress={() => openReader(selectedCollection, chapter)} accessibilityRole="button">
                <View style={styles.chapterNumber}><Text style={styles.chapterNumberText}>{String(chapter.number).padStart(2, "0")}</Text></View>
                <View style={styles.chapterCopy}><Text style={styles.chapterTitle}>{chapter.title}</Text><Text style={styles.chapterSubtitle}>{chapter.subtitle}</Text><Text style={styles.chapterSummary} numberOfLines={2}>{chapter.summary}</Text></View>
                {isOffline ? <Text style={styles.offlineMark}>↓</Text> : null}
                <Text style={styles.chapterArrow}>›</Text>
              </Pressable>
            );
          })}
        </View>
        <AdSlot />
      </>
    );
  }

  function ReaderPage() {
    const verseList = selectedChapter.verses ?? [];
    const chapterIsBookmarked = appState.bookmarks.includes(chapterKey);
    const chapterIsOffline = appState.offlineChapters.includes(chapterKey);
    const audioLocked = selectedChapter.number > FREE_AUDIO_CHAPTERS && !appState.premiumDemo;
    const verseForAudio = verseList[0] ?? dailyVerse;
    const verseTranslation = verseForAudio.translations[appState.language] ?? verseForAudio.translations.en ?? "";
    return (
      <>
        <View style={styles.readerTop}>
          <Pressable style={styles.backButton} onPress={() => setPage("library")} accessibilityRole="button"><Text style={styles.backButtonText}>‹  Library</Text></Pressable>
          <View style={styles.readerActions}>
            <Pressable style={styles.iconButton} onPress={() => saveOffline(chapterKey)} accessibilityRole="button" accessibilityLabel="Save chapter offline"><Text style={styles.iconButtonGlyph}>{chapterIsOffline ? "✓" : "↓"}</Text></Pressable>
            <Pressable style={styles.iconButton} onPress={() => toggleBookmark(chapterKey)} accessibilityRole="button" accessibilityLabel="Bookmark chapter"><Text style={styles.iconButtonGlyph}>{chapterIsBookmarked ? "♥" : "♡"}</Text></Pressable>
          </View>
        </View>
        <View style={styles.readerHeader}>
          <Text style={styles.readerOverline}>{selectedCollection.title.toUpperCase()}  ·  {String(selectedChapter.number).padStart(2, "0")}</Text>
          <Text style={styles.readerChapterTitle}>{selectedChapter.title}</Text>
          <Text style={styles.readerSubtitle}>{selectedChapter.subtitle}</Text>
          <View style={styles.readerDivider} />
          <Text style={styles.readerSummary}>{selectedChapter.summary}</Text>
        </View>

        <View style={styles.audioCard}>
          <View style={styles.audioCardTop}>
            <View><Text style={styles.audioEyebrow}>LISTEN TO THIS CHAPTER</Text><Text style={styles.audioTitle}>A moment to listen</Text></View>
            <View style={styles.audioTag}><Text style={styles.audioTagText}>{audioLocked ? "PREMIUM" : "SAMPLE AUDIO"}</Text></View>
          </View>
          <Text style={styles.audioDetail}>Spoken Sanskrit · speech playback demo</Text>
          <View style={styles.audioControls}>
            <Pressable style={[styles.playButton, audioLocked && styles.playButtonLocked]} onPress={playChapter} accessibilityRole="button" accessibilityLabel={audioLocked ? "Unlock audio with premium" : playing ? "Pause audio" : "Play audio"}>
              <Text style={styles.playButtonIcon}>{audioLocked ? "✧" : playing ? "Ⅱ" : "▶"}</Text>
            </Pressable>
            <View style={styles.audioTrackWrap}><View style={styles.audioTrack}><View style={[styles.audioProgress, playing && styles.audioProgressActive]} /></View><Text style={styles.audioTime}>{audioLocked ? "Unlock full audio" : playing ? "Speaking…" : "Ready when you are"}</Text></View>
            <View style={styles.speedControl}>
              {[0.75, 1, 1.25, 1.5].map((rate) => <Pressable key={rate} style={[styles.speedOption, speed === rate && styles.speedOptionActive]} onPress={() => setSpeed(rate)} accessibilityRole="button" accessibilityState={{ selected: speed === rate }}><Text style={[styles.speedOptionText, speed === rate && styles.speedOptionTextActive]}>{rate}×</Text></Pressable>)}
            </View>
          </View>
          {audioLocked ? <Text style={styles.audioFineprint}>Free listening includes the first {FREE_AUDIO_CHAPTERS} chapters. Premium unlocks the full library.</Text> : null}
        </View>

        <View style={styles.verseSection}>
          <View style={styles.verseSectionHeader}><Text style={styles.eyebrow}>READ & REFLECT</Text><Text style={styles.verseCount}>{verseList.length ? `${verseList.length} SAMPLE VERSES` : "CHAPTER SUMMARY"}</Text></View>
          {verseList.length ? verseList.map((verse) => {
            const key = `${selectedCollection.id}:${selectedChapter.number}:verse:${verse.reference}`;
            const translation = verse.translations[appState.language] ?? verse.translations.en ?? "A translation for this language is not in the sample edition yet.";
            return (
              <View key={verse.reference} style={styles.verseCard}>
                <View style={styles.verseHeading}><View style={styles.verseDot} /><Text style={styles.verseReference}>VERSE {verse.reference}</Text><Pressable onPress={() => toggleBookmark(key)} accessibilityRole="button" accessibilityLabel="Bookmark verse"><Text style={styles.verseSave}>{appState.bookmarks.includes(key) ? "♥" : "♡"}</Text></Pressable></View>
                <Text style={styles.verseSanskrit}>{verse.sanskrit}</Text>
                <View style={styles.verseRule} />
                <Text style={styles.translationLabel}>MEANING · {currentLanguage.name.toUpperCase()}</Text>
                <Text style={styles.verseTranslation}>{translation}</Text>
              </View>
            );
          }) : (
            <View style={styles.verseCard}><Text style={styles.chapterSummaryLong}>{selectedChapter.summary}</Text><Text style={styles.sampleNote}>A chapter summary for this demonstration edition. Full verse text and translations are not included.</Text></View>
          )}
        </View>

        <View style={styles.readerFooter}>
          <Pressable style={styles.readerPrevious} onPress={() => openReader(selectedCollection, selectedCollection.chapters[Math.max(0, selectedChapter.number - 2)])} accessibilityRole="button" disabled={selectedChapter.number === 1}><Text style={styles.readerPreviousText}>←  Previous</Text></Pressable>
          <Text style={styles.readerProgressText}>{selectedChapter.number} of {selectedCollection.chapters.length}</Text>
          <Pressable style={styles.readerNext} onPress={() => openReader(selectedCollection, selectedCollection.chapters[Math.min(selectedCollection.chapters.length - 1, selectedChapter.number)])} accessibilityRole="button" disabled={selectedChapter.number === selectedCollection.chapters.length}><Text style={styles.readerNextText}>Next  →</Text></Pressable>
        </View>
        <AdSlot />
      </>
    );
  }

  function SavedPage() {
    return (
      <>
        <PageTitle kicker="YOUR PERSONAL LIBRARY" title="Saved for a quieter moment." subtitle="Your bookmarks and downloaded chapter text stay on this device." />
        <View style={styles.savedSection}>
          <View style={styles.savedHeader}><Text style={styles.sectionTitle}>Bookmarked passages</Text><Text style={styles.savedCount}>{appState.bookmarks.length}</Text></View>
          {appState.bookmarks.length ? appState.bookmarks.map((key) => {
            const isVerse = key.includes(":verse:");
            const [collectionId, chapterText] = key.split(":");
            const collection = collections.find((item) => item.id === collectionId);
            const chapterNumber = Number(chapterText);
            const chapter = collection?.chapters.find((item) => item.number === chapterNumber);
            const reference = isVerse ? key.split(":verse:")[1] : undefined;
            const verse = reference && collection?.chapters[chapterNumber - 1]?.verses?.find((item) => item.reference === reference);
            if (!collection || !chapter) return null;
            return (
              <Pressable key={key} style={styles.savedRow} onPress={() => openReader(collection, chapter)} accessibilityRole="button">
                <View style={styles.savedMark}><Text style={styles.savedMarkText}>♥</Text></View>
                <View style={styles.savedCopy}><Text style={styles.savedTitle}>{verse ? `${collection.title} · ${verse.reference}` : `${collection.title} · ${chapter.title}`}</Text><Text style={styles.savedSubtitle}>{verse ? (verse.translations[appState.language] ?? verse.translations.en ?? "A verse from the scriptures") : chapter.summary}</Text></View>
                <Pressable onPress={(event) => { event.stopPropagation(); toggleBookmark(key); }} accessibilityRole="button" accessibilityLabel="Remove bookmark"><Text style={styles.savedRemove}>×</Text></Pressable>
              </Pressable>
            );
          }) : <View style={styles.emptyCard}><Text style={styles.emptyIcon}>♡</Text><Text style={styles.emptyTitle}>Nothing saved just yet</Text><Text style={styles.emptyBody}>Tap the heart on a verse that speaks to you.</Text></View>}
        </View>

        <View style={styles.savedSection}>
          <View style={styles.savedHeader}><Text style={styles.sectionTitle}>Available offline</Text><Text style={styles.savedCount}>{savedChapters.length}</Text></View>
          {savedChapters.length ? savedChapters.map(({ collection, chapter, key }) => (
            <View key={key} style={styles.savedRow}>
              <View style={styles.offlineBadge}><Text style={styles.offlineBadgeText}>↓</Text></View>
              <Pressable style={styles.savedCopy} onPress={() => openReader(collection, chapter)} accessibilityRole="button"><Text style={styles.savedTitle}>{collection.title} · {chapter.title}</Text><Text style={styles.savedSubtitle}>{chapter.summary}</Text></Pressable>
              <Text style={styles.offlineStatus}>ON DEVICE</Text>
            </View>
          )) : <View style={styles.offlinePrompt}><Text style={styles.offlinePromptTitle}>Take a chapter with you</Text><Text style={styles.offlinePromptText}>Open any chapter and tap ↓ to save its text for offline reading.</Text><Pressable style={styles.secondaryButton} onPress={() => setPage("library")} accessibilityRole="button"><Text style={styles.secondaryButtonText}>Browse library</Text></Pressable></View>}
        </View>
      </>
    );
  }

  function PremiumPage() {
    return (
      <>
        <View style={styles.premiumHero}>
          <View style={styles.premiumHeroIcon}><Text style={styles.premiumHeroIconText}>✧</Text></View>
          <Text style={styles.premiumOverline}>SANATAN PATH · PLUS</Text>
          <Text style={styles.premiumTitle}>Go a little deeper.</Text>
          <Text style={styles.premiumSubtitle}>The app and all included reading text are free. These optional plans preview future full-library listening benefits; no payment is collected.</Text>
          {appState.premiumDemo ? <View style={styles.unlockedBadge}><Text style={styles.unlockedBadgeText}>✓  DEMO ACCESS ACTIVE ON THIS DEVICE</Text></View> : null}
        </View>
        <View style={styles.plansRow}>
          <View style={styles.planCard}>
            <Text style={styles.planName}>Monthly</Text><View style={styles.planPriceRow}><Text style={styles.planPrice}>₹99</Text><Text style={styles.planPeriod}>/ month</Text></View>
            <Text style={styles.planNote}>Cancel any time</Text>
            <View style={styles.planDivider} />
            {["Full chapter audio", "Listen without ads", "Offline text reading", "Audio speed controls"].map((item) => <Text key={item} style={styles.planFeature}><Text style={styles.featureCheck}>✓  </Text>{item}</Text>)}
            <Pressable style={styles.planButtonSecondary} onPress={purchaseDemo} disabled={submittingDemo} accessibilityRole="button">{submittingDemo ? <ActivityIndicator color={palette.accent} /> : <Text style={styles.planButtonSecondaryText}>{appState.premiumDemo ? "Demo access active" : "Try monthly · demo"}</Text>}</Pressable>
          </View>
          <View style={[styles.planCard, styles.planCardFeatured]}>
            <View style={styles.bestValue}><Text style={styles.bestValueText}>BEST VALUE</Text></View>
            <Text style={styles.planName}>Yearly</Text><View style={styles.planPriceRow}><Text style={styles.planPrice}>₹499</Text><Text style={styles.planPeriod}>/ year</Text></View>
            <Text style={styles.planNote}>That's about ₹42 a month</Text>
            <View style={styles.planDivider} />
            {["Full chapter audio", "Listen without ads", "Offline text reading", "Audio speed controls"].map((item) => <Text key={item} style={styles.planFeature}><Text style={styles.featureCheck}>✓  </Text>{item}</Text>)}
            <Pressable style={styles.planButtonPrimary} onPress={purchaseDemo} disabled={submittingDemo} accessibilityRole="button">{submittingDemo ? <ActivityIndicator color="#fff" /> : <Text style={styles.planButtonPrimaryText}>{appState.premiumDemo ? "Demo access active" : "Try yearly · demo"}</Text>}</Pressable>
          </View>
        </View>
        <Text style={styles.demoDisclaimer}>DEMO ONLY · The app is free to use. Tapping a plan only previews a device-local unlock. Real billing, account sync, and subscription management are not configured.</Text>
        <View style={styles.premiumAdNote}><Text style={styles.premiumAdNoteTitle}>A considered experience</Text><Text style={styles.premiumAdNoteText}>Premium hides ad placements. Free-tier ad slots in this demo are placeholders only; no AdMob or AdSense inventory is connected.</Text></View>
      </>
    );
  }

  function ServicesPage() {
    return (
      <>
        <PageTitle kicker="BEYOND THE PAGE" title="Practice, shared." subtitle="Small ways to keep this project growing—and a glimpse of what we're exploring." />
        <View style={styles.developerCard}>
          <View style={styles.developerIdentity}>
            <View style={styles.developerAvatar}><Text style={styles.developerAvatarText}>AY</Text></View>
            <View style={styles.developerCopy}>
              <Text style={styles.developerEyebrow}>DEVELOPER & PROJECT OWNER</Text>
              <Text style={styles.developerName}>Anupam Yadav</Text>
              <Text style={styles.developerSubtitle}>Building and maintaining Sanatan Path</Text>
            </View>
          </View>
          <Text style={styles.developerDescription}>Manage the website source, content, and publishing workflow from the project’s GitHub repository. Sign in to GitHub with the owner account to make changes.</Text>
          <View style={styles.adminLinks}>
            <Pressable
              style={styles.manageProjectButton}
              onPress={() => Linking.openURL("https://github.com/anupamyadav7528/hindu-scripture-app").catch((error: unknown) => {
                console.error("Could not open the project repository", error);
                setToast("Could not open GitHub on this device");
              })}
              accessibilityRole="link"
            >
              <Text style={styles.manageProjectButtonText}>Manage source & workflow  ↗</Text>
            </Pressable>
            <Pressable
              style={styles.manageProjectButton}
              onPress={() => Linking.openURL("https://github.com/anupamyadav7528/hindu-scripture-app/settings/pages").catch((error: unknown) => {
                console.error("Could not open GitHub Pages settings", error);
                setToast("Could not open GitHub Pages settings");
              })}
              accessibilityRole="link"
            >
              <Text style={styles.manageProjectButtonText}>Website publishing settings  ↗</Text>
            </Pressable>
          </View>
          <Text style={styles.developerDisclaimer}>This MVP has no secure in-app admin dashboard or cloud CMS. GitHub manages the code and website deployment; subscriptions, advertising, donations, and orders are not connected to live providers.</Text>
        </View>
        <View style={styles.freeAccessNote}>
          <Text style={styles.freeAccessTitle}>Free to start, no account required</Text>
          <Text style={styles.freeAccessBody}>All included sample reading text, summaries, bookmarks, and offline text are free. The first {FREE_AUDIO_CHAPTERS} Gita audio chapters are free; the optional ₹99/month or ₹499/year plans are demo previews and collect no payment.</Text>
        </View>
        <View style={styles.donationCard}>
          <View style={styles.donationMark}><Text style={styles.donationMarkText}>दीप</Text></View>
          <Text style={styles.donationEyebrow}>SUPPORT THE JOURNEY</Text>
          <Text style={styles.donationTitle}>Help keep the light on.</Text>
          <Text style={styles.donationDescription}>Your support can help make more scripture, stories, and thoughtful tools accessible to everyone.</Text>
          <View style={styles.amountRow}>{[51, 101, 501, 1001].map((amount) => <Pressable key={amount} style={[styles.amountOption, donationAmount === amount && styles.amountOptionActive]} onPress={() => setDonationAmount(amount)} accessibilityRole="button" accessibilityState={{ selected: donationAmount === amount }}><Text style={[styles.amountOptionText, donationAmount === amount && styles.amountOptionTextActive]}>₹{amount}</Text></Pressable>)}</View>
          <Pressable style={styles.donateButton} onPress={() => setToast("Donations are a preview here; no payment provider is connected.")} accessibilityRole="button"><Text style={styles.donateButtonText}>Offer ₹{donationAmount} · preview</Text></Pressable>
          <Text style={styles.donationDisclaimer}>No payment is collected in this demo.</Text>
        </View>
        <View style={styles.comingSoonGrid}>
          <View style={styles.comingSoonCard}><Text style={styles.comingSoonIcon}>⌂</Text><Text style={styles.comingSoonTag}>COMING SOON</Text><Text style={styles.comingSoonTitle}>Temple & puja</Text><Text style={styles.comingSoonBody}>Explore local puja booking and prasad delivery, when partners are ready.</Text></View>
          <View style={styles.comingSoonCard}><Text style={styles.comingSoonIcon}>✧</Text><Text style={styles.comingSoonTag}>DEMO CATALOG</Text><Text style={styles.comingSoonTitle}>Spiritual marketplace</Text><Text style={styles.comingSoonBody}>A future home for trusted books, artisan goods, and devotional essentials. No checkout yet.</Text></View>
        </View>
        <View style={styles.preferenceCard}><Text style={styles.sectionTitle}>Your reading preferences</Text><View style={styles.preferenceRow}><View><Text style={styles.preferenceTitle}>Dark reading mode</Text><Text style={styles.preferenceSubtitle}>A softer screen for evening reading.</Text></View><Switch value={appState.darkMode} onValueChange={(darkMode) => updateState((current) => ({ ...current, darkMode }))} trackColor={{ false: palette.line, true: palette.accent }} thumbColor={palette.surface} accessibilityLabel="Dark reading mode" /></View><View style={styles.preferenceRow}><View><Text style={styles.preferenceTitle}>Daily verse reminder</Text><Text style={styles.preferenceSubtitle}>{Platform.OS === "web" ? "Available in the iOS and Android app." : "A gentle local notification at 8:00 AM."}</Text></View><Switch value={appState.dailyReminder} onValueChange={setDailyReminder} disabled={Platform.OS === "web"} trackColor={{ false: palette.line, true: palette.accent }} thumbColor={palette.surface} accessibilityLabel="Daily verse reminder" /></View><View style={styles.preferenceRow}><View><Text style={styles.preferenceTitle}>Reading language</Text><Text style={styles.preferenceSubtitle}>{currentLanguage.name} · {currentLanguage.nativeName}</Text></View><Pressable style={styles.languageChangeButton} onPress={() => setLanguageMenu(true)} accessibilityRole="button"><Text style={styles.languageChangeText}>Change  →</Text></Pressable></View></View>
      </>
    );
  }

  function renderPage() {
    switch (page) {
      case "home": return <HomePage />;
      case "library": return <LibraryPage />;
      case "reader": return <ReaderPage />;
      case "saved": return <SavedPage />;
      case "premium": return <PremiumPage />;
      case "services": return <ServicesPage />;
    }
  }

  const pageLabel: Record<Page, string> = { home: "Home", library: "Library", reader: "Reader", saved: "Saved", premium: "Premium", services: "Support" };

  return (
    <View style={styles.app}>
      <StatusBar style={appState.darkMode ? "light" : "dark"} />
      <TopBar />
      <View style={styles.body}>
        {wide && (
          <View style={styles.sidebar}>
            <Text style={styles.sidebarLabel}>YOUR SPACE</Text>
            {navItems.map((item) => (
              <Pressable key={item.page} style={[styles.sidebarItem, (page === item.page || (page === "reader" && item.page === "library")) && styles.sidebarItemActive]} onPress={() => setPage(item.page)} accessibilityRole="button">
                <Text style={[styles.sidebarIcon, (page === item.page || (page === "reader" && item.page === "library")) && styles.sidebarActiveText]}>{item.icon}</Text>
                <Text style={[styles.sidebarText, (page === item.page || (page === "reader" && item.page === "library")) && styles.sidebarActiveText]}>{item.label}</Text>
              </Pressable>
            ))}
            <View style={styles.sidebarDivider} />
            <Pressable style={[styles.sidebarItem, page === "services" && styles.sidebarItemActive]} onPress={() => setPage("services")} accessibilityRole="button"><Text style={styles.sidebarIcon}>✧</Text><Text style={styles.sidebarText}>Support & more</Text></Pressable>
            <Pressable style={[styles.sidebarItem, page === "premium" && styles.sidebarItemActive]} onPress={() => setPage("premium")} accessibilityRole="button"><Text style={styles.sidebarIcon}>◈</Text><Text style={styles.sidebarText}>Go Premium</Text></Pressable>
            <View style={styles.sidebarBottom}><Text style={styles.sidebarBottomTitle}>A practice, at your pace.</Text><Text style={styles.sidebarBottomBody}>A quiet place for timeless words.</Text></View>
          </View>
        )}
        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainContent} showsVerticalScrollIndicator={false}>
          {!wide && page !== "home" && page !== "reader" ? <Text style={styles.mobilePageLabel}>{pageLabel[page]}</Text> : null}
          {renderPage()}
          <View style={styles.footer}><Text style={styles.footerBrand}>ॐ  sanatan path</Text><Text style={styles.footerText}>Developed by Anupam Yadav · Demo edition · © Sanatan Path</Text><Pressable onPress={() => setPage("services")} accessibilityRole="button"><Text style={styles.footerLink}>Support & owner details</Text></Pressable></View>
        </ScrollView>
      </View>
      {!wide && <BottomNav />}
      {toast ? <View style={styles.toast} accessibilityLiveRegion="polite"><Text style={styles.toastText}>{toast}</Text></View> : null}
    </View>
  );
}

function makeStyles(p: Palette, wide: boolean) {
  return StyleSheet.create({
    app: { flex: 1, backgroundColor: p.background },
    loading: { flex: 1, alignItems: "center", justifyContent: "center" },
    topBar: { height: 76, paddingHorizontal: wide ? 48 : 22, borderBottomWidth: 1, borderBottomColor: p.line, backgroundColor: p.surface, flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 5 },
    brand: { flexDirection: "row", alignItems: "center", gap: 11 },
    brandMark: { width: 38, height: 38, borderRadius: 13, backgroundColor: p.accentSoft, alignItems: "center", justifyContent: "center" },
    brandOm: { color: p.accent, fontSize: 21, fontFamily: font.display },
    brandName: { fontSize: 18, color: p.text, fontFamily: font.display, letterSpacing: 0.2 },
    brandCaption: { fontSize: 10, color: p.muted, marginTop: 1, letterSpacing: 0.4 },
    topActions: { flexDirection: "row", alignItems: "center", gap: 10 },
    languageButton: { flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderColor: p.line, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 22 },
    languageIcon: { color: p.muted, fontSize: 13 },
    languageName: { color: p.text, fontSize: 12, fontWeight: "600" },
    chevron: { color: p.muted, fontSize: 14 },
    themeButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: p.surfaceAlt },
    themeGlyph: { color: p.text, fontSize: 18 },
    languageMenu: { position: "absolute", top: 65, right: wide ? 78 : 62, width: 204, padding: 7, borderRadius: 14, borderWidth: 1, borderColor: p.line, backgroundColor: p.surface, zIndex: 20, elevation: 8 },
    languageOption: { minHeight: 39, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 9 },
    languageOptionActive: { backgroundColor: p.accentSoft },
    languageOptionNative: { color: p.text, fontSize: 14 },
    languageOptionLabel: { color: p.muted, fontSize: 11 },
    body: { flex: 1, flexDirection: "row" },
    sidebar: { width: 224, paddingHorizontal: 17, paddingTop: 32, borderRightWidth: 1, borderRightColor: p.line, backgroundColor: p.surface },
    sidebarLabel: { color: p.muted, fontSize: 10, letterSpacing: 1.5, fontWeight: "700", paddingHorizontal: 12, marginBottom: 14 },
    sidebarItem: { height: 45, borderRadius: 10, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 12, marginBottom: 4 },
    sidebarItemActive: { backgroundColor: p.accentSoft },
    sidebarIcon: { width: 20, textAlign: "center", color: p.muted, fontSize: 17 },
    sidebarText: { color: p.muted, fontSize: 13 },
    sidebarActiveText: { color: p.accent, fontWeight: "700" },
    sidebarDivider: { height: 1, backgroundColor: p.line, marginVertical: 15, marginHorizontal: 10 },
    sidebarBottom: { position: "absolute", left: 24, right: 20, bottom: 25, padding: 15, borderRadius: 13, backgroundColor: p.surfaceAlt },
    sidebarBottomTitle: { color: p.text, fontFamily: font.display, fontSize: 14 },
    sidebarBottomBody: { color: p.muted, fontSize: 11, marginTop: 6, lineHeight: 17 },
    mainScroll: { flex: 1 },
    mainContent: { width: "100%", maxWidth: 1100, alignSelf: "center", paddingHorizontal: wide ? 44 : 20, paddingTop: wide ? 33 : 24, paddingBottom: wide ? 32 : 32 },
    mobilePageLabel: { color: p.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16, fontWeight: "700" },
    hero: { minHeight: wide ? 335 : 383, paddingHorizontal: wide ? 48 : 25, paddingTop: wide ? 37 : 30, paddingBottom: 46, borderRadius: 22, overflow: "hidden", flexDirection: "row", position: "relative", justifyContent: "space-between", alignItems: "flex-start" },
    heroContent: { flex: 1, zIndex: 2, maxWidth: 560 },
    heroPill: { alignSelf: "flex-start", paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)" },
    heroPillText: { color: "#D7C19B", fontSize: 9, letterSpacing: 1.5, fontWeight: "700" },
    heroTitle: { color: "#F7F4EA", fontSize: wide ? 43 : 37, lineHeight: wide ? 49 : 43, fontFamily: font.display, marginTop: 18 },
    heroSubtitle: { color: "#C2CFC5", fontSize: 14, lineHeight: 22, maxWidth: 340, marginTop: 11 },
    heroButton: { alignSelf: "flex-start", borderRadius: 9, paddingHorizontal: 17, paddingVertical: 12, marginTop: 19, backgroundColor: "#E6D7B8" },
    heroButtonText: { color: "#22362B", fontSize: 12, fontWeight: "700" },
    heroArt: { width: wide ? 290 : 105, alignItems: "center", justifyContent: "center", alignSelf: "stretch", marginRight: wide ? 8 : -27, marginTop: wide ? -25 : 9 },
    mandalaOuter: { width: wide ? 224 : 120, height: wide ? 224 : 120, borderRadius: 112, borderWidth: 1, borderColor: "rgba(220,195,144,0.27)", alignItems: "center", justifyContent: "center" },
    mandalaMiddle: { width: "79%", height: "79%", borderRadius: 100, borderWidth: 1, borderColor: "rgba(220,195,144,0.45)", alignItems: "center", justifyContent: "center", transform: [{ rotate: "45deg" }] },
    mandalaInner: { width: "73%", height: "73%", borderRadius: 100, borderWidth: 1, borderColor: "rgba(220,195,144,0.58)", alignItems: "center", justifyContent: "center", transform: [{ rotate: "-45deg" }] },
    mandalaOm: { color: "#D8BD8B", fontFamily: font.display, fontSize: wide ? 52 : 34 },
    heroArtCaption: { color: "#AFA17F", fontSize: 9, letterSpacing: 2, marginTop: 13 },
    heroBottomLine: { position: "absolute", left: wide ? 48 : 25, right: wide ? 48 : 25, bottom: 17, flexDirection: "row", alignItems: "center", gap: 11 },
    heroMeta: { color: "#ADB9AD", fontSize: 8, letterSpacing: 1, fontWeight: "700" },
    heroProgress: { flex: 1, height: 2, backgroundColor: "rgba(255,255,255,0.17)", borderRadius: 2 },
    heroProgressFill: { width: "13%", height: 2, backgroundColor: "#D4B77F", borderRadius: 2 },
    memberBanner: { marginTop: 16, padding: 12, borderRadius: 10, backgroundColor: p.accentSoft },
    memberBannerText: { color: p.accent, fontSize: 12, fontWeight: "700", textAlign: "center" },
    contentSection: { marginTop: wide ? 43 : 35 },
    sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 17 },
    eyebrow: { color: p.gold, fontSize: 9, letterSpacing: 1.7, fontWeight: "700" },
    sectionTitle: { color: p.text, fontSize: 22, fontFamily: font.display, marginTop: 6 },
    linkText: { color: p.accent, fontSize: 11, fontWeight: "700", marginBottom: 4 },
    dailyCard: { padding: wide ? 24 : 20, backgroundColor: p.surface, borderWidth: 1, borderColor: p.line, borderRadius: 15 },
    dailyTop: { flexDirection: wide ? "row" : "column", alignItems: wide ? "center" : "flex-start", justifyContent: "space-between", gap: 10 },
    dailyTag: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 20, backgroundColor: p.goldSoft },
    dailyTagText: { color: p.gold, fontSize: 8, letterSpacing: 1, fontWeight: "700" },
    dailyReference: { color: p.muted, fontSize: 9, letterSpacing: 1.1 },
    dailySanskrit: { color: p.text, fontSize: wide ? 21 : 18, lineHeight: wide ? 35 : 31, textAlign: "center", fontFamily: font.display, marginTop: 20 },
    dailyTranslation: { color: p.muted, fontSize: 12, lineHeight: 20, textAlign: "center", maxWidth: 630, alignSelf: "center", marginTop: 12 },
    dailyBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: p.line, marginTop: 20, paddingTop: 15, gap: 8 },
    dailyPrompt: { color: p.muted, fontSize: 11, flexShrink: 1 },
    saveButton: { borderWidth: 1, borderColor: p.line, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
    saveButtonText: { color: p.accent, fontSize: 10, fontWeight: "700" },
    cardsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 11 },
    scriptureCard: { width: wide ? "32%" : "100%", minHeight: 125, backgroundColor: p.surface, borderWidth: 1, borderColor: p.line, borderRadius: 13, padding: 15, flexDirection: "row", alignItems: "center", gap: 12 },
    featuredScriptureCard: { borderColor: p.accent },
    collectionMark: { width: 44, height: 44, borderRadius: 15, backgroundColor: p.goldSoft, alignItems: "center", justifyContent: "center" },
    collectionMarkGita: { backgroundColor: p.accentSoft },
    collectionMarkText: { fontSize: 20, color: p.accent, fontFamily: font.display },
    scriptureCopy: { flex: 1 },
    cardOverline: { color: p.gold, fontSize: 8, letterSpacing: 1, fontWeight: "700" },
    scriptureTitle: { color: p.text, fontSize: 16, fontFamily: font.display, marginTop: 5 },
    scriptureDescription: { color: p.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
    cardArrow: { color: p.muted, fontSize: 18 },
    storyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    storyCard: { width: wide ? "23.8%" : "47.8%", minHeight: 150, padding: 14, borderRadius: 13, backgroundColor: p.surface, borderWidth: 1, borderColor: p.line },
    storyMark: { color: p.gold, fontSize: 21, marginBottom: 8 },
    storyCategory: { color: p.gold, fontSize: 8, letterSpacing: 1.2, fontWeight: "700" },
    storyTitle: { color: p.text, fontSize: 15, fontFamily: font.display, marginTop: 5 },
    storyDescription: { color: p.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
    adSlot: { minHeight: 83, marginTop: 29, borderWidth: 1, borderStyle: "dashed", borderColor: p.line, borderRadius: 12, backgroundColor: p.surface, alignItems: "center", justifyContent: "center", padding: 12 },
    adLabel: { color: p.muted, fontSize: 8, letterSpacing: 1.4, fontWeight: "700" },
    adText: { color: p.text, fontSize: 11, marginTop: 5 },
    adDisclosure: { color: p.muted, fontSize: 9, marginTop: 3 },
    premiumBanner: { marginTop: 27, padding: wide ? 23 : 18, borderRadius: 15, backgroundColor: p.inverse, flexDirection: "row", alignItems: "center", gap: 15, flexWrap: "wrap" },
    premiumBannerIcon: { width: 43, height: 43, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(221,194,147,0.4)", borderRadius: 15 },
    premiumBannerIconText: { fontSize: 23, color: "#D5B77E" },
    premiumBannerCopy: { flex: 1, minWidth: 170 },
    premiumBannerOverline: { color: "#D5B77E", fontSize: 8, letterSpacing: 1, fontWeight: "700" },
    premiumBannerTitle: { color: "#F7F4EA", fontFamily: font.display, fontSize: 17, marginTop: 5 },
    premiumBannerBody: { color: "#C2CFC5", fontSize: 10, marginTop: 4 },
    premiumBannerAction: { color: "#E5D5B7", fontSize: 10, fontWeight: "700" },
    supportRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 23 },
    supportCopy: { flex: 1 },
    supportTitle: { color: p.text, fontFamily: font.display, fontSize: 16 },
    supportBody: { color: p.muted, fontSize: 10, marginTop: 4 },
    secondaryButton: { borderWidth: 1, borderColor: p.line, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 9 },
    secondaryButtonText: { color: p.accent, fontSize: 11, fontWeight: "700" },
    pageTitleBlock: { marginBottom: 24 },
    pageTitle: { color: p.text, fontSize: wide ? 34 : 28, fontFamily: font.display, marginTop: 7, lineHeight: wide ? 42 : 35 },
    pageSubtitle: { color: p.muted, fontSize: 12, lineHeight: 20, marginTop: 8, maxWidth: 640 },
    collectionTabs: { flexDirection: "row", flexWrap: "wrap", gap: 7, borderBottomWidth: 1, borderBottomColor: p.line, paddingBottom: 15 },
    collectionTab: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 20, backgroundColor: p.surfaceAlt },
    collectionTabActive: { backgroundColor: p.accent },
    collectionTabText: { color: p.muted, fontSize: 11, fontWeight: "600" },
    collectionTabTextActive: { color: appTextOnAccent(p) },
    libraryIntro: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 20 },
    libraryCollectionTitle: { color: p.text, fontSize: 21, fontFamily: font.display },
    libraryCollectionSubtitle: { color: p.muted, fontSize: 11, marginTop: 4 },
    libraryCount: { color: p.gold, fontSize: 9, letterSpacing: 1.2, fontWeight: "700" },
    chapterList: { gap: 7 },
    chapterRow: { minHeight: 80, paddingHorizontal: 13, paddingVertical: 12, backgroundColor: p.surface, borderWidth: 1, borderColor: p.line, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 13 },
    chapterNumber: { width: 39, height: 39, borderRadius: 12, backgroundColor: p.surfaceAlt, alignItems: "center", justifyContent: "center" },
    chapterNumberText: { color: p.accent, fontSize: 11, fontWeight: "700" },
    chapterCopy: { flex: 1 },
    chapterTitle: { color: p.text, fontSize: 14, fontFamily: font.display },
    chapterSubtitle: { color: p.gold, fontSize: 10, marginTop: 3 },
    chapterSummary: { color: p.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
    offlineMark: { color: p.accent, fontSize: 17, fontWeight: "700" },
    chapterArrow: { color: p.muted, fontSize: 22 },
    readerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
    backButton: { paddingVertical: 8, paddingRight: 10 },
    backButtonText: { color: p.accent, fontSize: 12, fontWeight: "700" },
    readerActions: { flexDirection: "row", gap: 8 },
    iconButton: { width: 35, height: 35, borderRadius: 18, borderWidth: 1, borderColor: p.line, backgroundColor: p.surface, alignItems: "center", justifyContent: "center" },
    iconButtonGlyph: { color: p.accent, fontSize: 15, fontWeight: "700" },
    readerHeader: { alignItems: "center", paddingHorizontal: wide ? 50 : 10, paddingBottom: 22 },
    readerOverline: { color: p.gold, fontSize: 9, letterSpacing: 1.6, fontWeight: "700", textAlign: "center" },
    readerChapterTitle: { color: p.text, textAlign: "center", fontSize: wide ? 34 : 27, fontFamily: font.display, marginTop: 10 },
    readerSubtitle: { color: p.muted, fontSize: 13, marginTop: 6 },
    readerDivider: { width: 39, height: 2, backgroundColor: p.gold, marginTop: 18, marginBottom: 15 },
    readerSummary: { color: p.muted, fontSize: 12, lineHeight: 21, maxWidth: 590, textAlign: "center" },
    audioCard: { borderRadius: 15, padding: wide ? 21 : 17, borderWidth: 1, borderColor: p.line, backgroundColor: p.surface },
    audioCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    audioEyebrow: { color: p.gold, fontSize: 8, letterSpacing: 1.5, fontWeight: "700" },
    audioTitle: { color: p.text, fontSize: 16, fontFamily: font.display, marginTop: 5 },
    audioTag: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, backgroundColor: p.accentSoft },
    audioTagText: { color: p.accent, fontSize: 8, letterSpacing: 0.7, fontWeight: "700" },
    audioDetail: { color: p.muted, fontSize: 10, marginTop: 4 },
    audioControls: { flexDirection: "row", alignItems: "center", gap: 13, marginTop: 15 },
    playButton: { width: 43, height: 43, borderRadius: 22, backgroundColor: p.accent, alignItems: "center", justifyContent: "center" },
    playButtonLocked: { backgroundColor: p.gold },
    playButtonIcon: { color: appTextOnAccent(p), fontSize: 15, fontWeight: "700" },
    audioTrackWrap: { flex: 1, gap: 7 },
    audioTrack: { height: 3, backgroundColor: p.line, borderRadius: 3 },
    audioProgress: { height: 3, width: "5%", backgroundColor: p.accent, borderRadius: 3 },
    audioProgressActive: { width: "44%" },
    audioTime: { color: p.muted, fontSize: 9 },
    speedControl: { flexDirection: "row", gap: 3, backgroundColor: p.surfaceAlt, padding: 3, borderRadius: 8 },
    speedOption: { paddingHorizontal: 5, paddingVertical: 6, borderRadius: 6 },
    speedOptionActive: { backgroundColor: p.surface },
    speedOptionText: { color: p.muted, fontSize: 9 },
    speedOptionTextActive: { color: p.accent, fontWeight: "700" },
    audioFineprint: { color: p.muted, fontSize: 9, marginTop: 12 },
    verseSection: { marginTop: 29 },
    verseSectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
    verseCount: { color: p.muted, fontSize: 8, letterSpacing: 1, fontWeight: "700" },
    verseCard: { padding: wide ? 21 : 16, backgroundColor: p.surface, borderRadius: 13, borderWidth: 1, borderColor: p.line, marginBottom: 10 },
    verseHeading: { flexDirection: "row", alignItems: "center", gap: 8 },
    verseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: p.gold },
    verseReference: { color: p.gold, fontSize: 9, letterSpacing: 1, fontWeight: "700", flex: 1 },
    verseSave: { color: p.accent, fontSize: 17 },
    verseSanskrit: { color: p.text, fontSize: wide ? 21 : 18, lineHeight: wide ? 35 : 31, textAlign: "center", fontFamily: font.display, marginVertical: 18 },
    verseRule: { height: 1, backgroundColor: p.line },
    translationLabel: { color: p.muted, fontSize: 8, letterSpacing: 1.2, fontWeight: "700", marginTop: 13 },
    verseTranslation: { color: p.text, fontSize: 13, lineHeight: 21, marginTop: 6 },
    chapterSummaryLong: { color: p.text, fontSize: 16, lineHeight: 25, fontFamily: font.display },
    sampleNote: { color: p.muted, fontSize: 10, lineHeight: 16, marginTop: 13 },
    readerFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingVertical: 15 },
    readerPrevious: { padding: 8 },
    readerPreviousText: { color: p.accent, fontSize: 11, fontWeight: "700" },
    readerProgressText: { color: p.muted, fontSize: 10 },
    readerNext: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 8, backgroundColor: p.accent },
    readerNextText: { color: appTextOnAccent(p), fontSize: 10, fontWeight: "700" },
    savedSection: { marginBottom: 29 },
    savedHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
    savedCount: { color: p.accent, backgroundColor: p.accentSoft, overflow: "hidden", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontWeight: "700" },
    savedRow: { minHeight: 65, flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 11, backgroundColor: p.surface, borderWidth: 1, borderColor: p.line, marginBottom: 7 },
    savedMark: { width: 33, height: 33, borderRadius: 11, backgroundColor: p.goldSoft, alignItems: "center", justifyContent: "center" },
    savedMarkText: { color: p.gold, fontSize: 13 },
    savedCopy: { flex: 1 },
    savedTitle: { color: p.text, fontSize: 12, fontWeight: "600" },
    savedSubtitle: { color: p.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
    savedRemove: { color: p.muted, fontSize: 22, paddingHorizontal: 4 },
    emptyCard: { alignItems: "center", padding: 28, backgroundColor: p.surface, borderRadius: 13, borderWidth: 1, borderColor: p.line },
    emptyIcon: { color: p.gold, fontSize: 26 },
    emptyTitle: { color: p.text, fontFamily: font.display, fontSize: 17, marginTop: 10 },
    emptyBody: { color: p.muted, fontSize: 11, marginTop: 5 },
    offlinePrompt: { padding: 19, borderRadius: 12, backgroundColor: p.surfaceAlt },
    offlinePromptTitle: { color: p.text, fontFamily: font.display, fontSize: 16 },
    offlinePromptText: { color: p.muted, fontSize: 11, lineHeight: 17, marginTop: 5, marginBottom: 12 },
    offlineBadge: { width: 32, height: 32, borderRadius: 10, backgroundColor: p.accentSoft, alignItems: "center", justifyContent: "center" },
    offlineBadgeText: { color: p.accent, fontSize: 16, fontWeight: "700" },
    offlineStatus: { color: p.accent, fontSize: 8, letterSpacing: 0.6, fontWeight: "700" },
    premiumHero: { alignItems: "center", paddingVertical: wide ? 20 : 9, marginBottom: 24 },
    premiumHeroIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: p.goldSoft, alignItems: "center", justifyContent: "center" },
    premiumHeroIconText: { color: p.gold, fontSize: 29 },
    premiumOverline: { color: p.gold, fontSize: 9, letterSpacing: 1.7, fontWeight: "700", marginTop: 15 },
    premiumTitle: { color: p.text, fontSize: wide ? 36 : 30, fontFamily: font.display, marginTop: 7 },
    premiumSubtitle: { color: p.muted, fontSize: 12, textAlign: "center", lineHeight: 19, maxWidth: 410, marginTop: 7 },
    unlockedBadge: { paddingHorizontal: 12, paddingVertical: 7, backgroundColor: p.accentSoft, borderRadius: 15, marginTop: 13 },
    unlockedBadgeText: { color: p.accent, fontSize: 8, letterSpacing: 0.7, fontWeight: "700" },
    plansRow: { flexDirection: wide ? "row" : "column", justifyContent: "center", gap: 13, maxWidth: 700, alignSelf: "center", width: "100%" },
    planCard: { flex: 1, minWidth: wide ? 280 : undefined, position: "relative", padding: 20, borderRadius: 15, borderWidth: 1, borderColor: p.line, backgroundColor: p.surface },
    planCardFeatured: { borderColor: p.gold },
    bestValue: { position: "absolute", top: -1, right: 17, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: p.gold },
    bestValueText: { color: "#fff", fontSize: 8, letterSpacing: 0.8, fontWeight: "700" },
    planName: { color: p.text, fontSize: 13, fontWeight: "600", marginTop: 3 },
    planPriceRow: { flexDirection: "row", alignItems: "baseline", marginTop: 13 },
    planPrice: { color: p.text, fontFamily: font.display, fontSize: 34 },
    planPeriod: { color: p.muted, fontSize: 11, marginLeft: 5 },
    planNote: { color: p.muted, fontSize: 10, marginTop: 3, minHeight: 15 },
    planDivider: { height: 1, backgroundColor: p.line, marginVertical: 16 },
    planFeature: { color: p.text, fontSize: 11, marginBottom: 11 },
    featureCheck: { color: p.accent, fontWeight: "700" },
    planButtonSecondary: { height: 41, alignItems: "center", justifyContent: "center", borderRadius: 9, borderWidth: 1, borderColor: p.line, marginTop: 7 },
    planButtonSecondaryText: { color: p.accent, fontSize: 10, fontWeight: "700" },
    planButtonPrimary: { height: 41, alignItems: "center", justifyContent: "center", borderRadius: 9, backgroundColor: p.accent, marginTop: 7 },
    planButtonPrimaryText: { color: appTextOnAccent(p), fontSize: 10, fontWeight: "700" },
    demoDisclaimer: { maxWidth: 640, alignSelf: "center", textAlign: "center", color: p.muted, fontSize: 9, lineHeight: 16, marginTop: 17 },
    premiumAdNote: { maxWidth: 640, alignSelf: "center", marginTop: 24, padding: 15, borderRadius: 11, backgroundColor: p.surfaceAlt },
    premiumAdNoteTitle: { color: p.text, fontFamily: font.display, fontSize: 14 },
    premiumAdNoteText: { color: p.muted, fontSize: 10, lineHeight: 16, marginTop: 5 },
    donationCard: { maxWidth: 530, alignSelf: "center", width: "100%", padding: wide ? 28 : 20, alignItems: "center", borderRadius: 16, borderWidth: 1, borderColor: p.line, backgroundColor: p.surface },
    developerCard: { padding: wide ? 21 : 17, borderRadius: 14, borderWidth: 1, borderColor: p.line, backgroundColor: p.surface, marginBottom: 14 },
    developerIdentity: { flexDirection: "row", alignItems: "center", gap: 12 },
    developerAvatar: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: p.accentSoft },
    developerAvatarText: { color: p.accent, fontSize: 14, fontWeight: "700" },
    developerCopy: { flex: 1 },
    developerEyebrow: { color: p.gold, fontSize: 8, letterSpacing: 1.1, fontWeight: "700" },
    developerName: { color: p.text, fontFamily: font.display, fontSize: 19, marginTop: 3 },
    developerSubtitle: { color: p.muted, fontSize: 10, marginTop: 3 },
    developerDescription: { color: p.muted, fontSize: 11, lineHeight: 18, marginTop: 14 },
    adminLinks: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    manageProjectButton: { alignSelf: "flex-start", paddingHorizontal: 13, paddingVertical: 10, borderRadius: 9, backgroundColor: p.accentSoft, marginTop: 12 },
    manageProjectButtonText: { color: p.accent, fontSize: 10, fontWeight: "700" },
    developerDisclaimer: { color: p.muted, fontSize: 9, lineHeight: 15, marginTop: 12 },
    freeAccessNote: { padding: wide ? 19 : 16, borderRadius: 13, backgroundColor: p.accentSoft, marginBottom: 18 },
    freeAccessTitle: { color: p.accent, fontFamily: font.display, fontSize: 16 },
    freeAccessBody: { color: p.text, fontSize: 10, lineHeight: 16, marginTop: 6 },
    donationMark: { width: 49, height: 49, borderRadius: 17, backgroundColor: p.goldSoft, alignItems: "center", justifyContent: "center" },
    donationMarkText: { color: p.gold, fontSize: 18, fontFamily: font.display },
    donationEyebrow: { color: p.gold, fontSize: 8, letterSpacing: 1.6, fontWeight: "700", marginTop: 14 },
    donationTitle: { color: p.text, fontSize: 25, fontFamily: font.display, marginTop: 6, textAlign: "center" },
    donationDescription: { color: p.muted, fontSize: 11, lineHeight: 18, textAlign: "center", maxWidth: 360, marginTop: 7 },
    amountRow: { flexDirection: "row", gap: 7, marginTop: 18, flexWrap: "wrap", justifyContent: "center" },
    amountOption: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 9, borderWidth: 1, borderColor: p.line },
    amountOptionActive: { borderColor: p.accent, backgroundColor: p.accentSoft },
    amountOptionText: { color: p.text, fontSize: 11 },
    amountOptionTextActive: { color: p.accent, fontWeight: "700" },
    donateButton: { width: "100%", alignItems: "center", borderRadius: 9, paddingVertical: 12, backgroundColor: p.accent, marginTop: 14 },
    donateButtonText: { color: appTextOnAccent(p), fontSize: 11, fontWeight: "700" },
    donationDisclaimer: { color: p.muted, fontSize: 9, marginTop: 8 },
    comingSoonGrid: { flexDirection: "row", flexWrap: "wrap", gap: 11, marginTop: 20 },
    comingSoonCard: { flex: 1, minWidth: wide ? 240 : "100%", padding: 17, borderRadius: 13, backgroundColor: p.surface, borderWidth: 1, borderColor: p.line },
    comingSoonIcon: { color: p.gold, fontSize: 22 },
    comingSoonTag: { color: p.gold, fontSize: 8, letterSpacing: 1.1, fontWeight: "700", marginTop: 10 },
    comingSoonTitle: { color: p.text, fontSize: 17, fontFamily: font.display, marginTop: 4 },
    comingSoonBody: { color: p.muted, fontSize: 10, lineHeight: 16, marginTop: 5 },
    preferenceCard: { padding: wide ? 20 : 16, borderRadius: 13, backgroundColor: p.surface, borderWidth: 1, borderColor: p.line, marginTop: 23 },
    preferenceRow: { minHeight: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: p.line, marginTop: 12, paddingTop: 12 },
    preferenceTitle: { color: p.text, fontSize: 12, fontWeight: "600" },
    preferenceSubtitle: { color: p.muted, fontSize: 10, marginTop: 4 },
    languageChangeButton: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 8, backgroundColor: p.accentSoft },
    languageChangeText: { color: p.accent, fontSize: 10, fontWeight: "700" },
    bottomNav: { minHeight: 60, paddingBottom: 4, paddingTop: 5, borderTopWidth: 1, borderTopColor: p.line, backgroundColor: p.surface, flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
    navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2, minHeight: 48 },
    navIcon: { color: p.muted, fontSize: 18 },
    navLabel: { color: p.muted, fontSize: 9 },
    navActive: { color: p.accent, fontWeight: "700" },
    footer: { borderTopWidth: 1, borderTopColor: p.line, marginTop: 33, paddingTop: 16, flexDirection: wide ? "row" : "column", alignItems: wide ? "center" : "flex-start", justifyContent: "space-between", gap: 8 },
    footerBrand: { color: p.text, fontSize: 12, fontFamily: font.display },
    footerText: { color: p.muted, fontSize: 9 },
    footerLink: { color: p.accent, fontSize: 9, fontWeight: "700" },
    toast: { position: "absolute", bottom: wide ? 24 : 74, alignSelf: "center", maxWidth: "90%", borderRadius: 10, backgroundColor: p.inverse, paddingHorizontal: 16, paddingVertical: 11, elevation: 8 },
    toastText: { color: appTextOnInverse(p), fontSize: 11, textAlign: "center" },
  });
}

function appTextOnAccent(palette: Palette): string {
  return palette === DARK ? "#142820" : "#FFFFFF";
}

function appTextOnInverse(palette: Palette): string {
  return palette === DARK ? "#142820" : "#FFFFFF";
}
