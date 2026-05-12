import React, { useState, useEffect, useCallback, useMemo, Component } from "react";
import { get as idbGet, set as idbSet } from "idb-keyval";

// ──────────────── STORAGE HELPER ────────────────
const storage = {
  async get(key) {
    try {
      // Auto-migrate from localStorage if exists
      const oldV = localStorage.getItem(key);
      let v = await idbGet(key);
      if (v === undefined && oldV) {
        v = JSON.parse(oldV);
        await idbSet(key, v);
      }
      return v !== undefined ? v : null;
    } catch { return null; }
  },
  async set(key, value) {
    try { await idbSet(key, value); } catch {}
  },
};

// ──────────────── DATA ────────────────
const WEEK_DAYS = [
  { id: 0, day: "Senin", shortDay: "SEN" },
  { id: 1, day: "Selasa", shortDay: "SEL" },
  { id: 2, day: "Rabu", shortDay: "RAB" },
  { id: 3, day: "Kamis", shortDay: "KAM" },
  { id: 4, day: "Jumat", shortDay: "JUM" },
  { id: 5, day: "Sabtu", shortDay: "SAB" },
  { id: 6, day: "Minggu", shortDay: "MIN" },
];

const WORKOUT_LIBRARY = {
  pull: {
    id: "pull", title: "PULL", subtitle: "Punggung & Bisep", emoji: "🔙", color: "#FF6B35",
    exercises: {
      minimum: { label: "Minimum", totalSets: "9 Set", items: ["Lat Pulldown (3x12)", "Chest-Supported Row (3x12)", "Machine Bicep Curl (3x15)"] },
      optimal: { label: "Optimal", totalSets: "15 Set", items: ["Lat Pulldown (3x12)", "Chest-Supported Row (3x12)", "Seated Cable Row (3x12)", "Face Pulls (3x15)", "Seated DB Hammer Curl (3x12)"] },
      maximum: { label: "Maximum", totalSets: "23 Set", items: ["Lat Pulldown (3x12)", "Straight Arm Pulldown (3x15)", "Chest-Supported Row (4x10)", "Seated Cable Row (3x12)", "Rev. Pec Deck (4x15)", "Incline DB Curl (3x12)", "Machine Preacher Curl (3x15)"] },
    },
  },
  push: {
    id: "push", title: "PUSH", subtitle: "Dada, Bahu, Trisep", emoji: "💪", color: "#E63946",
    exercises: {
      minimum: { label: "Minimum", totalSets: "9 Set", items: ["Seated Machine Chest Press (3x12)", "Seated Machine Shoulder Press (3x12)", "Triceps Cable Pushdown (3x15)"] },
      optimal: { label: "Optimal", totalSets: "15 Set", items: ["Machine Chest Press (3x12)", "Incline Machine Press (3x12)", "Pec Deck Fly (3x15)", "Seated Shoulder Press (3x12)", "Triceps Pushdown (3x15)"] },
      maximum: { label: "Maximum", totalSets: "23 Set", items: ["Machine Chest Press (4x10)", "Incline Machine Press (3x12)", "Pec Deck Fly (4x15)", "Seated Shoulder Press (3x12)", "Seated Lateral Raise (3x15)", "Triceps Pushdown (3x15)", "Overhead Cable Tricep Ext. (3x15)"] },
    },
  },
  legs: {
    id: "legs", title: "LEGS & LISS", subtitle: "Kaki & Kardio", emoji: "🦵", color: "#2EC4B6",
    exercises: {
      minimum: { label: "Minimum", totalSets: "6 Set + 15m", items: ["Leg Extension (3x15)", "Seated Leg Curl (3x15)", "Jalan Treadmill 15 Menit"] },
      optimal: { label: "Optimal", totalSets: "9 Set + 30m", items: ["Leg Extension (3x15)", "Seated Leg Curl (3x15)", "Seated Calf Raise (3x20)", "Jalan Treadmill 30 Menit"] },
      maximum: { label: "Maximum", totalSets: "15 Set + 45m", items: ["Leg Extension (4x15)", "Seated Leg Curl (4x15)", "Seated Calf Raise (4x20)", "Seated Hip Abductor (3x15)", "Jalan Treadmill 45 Menit"] },
    },
  },
  upper: {
    id: "upper", title: "UPPER MIX", subtitle: "Dada, Punggung, Bahu", emoji: "🎯", color: "#9B5DE5",
    exercises: {
      minimum: { label: "Minimum", totalSets: "9 Set", items: ["Lat Pulldown (3x12)", "Machine Chest Press (3x12)", "Seated Lateral Raise - DB ringan (3x15)"] },
      optimal: { label: "Optimal", totalSets: "15 Set", items: ["Lat Pulldown (3x12)", "Chest-Supported Row (3x12)", "Incline Machine Press (3x12)", "Pec Deck Fly (3x15)", "Seated Lateral Raise (3x15)"] },
      maximum: { label: "Maximum", totalSets: "23 Set", items: ["Lat Pulldown (4x12)", "Chest-Supported Row (4x12)", "Machine Chest Press (4x12)", "Pec Deck Fly (3x15)", "Seated Lateral Raise (4x15)", "Shrugs Duduk (4x15)"] },
    },
  },
  fatburn: {
    id: "fatburn", title: "FAT BURN", subtitle: "LISS Recovery", emoji: "🔥", color: "#F77F00",
    exercises: {
      minimum: { label: "Minimum", totalSets: "20 Min", items: ["Sepeda Statis Recumbent 20 Menit"] },
      optimal: { label: "Optimal", totalSets: "40 Min", items: ["Jalan Treadmill (Incline 3-5%, 4-5 km/jam) 40 Menit"] },
      maximum: { label: "Maximum", totalSets: "60 Min", items: ["Sepeda Recumbent 30 Menit", "Jalan Treadmill (Kemiringan ringan) 30 Menit"] },
    },
  },
  rest: {
    id: "rest", title: "REST DAY", subtitle: "Pemulihan Tubuh", emoji: "🧘", color: "#64748b",
    exercises: {
      minimum: { label: "Minimum", totalSets: "Rest", items: ["Selesai Istirahat"] },
      optimal: { label: "Optimal", totalSets: "Rest + Stretch", items: ["Selesai Istirahat", "Peregangan Ringan 10 Menit"] },
      maximum: { label: "Maximum", totalSets: "Active Rest", items: ["Selesai Istirahat", "Peregangan Ringan 10 Menit", "Jalan Kaki Santai 20 Menit"] },
    },
  },
};

const TIER_CFG = {
  minimum: { label: "MIN", border: "#64748b", icon: "⚡", xp: 2 },
  optimal: { label: "OPT", border: "#3b82f6", icon: "🚀", xp: 4 },
  maximum: { label: "MAX", border: "#a855f7", icon: "👑", xp: 7 },
};

// Realistic gym progression: ~3-5 XP/day avg → months per rank, years to top
const RANKS = [
  { name: "Couch Potato",    icon: "🥔", minXP: 0,      color: "#6b7280" },
  { name: "First Step",      icon: "👟", minXP: 30,     color: "#94a3b8" },
  { name: "Gym Rookie",      icon: "🌱", minXP: 80,     color: "#78a55a" },
  { name: "Iron Initiate",   icon: "⚙️", minXP: 180,    color: "#a8a29e" },
  { name: "Bronze Grinder",  icon: "🥉", minXP: 350,    color: "#cd7f32" },
  { name: "Steel Will",      icon: "🛡️", minXP: 600,    color: "#71717a" },
  { name: "Silver Fury",     icon: "🥈", minXP: 1000,   color: "#c0c0c0" },
  { name: "Iron Wolf",       icon: "🐺", minXP: 1600,   color: "#8b9dc3" },
  { name: "Gold Warrior",    icon: "🥇", minXP: 2500,   color: "#ffd700" },
  { name: "Platinum Beast",  icon: "💎", minXP: 4000,   color: "#00d4ff" },
  { name: "Diamond Core",    icon: "💠", minXP: 6000,   color: "#b45fff" },
  { name: "Obsidian Titan",  icon: "🗿", minXP: 9000,   color: "#1e1b4b" },
  { name: "Phoenix Rising",  icon: "🔥", minXP: 13000,  color: "#ef4444" },
  { name: "Shadow Olympian", icon: "⚡", minXP: 18000,  color: "#6366f1" },
  { name: "Crimson Emperor", icon: "👑", minXP: 25000,  color: "#dc2626" },
  { name: "Astral Demigod",  icon: "🌟", minXP: 35000,  color: "#f59e0b" },
  { name: "Void Sovereign",  icon: "🌀", minXP: 50000,  color: "#7c3aed" },
  { name: "Eternal Apex",    icon: "♾️", minXP: 75000,  color: "#14b8a6" },
  { name: "Mythic Legend",   icon: "🔱", minXP: 110000, color: "#ff4500" },
  { name: "G.O.A.T.",        icon: "🐐", minXP: 160000, color: "#fbbf24" },
];

const STORAGE_KEY = "gym-app-v2";
const today = () => new Date().toISOString().slice(0, 10);

