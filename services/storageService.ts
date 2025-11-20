import { User, JournalEntry, MoodLog, Badge } from '../types';
import { INITIAL_BADGES as CONST_BADGES } from '../constants';

const KEYS = {
  USER: 'gratitude_user',
  JOURNAL: 'gratitude_entries',
  MOOD: 'gratitude_moods',
  BADGES: 'gratitude_badges',
  STREAK: 'gratitude_streak'
};

// Helper to simulate async delay for realism
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const storageService = {
  // Auth
  getUser: (): User | null => {
    const data = localStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },
  
  login: async (username: string): Promise<User> => {
    await delay(500);
    const user = { username, createdAt: new Date().toISOString() };
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
    // Initialize badges if new
    if (!localStorage.getItem(KEYS.BADGES)) {
        localStorage.setItem(KEYS.BADGES, JSON.stringify(CONST_BADGES));
    }
    return user;
  },

  logout: () => {
    localStorage.removeItem(KEYS.USER);
  },

  // Journal
  getEntries: async (): Promise<JournalEntry[]> => {
    // await delay(300);
    const data = localStorage.getItem(KEYS.JOURNAL);
    return data ? JSON.parse(data).sort((a: JournalEntry, b: JournalEntry) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];
  },

  addEntry: async (entry: Omit<JournalEntry, 'id'>): Promise<JournalEntry> => {
    await delay(300);
    const entries = await storageService.getEntries();
    const newEntry = { ...entry, id: crypto.randomUUID() };
    localStorage.setItem(KEYS.JOURNAL, JSON.stringify([newEntry, ...entries]));
    await storageService.checkBadges('journal_count', entries.length + 1);
    return newEntry;
  },

  updateEntry: async (updatedEntry: JournalEntry): Promise<void> => {
    const entries = await storageService.getEntries();
    const index = entries.findIndex(e => e.id === updatedEntry.id);
    if (index !== -1) {
      entries[index] = updatedEntry;
      localStorage.setItem(KEYS.JOURNAL, JSON.stringify(entries));
    }
  },

  // Mood
  getMoods: async (): Promise<MoodLog[]> => {
    const data = localStorage.getItem(KEYS.MOOD);
    return data ? JSON.parse(data) : [];
  },

  addMood: async (mood: Omit<MoodLog, 'id'>): Promise<MoodLog> => {
    await delay(300);
    const moods = await storageService.getMoods();
    const newMood = { ...mood, id: crypto.randomUUID() };
    // Keep only last 30 days for simplicity in this demo, but store all
    localStorage.setItem(KEYS.MOOD, JSON.stringify([...moods, newMood]));
    await storageService.checkBadges('mood_count', moods.length + 1);
    return newMood;
  },

  // Rewards/Badges
  getBadges: (): Badge[] => {
    const data = localStorage.getItem(KEYS.BADGES);
    return data ? JSON.parse(data) : CONST_BADGES;
  },

  getStreak: async (): Promise<number> => {
    const entries = await storageService.getEntries();
    if (entries.length === 0) return 0;

    const uniqueDates = Array.from(new Set(entries.map(e => e.date.split('T')[0]))).sort().reverse();
    if (uniqueDates.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // If the last entry wasn't today or yesterday, streak is broken (or 0)
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
        return 0;
    }

    let streak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
        const current = new Date(uniqueDates[i]);
        const prev = new Date(uniqueDates[i+1]);
        const diffTime = current.getTime() - prev.getTime();
        const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

        if (diffDays === 1) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
  },

  checkBadges: async (type: 'journal_count' | 'mood_count' | 'cbt_use', count: number) => {
    const currentBadges = storageService.getBadges();
    let updated = false;

    const updateBadge = (id: string) => {
        const badge = currentBadges.find(b => b.id === id);
        if (badge && !badge.unlocked) {
            badge.unlocked = true;
            updated = true;
        }
    };

    if (type === 'journal_count') {
        if (count >= 1) updateBadge('first_step');
        
        const streak = await storageService.getStreak();
        if (streak >= 3) updateBadge('streak_3');
        if (streak >= 7) updateBadge('streak_7');
    }

    if (type === 'mood_count') {
        if (count >= 10) updateBadge('mood_master');
    }

    if (type === 'cbt_use') {
        updateBadge('cbt_explorer');
    }

    if (updated) {
        localStorage.setItem(KEYS.BADGES, JSON.stringify(currentBadges));
    }
  }
};