import AsyncStorage from "@react-native-async-storage/async-storage";
import { Chapter } from "./data/scriptures";

const STORAGE_KEY = "sanatan-path:app-state:v1";

export type AppState = {
  language: string;
  darkMode: boolean;
  bookmarks: string[];
  offlineChapters: string[];
  offlineContent: Record<string, { collectionTitle: string; chapter: Chapter }>;
  premiumDemo: boolean;
  dailyReminder: boolean;
};

export const defaultState: AppState = {
  language: "en",
  darkMode: false,
  bookmarks: [],
  offlineChapters: [],
  offlineContent: {},
  premiumDemo: false,
  dailyReminder: false,
};

export async function loadAppState(): Promise<AppState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState;
  const saved: unknown = JSON.parse(raw);
  if (typeof saved !== "object" || saved === null) return defaultState;
  const value = saved as Partial<AppState>;
  return {
    language: typeof value.language === "string" ? value.language : defaultState.language,
    darkMode: typeof value.darkMode === "boolean" ? value.darkMode : defaultState.darkMode,
    bookmarks: Array.isArray(value.bookmarks) ? value.bookmarks.filter((item): item is string => typeof item === "string") : [],
    offlineChapters: Array.isArray(value.offlineChapters) ? value.offlineChapters.filter((item): item is string => typeof item === "string") : [],
    offlineContent: typeof value.offlineContent === "object" && value.offlineContent !== null
      ? value.offlineContent as AppState["offlineContent"]
      : {},
    premiumDemo: typeof value.premiumDemo === "boolean" ? value.premiumDemo : defaultState.premiumDemo,
    dailyReminder: typeof value.dailyReminder === "boolean" ? value.dailyReminder : defaultState.dailyReminder,
  };
}

export async function saveAppState(state: AppState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