// Get ISO week ID like "2026-W20" for auto week tracking
const getWeekId = () => {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

const EXERCISE_LIBRARY = [
  "Bench Press", "Squat", "Deadlift", "Overhead Press", "Barbell Row", 
  "Pull Up", "Lat Pulldown", "Leg Press", "Bicep Curl", "Tricep Extension", 
  "Incline Bench Press", "Romanian Deadlift", "Bulgarian Split Squat",
  "Dumbbell Press", "Lateral Raise", "Leg Extension", "Leg Curl"
];

// ──────────────── ACHIEVEMENTS ────────────────
const ACHIEVEMENTS = [
  // Workout milestones
  { id: "first_blood",   icon: "🩸", name: "First Blood",        desc: "Selesaikan workout pertama",     check: s => (s.totalWorkouts || 0) >= 1,   category: "workout" },
  { id: "getting_warm",  icon: "🌡️", name: "Getting Warm",       desc: "Selesaikan 10 workouts",         check: s => (s.totalWorkouts || 0) >= 10,  category: "workout" },
  { id: "iron_habit",    icon: "⚒️", name: "Iron Habit",         desc: "Selesaikan 50 workouts",         check: s => (s.totalWorkouts || 0) >= 50,  category: "workout" },
  { id: "centurion",     icon: "🏛️", name: "Centurion",          desc: "Selesaikan 100 workouts",        check: s => (s.totalWorkouts || 0) >= 100, category: "workout" },
  { id: "spartan",       icon: "⚔️", name: "Spartan 300",        desc: "Selesaikan 300 workouts",        check: s => (s.totalWorkouts || 0) >= 300, category: "workout" },
  { id: "titan_grind",   icon: "🗿", name: "Titan Grind",        desc: "Selesaikan 1000 workouts",       check: s => (s.totalWorkouts || 0) >= 1000,category: "workout" },
  // Streak milestones
  { id: "on_fire",       icon: "🔥", name: "On Fire",            desc: "Streak 3 hari berturut-turut",   check: s => (s.streak || 0) >= 3,          category: "streak" },
  { id: "iron_week",     icon: "📅", name: "Iron Week",          desc: "Streak 7 hari berturut-turut",   check: s => (s.streak || 0) >= 7,          category: "streak" },
  { id: "unstoppable",   icon: "🚂", name: "Unstoppable",        desc: "Streak 14 hari berturut-turut",  check: s => (s.streak || 0) >= 14,         category: "streak" },
  { id: "machine",       icon: "🤖", name: "Machine",            desc: "Streak 30 hari berturut-turut",  check: s => (s.streak || 0) >= 30,         category: "streak" },
  { id: "no_days_off",   icon: "♾️", name: "No Days Off",        desc: "Streak 100 hari berturut-turut", check: s => (s.streak || 0) >= 100,        category: "streak" },
  // Week milestones
  { id: "month_one",     icon: "📆", name: "Month One",          desc: "Selesaikan 4 minggu",            check: s => (s.weekHistory || []).length >= 4,  category: "milestone" },
  { id: "quarter_beast", icon: "🦁", name: "Quarter Beast",      desc: "Selesaikan 12 minggu (3 bulan)", check: s => (s.weekHistory || []).length >= 12, category: "milestone" },
  { id: "half_year",     icon: "🌗", name: "Half-Year Hero",     desc: "Selesaikan 26 minggu (6 bulan)", check: s => (s.weekHistory || []).length >= 26, category: "milestone" },
  { id: "year_of_steel", icon: "🏆", name: "Year of Steel",      desc: "Selesaikan 52 minggu (1 tahun)", check: s => (s.weekHistory || []).length >= 52, category: "milestone" },
  // Misc
  { id: "know_thyself",  icon: "🪞", name: "Know Thyself",       desc: "Isi berat dan tinggi badan",     check: s => s.weight > 0 && s.height > 0,      category: "misc" },
  { id: "record_setter", icon: "📝", name: "Record Setter",      desc: "Catat PR pertamamu",             check: s => Object.keys(s.personalRecords || {}).length >= 1, category: "misc" },
  { id: "pr_collector",  icon: "🎯", name: "PR Collector",       desc: "Catat 5 Personal Records",       check: s => Object.keys(s.personalRecords || {}).length >= 5, category: "misc" },
  { id: "scale_master",  icon: "⚖️", name: "Scale Master",       desc: "Log berat badan 7 kali",         check: s => (s.weightHistory || []).length >= 7, category: "misc" },
  { id: "max_mode",      icon: "👑", name: "Maximum Effort",     desc: "Pilih tier MAXIMUM",             check: s => s.selectedTier === "maximum",       category: "misc" },
];

const defaultState = {
  checkedItems: {},
  selectedTier: "optimal",
  xp: 0,
  totalWorkouts: 0,
  streak: 0,
  lastWorkoutDate: null,
  weekHistory: [],
  currentWeekId: null,
  protein: {},
  water: {},
  sleep: {},
  calories: {},
  proteinGoal: 120,
  waterGoal: 8,
  sleepGoal: 8,
  calorieGoal: 2500,
  weight: 0,
  height: 0,
  personalRecords: {},
  weightHistory: [],
  customSchedule: ["pull", "push", "legs", "upper", "fatburn", "rest", "rest"],
  customRoutines: {}, // { "pull": ["3_4_Sit-Up", "Adductor"], ... }
  avatarUrl: "",
};

// ──────────────── APP ────────────────
export default function App() {
  const [state, setState] = useState(defaultState);
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [tab, setTab] = useState("workout");
  const [activeDay, setActiveDay] = useState(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1; // 0=Sunday->6, 1=Monday->0
  });
  
  const weekDates = useMemo(() => {
    const dates = [];
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d.getDate());
    }
    return dates;
  }, []);

  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [exerciseDb, setExerciseDb] = useState([]);
  const [editingRoutine, setEditingRoutine] = useState(null); // e.g. "pull"

  useEffect(() => {
    fetch('/exercises.json')
      .then(r => r.json())
      .then(data => setExerciseDb(data))
      .catch(console.error);
  }, []);
  useEffect(() => {
    let mounted = true;
    const loadDb = async () => {
      const saved = await storage.get(STORAGE_KEY);
      if (mounted) {
        if (saved) {
          let s = { ...defaultState, ...saved };
          // ── Auto week reset based on calendar ──
          const thisWeek = getWeekId();
          if (s.currentWeekId && s.currentWeekId !== thisWeek) {
            // New week detected! Save old week to history
            const schedule = s.customSchedule || defaultState.customSchedule;
            const tier = s.selectedTier || 'optimal';
            let completed = 0;
            for (let dayId = 0; dayId < 7; dayId++) {
              const routineId = schedule[dayId];
              if (routineId === 'rest') continue;
              const lib = WORKOUT_LIBRARY[routineId];
              if (!lib) continue;
              const custom = s.customRoutines?.[routineId];
              let itemCount = 0;
              if (custom && custom.length > 0) {
                const limit = tier === 'minimum' ? 4 : tier === 'optimal' ? 6 : 10;
                itemCount = Math.min(custom.length, limit);
              } else {
                itemCount = (lib.exercises[tier]?.items || []).length;
              }
              if (itemCount > 0) {
                const allDone = Array.from({length: itemCount}, (_, i) => !!s.checkedItems[`${dayId}-${tier}-${i}`]).every(Boolean);
                if (allDone) completed++;
              }
            }
            if (completed > 0) {
              s.weekHistory = [
                {
                  date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
                  weekId: s.currentWeekId,
                  tier: tier,
                  completedDays: completed,
                  totalDays: 7,
                },
                ...(s.weekHistory || [])
              ].slice(0, 52);
            }
            s.checkedItems = {};
            s.currentWeekId = thisWeek;
            storage.set(STORAGE_KEY, s);
          } else if (!s.currentWeekId) {
            s.currentWeekId = thisWeek;
            storage.set(STORAGE_KEY, s);
          }
          setState(s);
        } else {
          // First time user
          const init = { ...defaultState, currentWeekId: getWeekId() };
          setState(init);
          storage.set(STORAGE_KEY, init);
        }
        setIsDbLoaded(true);
      }
    };
    loadDb();
    return () => { mounted = false; };
  }, []);
  const [toast, setToast] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  const [newPrExercise, setNewPrExercise] = useState("");
  const [newPrWeight, setNewPrWeight] = useState("");
  const [newPrReps, setNewPrReps] = useState("");

  const handleAddPR = () => {
    if (!newPrExercise || !newPrWeight) return;
    update(s => ({
      ...s,
      personalRecords: {
        ...(s.personalRecords || {}),
        [newPrExercise]: { weight: Number(newPrWeight), reps: Number(newPrReps) || 1 }
      }
    }));
    setNewPrExercise("");
    setNewPrWeight("");
    setNewPrReps("");
    showToast("PR Saved!");
  };

  const save = useCallback((s) => { storage.set(STORAGE_KEY, s); }, []);

  const update = useCallback((fn) => {
    setState((prev) => {
      const next = fn(prev);
      save(next);
      return next;
    });
  }, [save]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  // ── Workout logic ──
  const getRoutineExercises = (routineId, tier, s = state) => {
    const custom = s.customRoutines?.[routineId];
    if (custom && custom.length > 0) {
      const limit = tier === "minimum" ? 4 : tier === "optimal" ? 6 : 10;
      return custom.slice(0, limit).map(exId => {
         const dbEx = exerciseDb.find(e => e.id === exId);
         return dbEx || { id: exId, name: exId, isCustom: true };
      });
    }
    const defaultItems = WORKOUT_LIBRARY[routineId]?.exercises[tier]?.items || [];
    return defaultItems.map(name => ({ id: name, name, isCustom: false }));
  };

  const toggleItem = (dayId, tier, idx) => {
    const key = `${dayId}-${tier}-${idx}`;
    update((s) => {
      const wasChecked = !!s.checkedItems[key];
      const next = { ...s, checkedItems: { ...s.checkedItems, [key]: !wasChecked } };
      const schedule = s.customSchedule || defaultState.customSchedule;
      const routineId = schedule[dayId];
      const exItems = getRoutineExercises(routineId, tier, s);

      if (exItems.length > 0) {
        if (!wasChecked) {
          const allDone = exItems.every((_, i) => i === idx || !!s.checkedItems[`${dayId}-${tier}-${i}`]);
          if (allDone) {
            const earnedXP = TIER_CFG[tier].xp;
            next.xp = (s.xp || 0) + earnedXP;
            next.totalWorkouts = (s.totalWorkouts || 0) + 1;
            const d = today();
            if (s.lastWorkoutDate !== d) {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yStr = yesterday.toISOString().slice(0, 10);
              next.streak = s.lastWorkoutDate === yStr ? (s.streak || 0) + 1 : 1;
            }
            next.lastWorkoutDate = d;
            showToast(`+${earnedXP} XP — ${WORKOUT_LIBRARY[routineId].title} complete!`);
          }
        } else {
          const wasAllDone = exItems.every((_, i) => !!s.checkedItems[`${dayId}-${tier}-${i}`]);
          if (wasAllDone) {
            const earnedXP = TIER_CFG[tier].xp;
            next.xp = Math.max(0, (s.xp || 0) - earnedXP);
            next.totalWorkouts = Math.max(0, (s.totalWorkouts || 0) - 1);
            showToast(`-${earnedXP} XP (Batal Selesai)`);
          }
        }
      }
      return next;
    });
  };

  const getDayProgress = (dayId) => {
    const schedule = state.customSchedule || defaultState.customSchedule;
    const routineId = schedule[dayId];
    const exItems = getRoutineExercises(routineId, state.selectedTier, state);
    if (!exItems || exItems.length === 0) return 0;
    const done = exItems.filter((_, i) => state.checkedItems[`${dayId}-${state.selectedTier}-${i}`]).length;
    return Math.round((done / exItems.length) * 100);
  };

  const resetWeek = () => {
    const completed = WEEK_DAYS.filter((d) => getDayProgress(d.id) === 100).length;
    update((s) => {
      const hist =
        completed > 0
          ? [
              {
                date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
                weekId: getWeekId(),
                tier: s.selectedTier,
                completedDays: completed,
                totalDays: 7,
              },
              ...(s.weekHistory || []),
            ].slice(0, 52)
          : s.weekHistory;
      return { ...s, checkedItems: {}, weekHistory: hist, currentWeekId: getWeekId() };
    });
    showToast("Week reset!");
  };

  // ── Rank logic ──
  const getRank = () => {
    let rank = RANKS[0];
    for (const r of RANKS) {
      if ((state.xp || 0) >= r.minXP) rank = r;
    }
    return rank;
  };
  const getNextRank = () => {
    const cur = getRank();
    const idx = RANKS.indexOf(cur);
    return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
  };
  const getRankProgress = () => {
    const cur = getRank();
    const next = getNextRank();
    if (!next) return 100;
    return Math.min(100, Math.round(((state.xp - cur.minXP) / (next.minXP - cur.minXP)) * 100));
  };

  // ── Daily trackers ──
  const d = today();
  const proteinToday = state.protein?.[d] || 0;
  const waterToday = state.water?.[d] || 0;
  const sleepToday = state.sleep?.[d] || 0;
  const caloriesToday = state.calories?.[d] || 0;

  // Auto-calculated goals from weight
  const autoProteinGoal = state.weight > 0 ? Math.round(state.weight * 1.8) : state.proteinGoal;
  const autoCalorieGoal = state.weight > 0 ? Math.round(state.weight * 33) : state.calorieGoal;
  const autoWaterGoal = state.weight > 0 ? Math.round(state.weight / 8) : state.waterGoal;

  const addProtein = (amt) => update((s) => ({ ...s, protein: { ...s.protein, [d]: Math.max(0, (s.protein?.[d] || 0) + amt) } }));
  const addWater = (amt) => update((s) => ({ ...s, water: { ...s.water, [d]: Math.max(0, Math.min(20, (s.water?.[d] || 0) + amt)) } }));
  const setSleep = (val) => update((s) => ({ ...s, sleep: { ...s.sleep, [d]: val } }));
  const addCalories = (amt) => update((s) => ({ ...s, calories: { ...s.calories, [d]: Math.max(0, (s.calories?.[d] || 0) + amt) } }));
  const setGoal = (type, val) => update((s) => ({ ...s, [`${type}Goal`]: val }));

  const currentSchedule = state.customSchedule || defaultState.customSchedule;
  const currentRoutineId = currentSchedule[activeDay];
  const currentWorkout = WORKOUT_LIBRARY[currentRoutineId];
  const activeExItems = getRoutineExercises(currentRoutineId, state.selectedTier, state);
  const currentExercises = {
    totalSets: (state.customRoutines && state.customRoutines[currentRoutineId] && state.customRoutines[currentRoutineId].length > 0) 
        ? `${activeExItems.length} Gerakan` 
        : (currentWorkout.exercises[state.selectedTier]?.totalSets || ""),
    items: activeExItems
  };
  const rank = getRank();
  const nextRank = getNextRank();
  const currentDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  if (!isDbLoaded) {
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#0b0b12" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔋</div>
          <div style={{ color: "#2EC4B6", fontFamily: "'JetBrains Mono'", letterSpacing: 2, fontSize: 14 }}>
            LOADING DATABASE...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.shell}>
      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      {/* Ambient glow */}
      <div
        style={{
          ...styles.ambient,
          background: `radial-gradient(circle at 80% 10%, ${currentWorkout.color}12, transparent 60%)`,
        }}
      />

      {/* Toast */}
      {toast && <div style={styles.toast}>{toast}</div>}

      {/* ═══════ WORKOUT TAB ═══════ */}
      {tab === "workout" && (
        <div style={styles.page}>
          <div style={styles.header}>
            <div>
              <div style={styles.headerLabel}>WORKOUT TRACKER</div>
              <h1
                style={{
                  ...styles.headerTitle,
                  color: currentWorkout.color,
                }}
              >
                GYM LOG
              </h1>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ ...styles.rankBadge, borderColor: rank.color }}>
                <span style={{ fontSize: 14 }}>{rank.icon}</span>
                <span style={{ ...styles.rankBadgeText, color: rank.color }}>{rank.name}</span>
              </div>
              <button onClick={resetWeek} style={styles.resetBtn}>
                ↺
              </button>
            </div>
          </div>

          {/* Week bar */}
          <div style={styles.weekBar}>
            <div style={styles.weekBarInner}>
              <span style={styles.microLabel}>WEEK</span>
              <span style={{ ...styles.microVal, color: currentWorkout.color }}>
                {WEEK_DAYS.filter((w) => getDayProgress(w.id) === 100).length}/7
              </span>
            </div>
            <div style={styles.barTrack}>
              <div
                style={{
                  ...styles.barFill,
                  width: `${(WEEK_DAYS.filter((w) => getDayProgress(w.id) === 100).length / 7) * 100}%`,
                  background: currentWorkout.color,
                }}
              />
            </div>
          </div>

          {/* Day pills */}
          <div style={styles.dayRow}>
            {WEEK_DAYS.map((day, i) => {
              const prog = getDayProgress(day.id);
              const act = i === activeDay;
              const done = prog === 100;
              const dayRoutine = WORKOUT_LIBRARY[currentSchedule[i]];
              const isFuture = i > currentDayIndex;
              return (
                <button
                  key={day.id}
                  onClick={() => {
                    if (isFuture) {
                      showToast("Belum waktunya! Sabar ya 💪");
                    } else {
                      setActiveDay(i);
                    }
                  }}
                  style={{
                    ...styles.dayPill,
                    background: act ? `${dayRoutine.color}14` : done ? "#0d1a0d" : "#111118",
                    borderColor: act ? dayRoutine.color : done ? "#2EC4B633" : "#1a1a28",
                    opacity: isFuture ? 0.4 : 1,
                    cursor: isFuture ? "not-allowed" : "pointer"
                  }}
                >
                  {done && <span style={styles.doneCheck}>✓</span>}
                  <span style={{ fontSize: 16 }}>{dayRoutine.emoji}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ ...styles.dayPillLabel, color: act ? dayRoutine.color : "#555" }}>{day.shortDay}</span>
                    <span style={{ fontSize: 10, color: act ? dayRoutine.color : "#444", fontWeight: 700 }}>{weekDates[i]}</span>
                  </div>
                  <div style={styles.miniBar}>
                    <div
                      style={{
                        ...styles.miniBarFill,
                        width: `${prog}%`,
                        background: done ? "#2EC4B6" : dayRoutine.color,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Day title */}
          <div style={{ ...styles.dayTitle, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <h2 style={{ ...styles.dayName, color: currentWorkout.color }}>{currentWorkout.title}</h2>
              <span style={styles.daySub}>{currentWorkout.subtitle}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button 
                onClick={() => setEditingRoutine(currentWorkout.id)} 
                style={{ background: "transparent", border: `1px solid ${currentWorkout.color}55`, color: currentWorkout.color, padding: "4px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "'JetBrains Mono'", letterSpacing: 1 }}
              >
                ✏️ CUSTOM
              </button>
              <button 
                onClick={() => setIsEditingSchedule(true)} 
                style={{ background: "transparent", border: `1px solid ${currentWorkout.color}55`, color: currentWorkout.color, padding: "4px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "'JetBrains Mono'", letterSpacing: 1 }}
              >
                🔄 GANTI
              </button>
            </div>
          </div>

          {/* Tier selector */}
          <div style={styles.tierRow}>
            {Object.entries(TIER_CFG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => update((s) => ({ ...s, selectedTier: key }))}
                style={{
                  ...styles.tierBtn,
                  background: state.selectedTier === key ? `${cfg.border}15` : "#111118",
                  borderColor: state.selectedTier === key ? cfg.border : "#1a1a28",
                }}
              >
                <span style={{ fontSize: 14 }}>{cfg.icon}</span>
                <span style={{ ...styles.tierLabel, color: state.selectedTier === key ? cfg.border : "#555" }}>
                  {cfg.label}
                </span>
                <span style={{ fontSize: 8, color: "#444", fontFamily: "'JetBrains Mono'" }}>+{cfg.xp}xp</span>
              </button>
            ))}
          </div>

          {/* Stats row */}
          <div style={styles.statsRow}>
            <div style={styles.statChip}>
              <span style={styles.microLabel}>TOTAL</span>
              <span style={{ ...styles.statVal, color: TIER_CFG[state.selectedTier].border }}>
                {currentExercises.totalSets}
              </span>
            </div>
            <div style={styles.statChip}>
              <span style={styles.microLabel}>DONE</span>
              <span style={styles.statVal}>
                {currentExercises.items.filter((_, i) => state.checkedItems[`${activeDay}-${state.selectedTier}-${i}`]).length}/
                {currentExercises.items.length}
              </span>
            </div>
            <div
              style={{
                ...styles.statVal,
                color: getDayProgress(activeDay) === 100 ? "#2EC4B6" : currentWorkout.color,
                fontFamily: "'JetBrains Mono'",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {getDayProgress(activeDay)}%
            </div>
          </div>

          {/* Exercise list */}
          <div style={{ padding: "0 20px 120px" }}>
            {currentExercises.items.map((ex, idx) => {
              const key = `${activeDay}-${state.selectedTier}-${idx}`;
              const checked = !!state.checkedItems[key];
              return (
                <button
                  key={key}
                  onClick={() => toggleItem(activeDay, state.selectedTier, idx)}
                  style={{
                    ...styles.exBtn,
                    background: checked ? `${currentWorkout.color}08` : "#111118",
                    borderColor: checked ? `${currentWorkout.color}33` : "#1a1a28",
                  }}
                >
                  <div
                    style={{
                      ...styles.checkbox,
                      borderColor: checked ? currentWorkout.color : "#333",
                      background: checked ? currentWorkout.color : "transparent",
                    }}
                  >
                    {checked && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7L6 10L11 4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    {ex.images && ex.images.length > 0 && (
                      <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: '#1a1a28', flexShrink: 0 }}>
                        <img 
                          src={`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${ex.images[0]}`} 
                          alt={ex.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: checked ? 'grayscale(1)' : 'none', opacity: checked ? 0.5 : 1 }}
                        />
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: checked ? "#666" : "#ddd",
                        textDecoration: checked ? "line-through" : "none",
                        textDecorationColor: `${currentWorkout.color}55`,
                      }}
                    >
                      {ex.name}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: "'JetBrains Mono'",
                      color: checked ? currentWorkout.color : "#333",
                      fontWeight: 600,
                    }}
                  >
                    #{idx + 1}
                  </div>
                </button>
              );
            })}
            {getDayProgress(currentWorkout.id) === 100 && (
              <div
                style={{
                  ...styles.completeCard,
                  borderColor: `${currentWorkout.color}22`,
                  background: `${currentWorkout.color}08`,
                }}
              >
                <div style={{ fontSize: 32 }}>🎉</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: currentWorkout.color }}>
                  {currentWorkout.day} Complete!
                </div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                  +{TIER_CFG[state.selectedTier].xp} XP earned
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ NUTRITION TAB ═══════ */}
      {tab === "nutrition" && (() => {
        const pPct = Math.min(100, (proteinToday / autoProteinGoal) * 100);
        const wPct = Math.min(100, (waterToday / autoWaterGoal) * 100);
        const sPct = Math.min(100, (sleepToday / state.sleepGoal) * 100);
        const cPct = Math.min(100, (caloriesToday / autoCalorieGoal) * 100);
        const fuelScore = Math.round((pPct + wPct + sPct + cPct) / 4);
        const fuelColor = fuelScore >= 80 ? '#2EC4B6' : fuelScore >= 50 ? '#fbbf24' : '#ef4444';
        const MEAL_PRESETS = [
          { name: "Whey Shake", protein: 25, cal: 120, icon: "🥤" },
          { name: "Dada Ayam", protein: 31, cal: 165, icon: "🍗" },
          { name: "Telur 2 butir", protein: 12, cal: 140, icon: "🥚" },
          { name: "Nasi + Lauk", protein: 15, cal: 450, icon: "🍚" },
          { name: "Oatmeal", protein: 5, cal: 150, icon: "🥣" },
          { name: "Susu", protein: 8, cal: 120, icon: "🥛" },
        ];
        return (
        <div style={styles.page}>
          <div style={{ ...styles.header, paddingBottom: 12 }}>
            <div>
              <div style={styles.headerLabel}>DAILY TRACKER</div>
              <h1 style={{ ...styles.headerTitle, background: "linear-gradient(135deg, #2EC4B6, #fff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FUEL</h1>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: fuelColor, fontFamily: "'Outfit'", lineHeight: 1 }}>{fuelScore}</div>
              <div style={{ fontSize: 8, color: '#666', fontFamily: "'JetBrains Mono'", letterSpacing: 1 }}>FUEL SCORE</div>
            </div>
          </div>

          <div style={{ padding: "0 20px 120px" }}>
            {/* Auto-calc notice */}
            {state.weight > 0 && (
              <div style={{ background: '#161622', borderRadius: 12, padding: '10px 14px', marginBottom: 16, border: '1px solid #1a1a28', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>⚡</span>
                <span style={{ fontSize: 10, color: '#888', fontFamily: "'JetBrains Mono'" }}>
                  Target otomatis dari berat {state.weight}kg — Protein: {autoProteinGoal}g · Kalori: {autoCalorieGoal} · Air: {autoWaterGoal} gelas
                </span>
              </div>
            )}
            {!state.weight && (
              <div style={{ background: '#1a1a28', borderRadius: 12, padding: '12px 14px', marginBottom: 16, border: '1px solid #333', textAlign: 'center' }}>
                <span style={{ fontSize: 11, color: '#fbbf24' }}>⚠️ Isi berat badan di tab Stats untuk target otomatis</span>
              </div>
            )}

            {/* Fuel Score Ring */}
            <div style={{ ...styles.trackerCard, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative', width: 80, height: 80 }}>
                <svg viewBox="0 0 36 36" width="80" height="80">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1a1a28" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={fuelColor} strokeWidth="3" strokeDasharray={`${fuelScore}, 100`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: fuelColor, fontFamily: "'Outfit'" }}>{fuelScore}</div>
              </div>
              <div style={{ flex: 1 }}>
                <SummaryRow label="Protein" value={`${proteinToday}/${autoProteinGoal}g`} pct={pPct} color="#FF6B35" />
                <SummaryRow label="Kalori" value={`${caloriesToday}/${autoCalorieGoal}`} pct={cPct} color="#f59e0b" />
                <SummaryRow label="Air" value={`${waterToday}/${autoWaterGoal}`} pct={wPct} color="#3b82f6" />
                <SummaryRow label="Tidur" value={`${sleepToday}/${state.sleepGoal}h`} pct={sPct} color="#2EC4B6" />
              </div>
            </div>

            {/* Meal Presets */}
            <div style={styles.trackerCard}>
              <div style={{ ...styles.trackerTitle, marginBottom: 12, letterSpacing: 2 }}>🍽️ QUICK ADD</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {MEAL_PRESETS.map(m => (
                  <button key={m.name} onClick={() => { addProtein(m.protein); addCalories(m.cal); showToast(`+${m.protein}g protein, +${m.cal} kcal`); }}
                    style={{ background: '#161622', border: '1px solid #1a1a28', borderRadius: 12, padding: '12px 6px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                    <div style={{ fontSize: 24 }}>{m.icon}</div>
                    <div style={{ fontSize: 9, color: '#ddd', fontWeight: 600, marginTop: 4 }}>{m.name}</div>
                    <div style={{ fontSize: 8, color: '#888', fontFamily: "'JetBrains Mono'", marginTop: 2 }}>{m.protein}g · {m.cal}kcal</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Calorie Card */}
            <TrackerCard title="CALORIES" icon="🔥" value={caloriesToday} goal={autoCalorieGoal} unit="kcal" color="#f59e0b"
              onAdd={(a) => addCalories(a)} buttons={[100, 200, 300, 500]} canSubtract
              onEditGoal={() => {}} isEditing={false} goalValue={autoCalorieGoal} onSetGoal={() => {}} />

            {/* Protein Card */}
            <TrackerCard title="PROTEIN" icon="🥩" value={proteinToday} goal={autoProteinGoal} unit="g" color="#FF6B35"
              onAdd={(a) => addProtein(a)} buttons={[10, 20, 30, 50]} canSubtract
              onEditGoal={() => {}} isEditing={false} goalValue={autoProteinGoal} onSetGoal={() => {}} />

            {/* Water Card */}
            <div style={{ ...styles.trackerCard, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -50, right: -50, width: 100, height: 100, background: '#3b82f6', filter: 'blur(60px)', opacity: 0.15, borderRadius: '50%' }} />
              <div style={styles.trackerHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 24, background: `#3b82f615`, padding: 8, borderRadius: 12 }}>💧</div>
                  <span style={{ ...styles.trackerTitle, fontSize: 16 }}>HYDRATION</span>
                </div>
                <div style={{ ...styles.goalEditBtn, background: '#1a1a28', border: '1px solid #333' }}>
                  {waterToday}/{autoWaterGoal}
                  <span style={{ fontSize: 10, color: '#888', marginLeft: 4 }}>gelas</span>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                  {Array.from({ length: autoWaterGoal }, (_, i) => {
                    const isFilled = i < waterToday;
                    return (
                      <button key={i} onClick={() => update((s) => ({ ...s, water: { ...s.water, [d]: isFilled ? i : i + 1 } }))}
                        style={{ width: 32, height: 40, borderRadius: '12px 12px 16px 16px', border: `1px solid ${isFilled ? '#3b82f6' : '#222'}`,
                          background: isFilled ? 'linear-gradient(180deg, #60a5fa, #3b82f6)' : '#111118',
                          boxShadow: isFilled ? '0 4px 12px rgba(59, 130, 246, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)' : 'none',
                          cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', transform: isFilled ? 'scale(1.05) translateY(-2px)' : 'scale(1)' }} />
                    );
                  })}
                </div>
                <div style={{ fontSize: 40, fontWeight: 900, color: '#3b82f6', fontFamily: "'Outfit'", textShadow: '0 0 20px rgba(59, 130, 246, 0.4)', marginLeft: 16 }}>{waterToday}</div>
              </div>
              <div style={{ ...styles.barTrack, height: 4, borderRadius: 4, background: '#111118', marginTop: 16 }}>
                <div style={{ ...styles.barFill, height: '100%', width: `${Math.min(100, (waterToday / autoWaterGoal) * 100)}%`, background: "linear-gradient(90deg, #3b82f6, #60a5fa)", boxShadow: "0 0 10px #3b82f688" }} />
              </div>
            </div>

            {/* Sleep Card */}
            <div style={{ ...styles.trackerCard, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -50, right: -50, width: 100, height: 100, background: '#9b5de5', filter: 'blur(60px)', opacity: 0.15, borderRadius: '50%' }} />
              <div style={styles.trackerHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 24, background: `#9b5de515`, padding: 8, borderRadius: 12 }}>😴</div>
                  <span style={{ ...styles.trackerTitle, fontSize: 16 }}>REST</span>
                </div>
                <div style={{ ...styles.goalEditBtn, background: '#1a1a28', border: '1px solid #333' }}>Goal: {state.sleepGoal}h</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, marginTop: 24, marginBottom: 20 }}>
                <button onClick={() => setSleep(Math.max(0, sleepToday - 0.5))} style={{ ...styles.circleBtn, width: 48, height: 48, fontSize: 24, background: '#111118', border: '1px solid #333', color: '#888' }}>−</button>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 64, lineHeight: 0.9, fontWeight: 900, color: sleepToday >= state.sleepGoal ? "#2EC4B6" : sleepToday >= state.sleepGoal * 0.75 ? "#fbbf24" : "#ef4444", fontFamily: "'Outfit'" }}>{sleepToday}</div>
                  <div style={{ fontSize: 12, color: "#666", fontFamily: "'JetBrains Mono'", letterSpacing: 2, marginTop: 8, fontWeight: 600 }}>HOURS</div>
                </div>
                <button onClick={() => setSleep(Math.min(14, sleepToday + 0.5))} style={{ ...styles.circleBtn, width: 48, height: 48, fontSize: 24, background: '#111118', border: '1px solid #333', color: '#888' }}>+</button>
              </div>
              <div style={{ ...styles.barTrack, height: 6, borderRadius: 6, background: '#111118' }}>
                <div style={{ ...styles.barFill, height: '100%', width: `${sPct}%`, background: sleepToday >= state.sleepGoal ? "linear-gradient(90deg, #2EC4B6, #6ee7b7)" : "linear-gradient(90deg, #ef4444, #fbbf24)", boxShadow: `0 0 12px ${sleepToday >= state.sleepGoal ? '#2EC4B6' : '#fbbf24'}88`, borderRadius: 6 }} />
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ═══════ RANK TAB ═══════ */}
      {tab === "rank" && (
        <div style={styles.page}>
          <div style={{ ...styles.header, paddingBottom: 12 }}>
            <div>
              <div style={styles.headerLabel}>PROGRESS</div>
              <h1
                style={{
                  ...styles.headerTitle,
                  background: `linear-gradient(135deg, ${rank.color}, #fff)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                RANK
              </h1>
            </div>
          </div>

          <div style={{ padding: "0 20px 120px" }}>
            {/* Rank card */}
            <div style={{ ...styles.rankCard, borderColor: `${rank.color}44` }}>
              <div style={{ fontSize: 56, marginBottom: 4 }}>{rank.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: rank.color, letterSpacing: 1 }}>{rank.name}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", fontFamily: "'JetBrains Mono'", marginTop: 4 }}>
                {state.xp || 0} <span style={{ fontSize: 14, color: "#666" }}>XP</span>
              </div>
              {nextRank && (
                <div style={{ width: "100%", marginTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: "#555", fontFamily: "'JetBrains Mono'" }}>{rank.name}</span>
                    <span style={{ fontSize: 10, color: nextRank.color, fontFamily: "'JetBrains Mono'" }}>
                      {nextRank.name} ({nextRank.minXP} XP)
                    </span>
                  </div>
                  <div style={{ ...styles.barTrack, height: 8 }}>
                    <div
                      style={{
                        ...styles.barFill,
                        height: 8,
                        width: `${getRankProgress()}%`,
                        background: `linear-gradient(90deg, ${rank.color}, ${nextRank.color})`,
                        borderRadius: 4,
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 10, color: "#666", textAlign: "center", marginTop: 8, fontFamily: "'JetBrains Mono'" }}>
                    {nextRank.minXP - state.xp} XP to {nextRank.name}
                  </div>
                </div>
              )}
            </div>

            {/* Stats grid */}
            <div style={styles.statsGrid}>
              <StatBox icon="🏋️" label="Workouts" value={state.totalWorkouts || 0} />
              <StatBox icon="🔥" label="Streak" value={`${state.streak || 0}d`} />
              <StatBox icon="⚡" label="Total XP" value={state.xp || 0} />
              <StatBox icon="📅" label="Weeks" value={(state.weekHistory || []).length} />
            </div>

            {/* ═══════ ACHIEVEMENTS ═══════ */}
            <div style={styles.trackerCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ ...styles.trackerTitle, letterSpacing: 2, marginBottom: 0 }}>🏅 ACHIEVEMENTS</div>
                <span style={{ fontSize: 11, color: '#888', fontFamily: "'JetBrains Mono'" }}>
                  {ACHIEVEMENTS.filter(a => a.check(state)).length}/{ACHIEVEMENTS.length}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ ...styles.barTrack, height: 6, marginBottom: 16 }}>
                <div style={{
                  ...styles.barFill,
                  height: 6,
                  width: `${(ACHIEVEMENTS.filter(a => a.check(state)).length / ACHIEVEMENTS.length) * 100}%`,
                  background: 'linear-gradient(90deg, #FF6B35, #fbbf24)',
                  borderRadius: 3,
                }} />
              </div>

              {/* Badge grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {ACHIEVEMENTS.map(a => {
                  const unlocked = a.check(state);
                  return (
                    <div key={a.id} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      padding: '12px 4px', borderRadius: 12,
                      background: unlocked ? '#161622' : '#0d0d14',
                      border: unlocked ? '1px solid #333' : '1px solid #1a1a28',
                      opacity: unlocked ? 1 : 0.4,
                      transition: 'all 0.3s ease',
                    }}>
                      <span style={{ fontSize: 24, filter: unlocked ? 'none' : 'grayscale(1)' }}>{a.icon}</span>
                      <span style={{ fontSize: 8, fontFamily: "'JetBrains Mono'", color: unlocked ? '#ddd' : '#555', textAlign: 'center', lineHeight: 1.2, letterSpacing: 0.5 }}>
                        {a.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Unlocked details */}
              {ACHIEVEMENTS.filter(a => a.check(state)).length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 10, color: '#666', fontFamily: "'JetBrains Mono'", letterSpacing: 1, marginBottom: 8 }}>UNLOCKED</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {ACHIEVEMENTS.filter(a => a.check(state)).map(a => (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#161622', borderRadius: 8, border: '1px solid #2a2a3a' }}>
                        <span style={{ fontSize: 20 }}>{a.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#eee' }}>{a.name}</div>
                          <div style={{ fontSize: 9, color: '#888', fontFamily: "'JetBrains Mono'" }}>{a.desc}</div>
                        </div>
                        <span style={{ fontSize: 10, color: '#2EC4B6' }}>✓</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next to unlock */}
              {ACHIEVEMENTS.filter(a => !a.check(state)).length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 10, color: '#666', fontFamily: "'JetBrains Mono'", letterSpacing: 1, marginBottom: 8 }}>NEXT TO UNLOCK</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {ACHIEVEMENTS.filter(a => !a.check(state)).slice(0, 3).map(a => (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#0d0d14', borderRadius: 8, border: '1px solid #1a1a28', opacity: 0.6 }}>
                        <span style={{ fontSize: 20, filter: 'grayscale(1)' }}>{a.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#888' }}>{a.name}</div>
                          <div style={{ fontSize: 9, color: '#555', fontFamily: "'JetBrains Mono'" }}>{a.desc}</div>
                        </div>
                        <span style={{ fontSize: 10, color: '#555' }}>🔒</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Rank ladder */}
            <div style={styles.trackerCard}>
              <div style={{ ...styles.trackerTitle, marginBottom: 14, letterSpacing: 2 }}>🏆 RANK LADDER</div>
              {RANKS.map((r, i) => {
                const unlocked = (state.xp || 0) >= r.minXP;
                const isCurrent = r.name === rank.name;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 0",
                      borderBottom: i < RANKS.length - 1 ? "1px solid #1a1a28" : "none",
                      opacity: unlocked ? 1 : 0.35,
                    }}
                  >
                    <span style={{ fontSize: 22, filter: unlocked ? "none" : "grayscale(1)" }}>{r.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: isCurrent ? 700 : 400,
                          color: isCurrent ? r.color : unlocked ? "#ccc" : "#555",
                        }}
                      >
                        {r.name}
                      </div>
                      <div style={{ fontSize: 10, color: "#444", fontFamily: "'JetBrains Mono'" }}>{r.minXP} XP</div>
                    </div>
                    {isCurrent && (
                      <span
                        style={{
                          fontSize: 9,
                          background: `${r.color}22`,
                          color: r.color,
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontFamily: "'JetBrains Mono'",
                          fontWeight: 600,
                          letterSpacing: 1,
                        }}
                      >
                        NOW
                      </span>
                    )}
                    {unlocked && !isCurrent && <span style={{ fontSize: 10, color: "#2EC4B6" }}>✓</span>}
                  </div>
                );
              })}
            </div>

            {/* History */}
            {(state.weekHistory || []).length > 0 && (
              <div style={styles.trackerCard}>
                <div style={{ ...styles.trackerTitle, marginBottom: 14, letterSpacing: 2 }}>📊 HISTORY</div>
                {state.weekHistory.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 0",
                      borderBottom: i < state.weekHistory.length - 1 ? "1px solid #1a1a28" : "none",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{h.date}</div>
                      <div style={{ fontSize: 10, color: "#555" }}>{TIER_CFG[h.tier]?.label || h.tier}</div>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontFamily: "'JetBrains Mono'",
                        color: h.completedDays === h.totalDays ? "#2EC4B6" : "#888",
                      }}
                    >
                      {h.completedDays}/{h.totalDays}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ STATS TAB ═══════ */}
      {tab === "stats" && (
        <div style={styles.page}>
          <div style={{ ...styles.header, paddingBottom: 12 }}>
            <div>
              <div style={styles.headerLabel}>BODY & LIFTING</div>
              <h1
                style={{
                  ...styles.headerTitle,
                  background: "linear-gradient(135deg, #FF6B35, #fff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                STATS
              </h1>
            </div>
          </div>

          <div style={{ padding: "0 20px 120px" }}>
            {/* AVATAR */}
            <AvatarImage 
              rankColor={rank.color} 
              weight={state.weight}
              height={state.height}
            />

            {/* Vitals Card */}
            <div style={styles.trackerCard}>
              <div style={{ ...styles.trackerTitle, marginBottom: 14, letterSpacing: 2 }}>⚖️ BASIC VITALS</div>
              
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Weight (kg)</div>
                  <input 
                    type="number" 
                    value={state.weight || ''}
                    onChange={(e) => update(s => ({...s, weight: Number(e.target.value)}))}
                    style={styles.inputField} 
                    placeholder="0"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Height (cm)</div>
                  <input 
                    type="number" 
                    value={state.height || ''}
                    onChange={(e) => update(s => ({...s, height: Number(e.target.value)}))}
                    style={styles.inputField} 
                    placeholder="0"
                  />
                </div>
              </div>

              <div style={{ background: '#1a1a28', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#ddd' }}>Your BMI</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#FF6B35', fontFamily: "'Outfit'" }}>
                  {state.weight && state.height ? Math.round(state.weight / Math.pow(state.height / 100, 2)) : '-'}
                </span>
              </div>
            </div>

            {/* Personal Records Card */}
            <div style={styles.trackerCard}>
              <div style={{ ...styles.trackerTitle, marginBottom: 14, letterSpacing: 2 }}>🏆 PERSONAL RECORDS</div>
              
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <select 
                  value={newPrExercise} 
                  onChange={(e) => setNewPrExercise(e.target.value)}
                  style={{ ...styles.inputField, flex: '1 1 100%', background: '#1a1a28', color: '#eee' }}
                >
                  <option value="">Select Exercise...</option>
                  {EXERCISE_LIBRARY.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 8, flex: '1 1 100%' }}>
                  <input 
                    type="number" 
                    value={newPrWeight} 
                    onChange={e => setNewPrWeight(e.target.value)} 
                    placeholder="kg" 
                    style={{ ...styles.inputField, flex: 1 }} 
                  />
                  <input 
                    type="number" 
                    value={newPrReps} 
                    onChange={e => setNewPrReps(e.target.value)} 
                    placeholder="reps" 
                    style={{ ...styles.inputField, flex: 1 }} 
                  />
                  <button 
                    onClick={handleAddPR}
                    style={{ 
                      background: '#FF6B35', 
                      border: 'none', 
                      borderRadius: 10, 
                      padding: '0 16px', 
                      color: '#000', 
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono'",
                      cursor: 'pointer'
                    }}
                  >
                    ADD
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(state.personalRecords || {}).map(([ex, data]) => (
                  <div key={ex} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#161622', padding: '12px 16px', borderRadius: 12, border: '1px solid #1a1a28' }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#ddd' }}>{ex}</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#FF6B35', fontFamily: "'JetBrains Mono'" }}>{data.weight}kg <span style={{fontSize: 12, color: '#888'}}>x {data.reps}</span></span>
                  </div>
                ))}
                {Object.keys(state.personalRecords || {}).length === 0 && (
                  <div style={{ textAlign: 'center', padding: 20, color: '#555', fontSize: 12 }}>No personal records yet. Add one above!</div>
                )}
              </div>
            </div>

            {/* ═══════ PROGRESS OVERVIEW ═══════ */}
            <div style={styles.trackerCard}>
              <div style={{ ...styles.trackerTitle, marginBottom: 14, letterSpacing: 2 }}>📊 PROGRESS OVERVIEW</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div style={{ background: '#161622', borderRadius: 12, padding: '14px 8px', textAlign: 'center', border: '1px solid #1a1a28' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#FF6B35', fontFamily: "'Outfit'" }}>{state.totalWorkouts || 0}</div>
                  <div style={{ fontSize: 8, color: '#666', fontFamily: "'JetBrains Mono'", letterSpacing: 1, marginTop: 2 }}>WORKOUTS</div>
                </div>
                <div style={{ background: '#161622', borderRadius: 12, padding: '14px 8px', textAlign: 'center', border: '1px solid #1a1a28' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#2EC4B6', fontFamily: "'Outfit'" }}>{state.streak || 0}</div>
                  <div style={{ fontSize: 8, color: '#666', fontFamily: "'JetBrains Mono'", letterSpacing: 1, marginTop: 2 }}>STREAK</div>
                </div>
                <div style={{ background: '#161622', borderRadius: 12, padding: '14px 8px', textAlign: 'center', border: '1px solid #1a1a28' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: rank.color, fontFamily: "'Outfit'" }}>{state.xp || 0}</div>
                  <div style={{ fontSize: 8, color: '#666', fontFamily: "'JetBrains Mono'", letterSpacing: 1, marginTop: 2 }}>TOTAL XP</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: '#161622', borderRadius: 12, padding: '14px 12px', textAlign: 'center', border: '1px solid #1a1a28' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#ddd', fontFamily: "'Outfit'" }}>
                    {(state.weekHistory || []).length}
                  </div>
                  <div style={{ fontSize: 8, color: '#666', fontFamily: "'JetBrains Mono'", letterSpacing: 1, marginTop: 2 }}>WEEKS COMPLETED</div>
                </div>
                <div style={{ background: '#161622', borderRadius: 12, padding: '14px 12px', textAlign: 'center', border: '1px solid #1a1a28' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#ddd', fontFamily: "'Outfit'" }}>
                    {(state.weekHistory || []).length > 0
                      ? Math.round((state.weekHistory || []).reduce((a, h) => a + h.completedDays, 0) / (state.weekHistory || []).length * 10) / 10
                      : 0
                    }/7
                  </div>
                  <div style={{ fontSize: 8, color: '#666', fontFamily: "'JetBrains Mono'", letterSpacing: 1, marginTop: 2 }}>AVG DAYS/WEEK</div>
                </div>
              </div>
            </div>

            {/* ═══════ WEEK HISTORY CHART ═══════ */}
            {(state.weekHistory || []).length > 0 && (
              <div style={styles.trackerCard}>
                <div style={{ ...styles.trackerTitle, marginBottom: 14, letterSpacing: 2 }}>📅 WEEKLY HISTORY</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, marginBottom: 12 }}>
                  {(state.weekHistory || []).slice(0, 12).reverse().map((h, i) => {
                    const pct = Math.round((h.completedDays / h.totalDays) * 100);
                    const barColor = pct === 100 ? '#2EC4B6' : pct >= 70 ? '#FF6B35' : '#555';
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontSize: 8, color: '#888', fontFamily: "'JetBrains Mono'" }}>{h.completedDays}</div>
                        <div style={{ width: '100%', maxWidth: 28, height: `${Math.max(8, pct)}%`, background: barColor, borderRadius: '4px 4px 0 0', transition: 'height 0.4s ease', position: 'relative' }}>
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)', borderRadius: 'inherit' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(state.weekHistory || []).slice(0, 12).reverse().map((h, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 7, color: '#555', fontFamily: "'JetBrains Mono'", overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {h.date.split(' ').slice(0, 2).join(' ')}
                    </div>
                  ))}
                </div>

                {/* Full History List */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 10, color: '#666', fontFamily: "'JetBrains Mono'", letterSpacing: 1, marginBottom: 8 }}>ALL RECORDS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                    {(state.weekHistory || []).map((h, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#161622', borderRadius: 8, border: '1px solid #1a1a28' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14 }}>{h.completedDays === h.totalDays ? '✅' : h.completedDays >= 5 ? '🟡' : '🔴'}</span>
                          <span style={{ fontSize: 11, color: '#aaa' }}>{h.date}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 8, color: '#555', fontFamily: "'JetBrains Mono'", textTransform: 'uppercase' }}>{h.tier}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono'", color: h.completedDays === h.totalDays ? '#2EC4B6' : '#888' }}>
                            {h.completedDays}/{h.totalDays}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════ WEIGHT HISTORY ═══════ */}
            <div style={styles.trackerCard}>
              <div style={{ ...styles.trackerTitle, marginBottom: 14, letterSpacing: 2 }}>⚖️ WEIGHT LOG</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input 
                  type="number" 
                  placeholder="Berat hari ini (kg)"
                  id="weight-log-input"
                  style={{ ...styles.inputField, flex: 1 }} 
                />
                <button 
                  onClick={() => {
                    const inp = document.getElementById('weight-log-input');
                    const val = Number(inp.value);
                    if (!val) return;
                    update(s => ({
                      ...s,
                      weight: val,
                      weightHistory: [
                        { date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" }), value: val },
                        ...(s.weightHistory || [])
                      ].slice(0, 30)
                    }));
                    inp.value = '';
                    showToast(`Berat ${val}kg dicatat!`);
                  }}
                  style={{ background: '#FF6B35', border: 'none', borderRadius: 10, padding: '0 16px', color: '#000', fontWeight: 700, fontFamily: "'JetBrains Mono'", cursor: 'pointer', fontSize: 11 }}
                >
                  LOG
                </button>
              </div>
              
              {(state.weightHistory || []).length > 0 && (
                <>
                  {/* Mini weight chart */}
                  {(() => {
                    const data = (state.weightHistory || []).slice(0, 14).reverse();
                    const values = data.map(d => d.value);
                    const min = Math.min(...values) - 2;
                    const max = Math.max(...values) + 2;
                    const range = max - min || 1;
                    return (
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80, marginBottom: 8, padding: '0 4px' }}>
                        {data.map((d, i) => {
                          const pct = ((d.value - min) / range) * 100;
                          return (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                              <div style={{ fontSize: 7, color: '#888', fontFamily: "'JetBrains Mono'" }}>{d.value}</div>
                              <div style={{ 
                                width: '100%', maxWidth: 20, 
                                height: `${Math.max(10, pct)}%`, 
                                background: i === data.length - 1 ? '#FF6B35' : '#333',
                                borderRadius: '3px 3px 0 0' 
                              }} />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 150, overflowY: 'auto' }}>
                    {(state.weightHistory || []).map((w, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: '#161622', borderRadius: 8, border: '1px solid #1a1a28' }}>
                        <span style={{ fontSize: 11, color: '#aaa' }}>{w.date}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#FF6B35', fontFamily: "'JetBrains Mono'" }}>{w.value} kg</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {(state.weightHistory || []).length === 0 && (
                <div style={{ textAlign: 'center', padding: 20, color: '#555', fontSize: 12 }}>Belum ada catatan berat badan.</div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ═══════ EDIT SCHEDULE MODAL ═══════ */}
      {isEditingSchedule && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ backgroundColor: "#111118", padding: 24, borderRadius: 16, width: "100%", maxWidth: 360, border: "1px solid #333", maxHeight: "80vh", overflowY: "auto" }}>
            <h3 style={{ margin: "0 0 16px", color: "#fff", fontSize: 18 }}>Ganti Latihan Hari {WEEK_DAYS[activeDay].day}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.values(WORKOUT_LIBRARY).map((routine) => (
                <button
                  key={routine.id}
                  onClick={() => {
                    update((s) => {
                      const newSchedule = [...(s.customSchedule || defaultState.customSchedule)];
                      newSchedule[activeDay] = routine.id;
                      
                      const newChecked = { ...s.checkedItems };
                      Object.keys(newChecked).forEach(k => {
                        if (k.startsWith(`${activeDay}-`)) delete newChecked[k];
                      });
                      
                      return { ...s, customSchedule: newSchedule, checkedItems: newChecked };
                    });
                    setIsEditingSchedule(false);
                    showToast(`Jadwal diubah ke ${routine.title}`);
                  }}
                  style={{
                    background: currentRoutineId === routine.id ? `${routine.color}22` : "#1a1a28",
                    border: `1px solid ${currentRoutineId === routine.id ? routine.color : "#333"}`,
                    padding: 12, borderRadius: 8, color: "#fff", textAlign: "left", display: "flex", gap: 12, alignItems: "center", cursor: "pointer"
                  }}
                >
                  <span style={{ fontSize: 20 }}>{routine.emoji}</span>
                  <div>
                    <div style={{ fontWeight: "bold", color: routine.color }}>{routine.title}</div>
                    <div style={{ fontSize: 12, color: "#aaa" }}>{routine.subtitle}</div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setIsEditingSchedule(false)} style={{ width: "100%", padding: 12, marginTop: 16, background: "#333", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>Batal</button>
          </div>
        </div>
      )}

      {/* ═══════ ROUTINE EDITOR MODAL ═══════ */}
      {editingRoutine && (
        <RoutineEditorModal 
          routineId={editingRoutine}
          onClose={() => setEditingRoutine(null)}
          update={update}
          state={state}
          exerciseDb={exerciseDb}
        />
      )}

      {/* ═══════ BOTTOM NAV ═══════ */}
      <div style={styles.bottomNav}>
        <NavBtn icon="🏋️" label="Workout" active={tab === "workout"} onClick={() => setTab("workout")} color="#FF6B35" />
        <NavBtn icon="🥗" label="Fuel" active={tab === "nutrition"} onClick={() => setTab("nutrition")} color="#2EC4B6" />
        <NavBtn icon="🏆" label="Rank" active={tab === "rank"} onClick={() => setTab("rank")} color={rank.color} />
        <NavBtn icon="📏" label="Stats" active={tab === "stats"} onClick={() => setTab("stats")} color="#FF6B35" />
      </div>
    </div>
  );
}

// ──────────────── SUB-COMPONENTS ────────────────
function NavBtn({ icon, label, active, onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: "transparent",
        border: "none",
        padding: "8px 0 4px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 20, filter: active ? "none" : "grayscale(0.8) opacity(0.4)", transition: "all 0.2s" }}>
        {icon}
      </span>
      <span
        style={{
          fontSize: 9,
          fontFamily: "'JetBrains Mono'",
          letterSpacing: 1,
          color: active ? color : "#444",
          fontWeight: active ? 600 : 400,
          transition: "all 0.2s",
        }}
      >
        {label}
      </span>
      {active && <div style={{ width: 16, height: 2, borderRadius: 2, background: color, marginTop: 1 }} />}
    </button>
  );
}

function TrackerCard({ title, icon, value, goal, unit, color, onAdd, buttons, canSubtract, onEditGoal, isEditing, goalValue, onSetGoal }) {
  const pct = Math.min(100, (value / goal) * 100);
  return (
    <div style={{ ...styles.trackerCard, position: 'relative', overflow: 'hidden' }}>
      {/* Background Glow */}
      <div style={{ position: 'absolute', top: -50, right: -50, width: 100, height: 100, background: color, filter: 'blur(60px)', opacity: 0.15, borderRadius: '50%' }} />
      
      <div style={styles.trackerHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 24, background: `${color}15`, padding: 8, borderRadius: 12 }}>{icon}</div>
          <span style={{ ...styles.trackerTitle, fontSize: 16 }}>{title}</span>
        </div>
        <button onClick={onEditGoal} style={{ ...styles.goalEditBtn, background: '#1a1a28', border: '1px solid #333' }}>
          {value}/{goal}
          <span style={{ fontSize: 10, color: '#888', marginLeft: 4 }}>{unit}</span>
        </button>
      </div>
      {isEditing && <GoalEditor current={goalValue} unit={unit} onSave={onSetGoal} />}
      
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 56, lineHeight: 0.8, fontWeight: 900, color: pct >= 100 ? "#2EC4B6" : color, fontFamily: "'Outfit'", textShadow: `0 0 20px ${pct >= 100 ? "#2EC4B6" : color}44` }}>
          {value}
        </div>
        <span style={{ fontSize: 18, color: "#666", fontWeight: 600, paddingBottom: 4 }}>{unit}</span>
      </div>
      
      <div style={{ ...styles.barTrack, height: 8, borderRadius: 8, background: '#111118', border: '1px solid #222' }}>
        <div style={{ ...styles.barFill, width: `${pct}%`, height: '100%', borderRadius: 8, background: `linear-gradient(90deg, ${color}, ${color}dd)`, boxShadow: `0 0 10px ${color}66` }} />
      </div>
      
      <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
        {canSubtract && (
          <button onClick={() => onAdd(-10)} style={{ ...styles.addBtn, background: '#111118', borderColor: "#222", color: "#666", borderRadius: 20, padding: '8px 16px' }}>
            -10
          </button>
        )}
        {buttons.map((b) => (
          <button key={b} onClick={() => onAdd(b)} style={{ ...styles.addBtn, background: `${color}11`, borderColor: `${color}44`, color, borderRadius: 20, padding: '8px 16px', fontWeight: 700, boxShadow: `0 4px 12px ${color}11` }}>
            +{b}
          </button>
        ))}
      </div>
    </div>
  );
}

function GoalEditor({ current, unit, step = 1, onSave }) {
  const [val, setVal] = useState(current);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginTop: 8,
        padding: "8px 12px",
        background: "#0d0d14",
        borderRadius: 10,
      }}
    >
      <span style={{ fontSize: 10, color: "#666", fontFamily: "'JetBrains Mono'" }}>GOAL:</span>
      <button onClick={() => setVal((v) => Math.max(step, v - step))} style={{ ...styles.circleBtn, width: 28, height: 28, fontSize: 14 }}>
        −
      </button>
      <span style={{ fontSize: 16, fontWeight: 700, color: "#ddd", minWidth: 40, textAlign: "center" }}>{val}</span>
      <button onClick={() => setVal((v) => v + step)} style={{ ...styles.circleBtn, width: 28, height: 28, fontSize: 14 }}>
        +
      </button>
      <span style={{ fontSize: 10, color: "#555" }}>{unit}</span>
      <button
        onClick={() => onSave(val)}
        style={{
          marginLeft: "auto",
          background: "#2EC4B6",
          border: "none",
          borderRadius: 8,
          padding: "6px 14px",
          color: "#000",
          fontSize: 11,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "'JetBrains Mono'",
        }}
      >
        SET
      </button>
    </div>
  );
}

function SummaryRow({ label, value, pct, color }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "#888" }}>{label}</span>
        <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono'", color: pct >= 100 ? "#2EC4B6" : "#aaa" }}>{value}</span>
      </div>
      <div style={{ height: 4, background: "#1a1a28", borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{ height: "100%", width: `${pct}%`, background: pct >= 100 ? "#2EC4B6" : color, borderRadius: 4, transition: "width 0.4s ease" }}
        />
      </div>
    </div>
  );
}

// ──────────────── AVATAR COMPONENT ────────────────
function AvatarImage({ rankColor, weight, height }) {
  let bmi = 22; // default
  if (weight && height) {
    bmi = weight / Math.pow(height / 100, 2);
  }

  let bmiClass = "normal";
  let statusText = "Normal";

  if (bmi < 18.5) {
    bmiClass = "underweight";
    statusText = "Underweight";
  } else if (bmi >= 25 && bmi < 30) {
    bmiClass = "overweight";
    statusText = "Overweight";
  } else if (bmi >= 30) {
    bmiClass = "obese";
    statusText = "Obese";
  }
  
  return (
    <div style={{ height: 350, width: "100%", position: "relative", marginBottom: 24, borderRadius: 24, overflow: "hidden", background: "#111118", border: `1px solid ${rankColor}44`, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <style>
        {`
          @keyframes holo-flicker {
            0% { opacity: 0.8; }
            5% { opacity: 0.9; }
            10% { opacity: 0.5; }
            15% { opacity: 1; }
            100% { opacity: 0.8; }
          }
          @keyframes scanline {
            0% { transform: translateY(-50px); }
            100% { transform: translateY(400px); }
          }
        `}
      </style>
      <div style={{ position: "absolute", top: 16, left: 16, zIndex: 10 }}>
        <div style={{ fontSize: 12, color: "#aaa", letterSpacing: 1, fontFamily: "'JetBrains Mono'" }}>AVATAR</div>
        <div style={{ fontSize: 18, fontWeight: "bold", color: rankColor }}>{statusText.toUpperCase()}</div>
      </div>
      
      {/* Background glow */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, ${rankColor}22 0%, transparent 60%)`, pointerEvents: "none" }} />
      
      {/* Scanline */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `${rankColor}88`, boxShadow: `0 0 10px ${rankColor}`, animation: "scanline 3s linear infinite", zIndex: 20, pointerEvents: "none" }} />

      {/* Hologram SVG */}
      <div style={{ 
        transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        animation: "holo-flicker 4s infinite",
        filter: `drop-shadow(0 0 8px ${rankColor}) drop-shadow(0 0 16px ${rankColor}88)`,
        pointerEvents: "none"
      }}>
        <svg viewBox="0 0 100 200" width="180" height="320">
          <g stroke={rankColor} strokeWidth="1.5" fill={`${rankColor}10`} strokeLinecap="round" strokeLinejoin="round">
            
            {bmiClass === 'underweight' && (
              <>
                <ellipse cx="50" cy="20" rx="10" ry="13" />
                <path d="M 46 33 L 46 40 M 54 33 L 54 40" />
                <path d="M 38 40 Q 50 38 62 40 L 58 100 L 42 100 Z" />
                <path d="M 42 55 Q 50 60 58 55 M 50 40 L 50 55" />
                <path d="M 44 70 L 48 68 M 56 70 L 52 68 M 45 80 L 49 78 M 55 80 L 51 78" />
                <path d="M 38 40 L 28 95 L 33 95 L 42 45 Z" />
                <path d="M 62 40 L 72 95 L 67 95 L 58 45 Z" />
                <path d="M 42 100 L 35 180 L 42 180 L 48 100 Z" />
                <path d="M 58 100 L 65 180 L 58 180 L 52 100 Z" />
              </>
            )}

            {bmiClass === 'normal' && (
              <>
                <ellipse cx="50" cy="20" rx="11" ry="14" />
                <path d="M 44 33 L 40 42 M 56 33 L 60 42" />
                <path d="M 30 42 Q 50 38 70 42 L 58 100 L 42 100 Z" />
                <path d="M 33 60 Q 42 70 50 62 Q 58 70 67 60 M 50 42 L 50 62" />
                <path d="M 45 70 L 55 70 M 45 80 L 55 80 M 46 90 L 54 90 M 50 62 L 50 95" />
                <path d="M 30 42 Q 20 55 24 70 Q 20 85 28 100 L 34 100 L 38 70 Z" />
                <path d="M 70 42 Q 80 55 76 70 Q 80 85 72 100 L 66 100 L 62 70 Z" />
                <path d="M 42 100 Q 30 130 35 180 L 44 180 L 48 100 Z" />
                <path d="M 58 100 Q 70 130 65 180 L 56 180 L 52 100 Z" />
              </>
            )}

            {bmiClass === 'overweight' && (
              <>
                <ellipse cx="50" cy="20" rx="12" ry="15" />
                <path d="M 44 34 L 44 45 M 56 34 L 56 45" />
                <path d="M 32 45 Q 25 80 35 110 L 65 110 Q 75 80 68 45 Z" />
                <path d="M 35 65 Q 42 75 50 70 Q 58 75 65 65 M 50 45 L 50 65" />
                <path d="M 32 95 Q 50 115 68 95" />
                <circle cx="50" cy="85" r="1.5" />
                <path d="M 32 45 Q 18 70 25 100 L 33 100 L 38 65 Z" />
                <path d="M 68 45 Q 82 70 75 100 L 67 100 L 62 65 Z" />
                <path d="M 35 110 Q 28 150 35 180 L 45 180 L 48 110 Z" />
                <path d="M 65 110 Q 72 150 65 180 L 55 180 L 52 110 Z" />
              </>
            )}

            {bmiClass === 'obese' && (
              <>
                <ellipse cx="50" cy="22" rx="14" ry="16" />
                <path d="M 28 48 Q 10 90 25 125 Q 50 140 75 125 Q 90 90 72 48 Z" />
                <path d="M 28 75 Q 42 90 50 80 Q 58 90 72 75 M 50 48 L 50 75" />
                <path d="M 22 105 Q 50 135 78 105" />
                <path d="M 25 125 Q 50 145 75 125" />
                <circle cx="50" cy="95" r="1.5" />
                <path d="M 28 48 Q 10 70 18 100 L 30 100 L 38 65 Z" />
                <path d="M 72 48 Q 90 70 82 100 L 70 100 L 62 65 Z" />
                <path d="M 25 125 Q 15 160 30 180 L 45 180 L 48 135 Z" />
                <path d="M 75 125 Q 85 160 70 180 L 55 180 L 52 135 Z" />
              </>
            )}

            {/* Inner details / Cyber lines (global) */}
            <path d="M 50 10 L 50 0" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" fill="none" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }) {
  return (
    <div
      style={{
        background: "#111118",
        borderRadius: 14,
        padding: "16px 12px",
        border: "1px solid #1a1a28",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#ddd", fontFamily: "'Outfit'" }}>{value}</div>
      <div style={{ fontSize: 9, color: "#555", fontFamily: "'JetBrains Mono'", letterSpacing: 1, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function RoutineEditorModal({ routineId, onClose, update, state, exerciseDb }) {
  const workoutInfo = WORKOUT_LIBRARY[routineId];
  const [query, setQuery] = useState("");
  const [customList, setCustomList] = useState(state.customRoutines?.[routineId] || []);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (query.trim().length > 0) {
      const q = query.toLowerCase();
      setSearchResults(exerciseDb.filter(ex => ex.name.toLowerCase().includes(q) || (ex.primaryMuscles && ex.primaryMuscles.some(m => m.toLowerCase().includes(q)))).slice(0, 50));
    } else {
      const targetMuscles = {
         pull: ["lats", "middle back", "lower back", "biceps", "forearms"],
         push: ["chest", "triceps", "shoulders"],
         legs: ["quadriceps", "hamstrings", "calves", "glutes", "adductors", "abductors"]
      }[routineId] || [];
      
      let recs = exerciseDb;
      if (targetMuscles.length > 0) {
         recs = exerciseDb.filter(ex => ex.primaryMuscles && ex.primaryMuscles.some(m => targetMuscles.includes(m.toLowerCase())));
      }
      setSearchResults(recs.slice(0, 30));
    }
  }, [query, exerciseDb, routineId]);

  const handleSave = () => {
    update(s => ({
      ...s,
      customRoutines: {
        ...s.customRoutines,
        [routineId]: customList
      }
    }));
    onClose();
  };

  const handleReset = () => {
    update(s => {
      const next = { ...s, customRoutines: { ...s.customRoutines } };
      delete next.customRoutines[routineId];
      return next;
    });
    onClose();
  };

  const moveItem = (index, dir) => {
    const newList = [...customList];
    const target = index + dir;
    if (target >= 0 && target < newList.length) {
      [newList[index], newList[target]] = [newList[target], newList[index]];
      setCustomList(newList);
    }
  };

  const addItem = (exId) => {
    if (customList.length < 10 && !customList.includes(exId)) {
      setCustomList([...customList, exId]);
      setQuery("");
    }
  };

  const removeItem = (exId) => {
    setCustomList(customList.filter(id => id !== exId));
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.9)", zIndex: 1000, display: "flex", flexDirection: "column", padding: "40px 20px" }}>
      <div style={{ background: "#111118", borderRadius: 24, padding: 24, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", border: `1px solid ${workoutInfo.color}44` }}>
        <h2 style={{ color: workoutInfo.color, margin: "0 0 16px 0", fontSize: 24 }}>Custom: {workoutInfo.title}</h2>
        
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Current List */}
          <div>
            <h3 style={{ color: "#aaa", fontSize: 14, marginBottom: 8 }}>Gerakan Terpilih ({customList.length}/10)</h3>
            <p style={{ color: "#666", fontSize: 11, marginBottom: 12 }}>Urutkan dari yang wajib (Minimum) ke tambahan (Max). Tier Minimum ambil 4 teratas, Optimal 6, Max semua.</p>
            {customList.length === 0 ? (
              <div style={{ color: "#555", fontStyle: "italic", fontSize: 13 }}>Belum ada gerakan kustom. Akan menggunakan default.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {customList.map((exId, idx) => {
                  const dbEx = exerciseDb.find(e => e.id === exId);
                  const name = dbEx ? dbEx.name : exId;
                  const thumb = dbEx && dbEx.images && dbEx.images.length > 0 ? `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${dbEx.images[0]}` : null;
                  return (
                    <div key={exId} style={{ display: "flex", alignItems: "center", gap: 12, background: "#1a1a28", padding: 8, borderRadius: 12 }}>
                      <div style={{ fontWeight: "bold", color: "#555", width: 20 }}>{idx + 1}.</div>
                      {thumb && <img src={thumb} style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />}
                      <div style={{ flex: 1, color: "#ddd", fontSize: 14, fontWeight: 500 }}>{name}</div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} style={{ background: "#222", border: "none", color: idx === 0 ? "#444" : "#fff", padding: "6px 10px", borderRadius: 6 }}>↑</button>
                        <button onClick={() => moveItem(idx, 1)} disabled={idx === customList.length - 1} style={{ background: "#222", border: "none", color: idx === customList.length - 1 ? "#444" : "#fff", padding: "6px 10px", borderRadius: 6 }}>↓</button>
                        <button onClick={() => removeItem(exId)} style={{ background: "#4a1c1c", border: "none", color: "#ff6b6b", padding: "6px 10px", borderRadius: 6 }}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <hr style={{ borderColor: "#222", margin: "8px 0" }} />

          {/* Search */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minHeight: 0 }}>
            <h3 style={{ color: "#aaa", fontSize: 14 }}>Tambah Gerakan Baru</h3>
            <input 
              type="text" 
              placeholder="Cari gerakan (Inggris)..." 
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #333", background: "#0b0b12", color: "#fff", outline: "none", boxSizing: "border-box" }}
            />
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginTop: 8, background: "#0b0b12", padding: 8, borderRadius: 12 }}>
              {searchResults.length === 0 ? (
                <div style={{ color: "#555", fontSize: 13, textAlign: "center", padding: 12 }}>Tidak ditemukan</div>
              ) : searchResults.map(ex => {
                const thumb = ex.images && ex.images.length > 0 ? `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${ex.images[0]}` : null;
                const isAdded = customList.includes(ex.id);
                return (
                  <div key={ex.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 8, borderRadius: 8, background: "#1a1a28", border: `1px solid ${isAdded ? workoutInfo.color : "transparent"}` }}>
                    {thumb && <img src={thumb} style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>{ex.name}</div>
                      <div style={{ color: "#888", fontSize: 11 }}>{ex.primaryMuscles?.[0] || ex.category}</div>
                    </div>
                    <button 
                      onClick={() => addItem(ex.id)}
                      disabled={isAdded || customList.length >= 10}
                      style={{ background: isAdded ? "#222" : workoutInfo.color, color: isAdded ? "#555" : "#fff", border: "none", padding: "6px 12px", borderRadius: 8, fontWeight: "bold" }}
                    >
                      {isAdded ? "Added" : "+"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 14, background: "#222", color: "#fff", border: "none", borderRadius: 12, fontWeight: "bold" }}>Batal</button>
          <button onClick={handleReset} style={{ padding: 14, background: "#4a1c1c", color: "#ff6b6b", border: "none", borderRadius: 12, fontWeight: "bold" }}>Reset Default</button>
          <button onClick={handleSave} style={{ flex: 2, padding: 14, background: workoutInfo.color, color: "#fff", border: "none", borderRadius: 12, fontWeight: "bold" }}>Simpan</button>
        </div>
      </div>
    </div>
  );
}

// ──────────────── STYLES ────────────────
const styles = {
  shell: {
    background: "#0a0a0f",
    minHeight: "100dvh",
    fontFamily: "'Outfit', sans-serif",
    color: "#e8e8e8",
    maxWidth: 480,
    margin: "0 auto",
    position: "relative",
    overflowX: "hidden",
  },
  ambient: {
    position: "fixed",
    top: -80,
    right: -80,
    width: 300,
    height: 300,
    pointerEvents: "none",
    transition: "background 0.6s",
  },
  page: { paddingBottom: 0 },
  header: {
    padding: "max(env(safe-area-inset-top), 20px) 20px 6px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLabel: { fontFamily: "'JetBrains Mono'", fontSize: 9, color: "#444", letterSpacing: 3, marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: -0.5 },
  rankBadge: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "6px 10px",
    borderRadius: 10,
    border: "1.5px solid",
    background: "#111118",
  },
  rankBadgeText: { fontSize: 10, fontFamily: "'JetBrains Mono'", fontWeight: 600, letterSpacing: 1 },
  resetBtn: {
    background: "transparent",
    border: "1px solid #222",
    borderRadius: 10,
    width: 36,
    height: 36,
    fontSize: 16,
    color: "#555",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  weekBar: { padding: "10px 20px 0" },
  weekBarInner: { display: "flex", justifyContent: "space-between", marginBottom: 6 },
  microLabel: { fontSize: 9, color: "#444", fontFamily: "'JetBrains Mono'", letterSpacing: 1.5 },
  microVal: { fontSize: 10, fontFamily: "'JetBrains Mono'", fontWeight: 600 },
  barTrack: { height: 4, background: "#151520", borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4, transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)" },
  dayRow: { padding: "14px 20px", display: "flex", gap: 6, overflowX: "auto" },
  dayPill: {
    flex: "0 0 auto",
    minWidth: 58,
    border: "1.5px solid",
    borderRadius: 14,
    padding: "10px 6px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    transition: "all 0.25s",
    position: "relative",
    background: "none",
  },
  doneCheck: { position: "absolute", top: 3, right: 5, fontSize: 8, color: "#2EC4B6" },
  dayPillLabel: { fontSize: 9, fontFamily: "'JetBrains Mono'", letterSpacing: 0.5, fontWeight: 600 },
  miniBar: { width: 24, height: 2, background: "#222", borderRadius: 2, overflow: "hidden" },
  miniBarFill: { height: "100%", transition: "width 0.3s ease" },
  dayTitle: { padding: "0 20px 8px", display: "flex", alignItems: "baseline", gap: 10 },
  dayName: { fontSize: 22, fontWeight: 800, margin: 0 },
  daySub: { fontSize: 12, color: "#555" },
  tierRow: { padding: "0 20px 12px", display: "flex", gap: 6 },
  tierBtn: {
    flex: 1,
    padding: "10px 0",
    border: "1.5px solid",
    borderRadius: 12,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    transition: "all 0.25s",
    background: "none",
  },
  tierLabel: { fontSize: 10, fontFamily: "'JetBrains Mono'", fontWeight: 600, letterSpacing: 2 },
  statsRow: {
    margin: "0 20px 10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#111118",
    borderRadius: 10,
    padding: "10px 14px",
    border: "1px solid #1a1a28",
  },
  statChip: { display: "flex", alignItems: "center", gap: 6 },
  statVal: { fontSize: 13, fontWeight: 600, color: "#888" },
  exBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 16px",
    marginBottom: 6,
    border: "1px solid",
    borderRadius: 14,
    cursor: "pointer",
    transition: "all 0.25s",
    background: "none",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    flexShrink: 0,
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.25s",
  },
  completeCard: { textAlign: "center", marginTop: 16, padding: 24, borderRadius: 16, border: "1px solid" },
  trackerCard: {
    background: "#111118",
    borderRadius: 16,
    padding: 18,
    border: "1px solid #1a1a28",
    marginBottom: 12,
  },
  trackerHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  trackerTitle: { fontSize: 12, fontFamily: "'JetBrains Mono'", fontWeight: 600, letterSpacing: 1.5, color: "#888" },
  goalEditBtn: {
    background: "#0d0d14",
    border: "1px solid #1a1a28",
    borderRadius: 8,
    padding: "4px 10px",
    color: "#666",
    fontSize: 11,
    fontFamily: "'JetBrains Mono'",
    cursor: "pointer",
  },
  addBtn: {
    background: "transparent",
    border: "1.5px solid",
    borderRadius: 10,
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'JetBrains Mono'",
    transition: "all 0.2s",
  },
  waterRow: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12, marginBottom: 12 },
  waterDrop: {
    width: 38,
    height: 38,
    borderRadius: 10,
    border: "1.5px solid",
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    background: "none",
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    border: "1.5px solid #333",
    background: "#111118",
    color: "#aaa",
    fontSize: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontFamily: "'Outfit'",
  },
  inputField: {
    background: "#1a1a28",
    border: "1px solid #252535",
    borderRadius: 10,
    padding: "10px 14px",
    color: "#eee",
    fontSize: 14,
    fontFamily: "'Outfit'",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
  },
  rankCard: {
    background: "linear-gradient(135deg, #111118, #161622)",
    borderRadius: 20,
    padding: "28px 24px",
    border: "1.5px solid",
    textAlign: "center",
    marginBottom: 12,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 },
  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: 480,
    background: "linear-gradient(to top, #0a0a0f 70%, #0a0a0fdd 85%, transparent)",
    padding: "12px 20px max(env(safe-area-inset-bottom), 16px)",
    display: "flex",
    borderTop: "1px solid #151520",
  },
  toast: {
    position: "fixed",
    top: "max(env(safe-area-inset-top), 20px)",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#1a1a2e",
    border: "1px solid #2EC4B633",
    borderRadius: 12,
    padding: "10px 20px",
    color: "#2EC4B6",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'JetBrains Mono'",
    zIndex: 999,
    whiteSpace: "nowrap",
    animation: "toastIn 0.3s ease",
  },
};

// Global styles injected once
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes toastIn {
    from { opacity: 0; transform: translate(-50%, -20px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }
`;
if (!document.querySelector("[data-gym-styles]")) {
  styleSheet.setAttribute("data-gym-styles", "");
  document.head.appendChild(styleSheet);
}
