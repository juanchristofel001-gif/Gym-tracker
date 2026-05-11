import { useState, useEffect, useCallback } from "react";
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
  minimum: { label: "MIN", border: "#64748b", icon: "⚡", xp: 10 },
  optimal: { label: "OPT", border: "#3b82f6", icon: "🚀", xp: 20 },
  maximum: { label: "MAX", border: "#a855f7", icon: "👑", xp: 35 },
};

const RANKS = [
  { name: "Newbie", icon: "🥚", minXP: 0, color: "#94a3b8" },
  { name: "Bronze", icon: "🥉", minXP: 50, color: "#cd7f32" },
  { name: "Silver", icon: "🥈", minXP: 150, color: "#c0c0c0" },
  { name: "Gold", icon: "🥇", minXP: 350, color: "#ffd700" },
  { name: "Platinum", icon: "💎", minXP: 700, color: "#00d4ff" },
  { name: "Diamond", icon: "👑", minXP: 1200, color: "#b45fff" },
  { name: "Legend", icon: "🔱", minXP: 2000, color: "#ff4500" },
];

const STORAGE_KEY = "gym-app-v2";
const today = () => new Date().toISOString().slice(0, 10);

const EXERCISE_LIBRARY = [
  "Bench Press", "Squat", "Deadlift", "Overhead Press", "Barbell Row", 
  "Pull Up", "Lat Pulldown", "Leg Press", "Bicep Curl", "Tricep Extension", 
  "Incline Bench Press", "Romanian Deadlift", "Bulgarian Split Squat",
  "Dumbbell Press", "Lateral Raise", "Leg Extension", "Leg Curl"
];

const defaultState = {
  checkedItems: {},
  selectedTier: "optimal",
  xp: 0,
  totalWorkouts: 0,
  streak: 0,
  lastWorkoutDate: null,
  weekHistory: [],
  protein: {},
  water: {},
  sleep: {},
  proteinGoal: 120,
  waterGoal: 8,
  sleepGoal: 8,
  weight: 0,
  height: 0,
  personalRecords: {},
  customSchedule: ["pull", "push", "legs", "upper", "fatburn", "rest", "rest"],
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
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadDb = async () => {
      const saved = await storage.get(STORAGE_KEY);
      if (mounted) {
        if (saved) setState({ ...defaultState, ...saved });
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
  const toggleItem = (dayId, tier, idx) => {
    const key = `${dayId}-${tier}-${idx}`;
    update((s) => {
      const wasChecked = !!s.checkedItems[key];
      const next = { ...s, checkedItems: { ...s.checkedItems, [key]: !wasChecked } };
      const schedule = s.customSchedule || defaultState.customSchedule;
      const routineId = schedule[dayId];
      const ex = WORKOUT_LIBRARY[routineId]?.exercises[tier];

      if (ex) {
        if (!wasChecked) {
          const allDone = ex.items.every((_, i) => i === idx || !!s.checkedItems[`${dayId}-${tier}-${i}`]);
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
          const wasAllDone = ex.items.every((_, i) => !!s.checkedItems[`${dayId}-${tier}-${i}`]);
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
    const ex = WORKOUT_LIBRARY[routineId]?.exercises[state.selectedTier];
    if (!ex) return 0;
    const done = ex.items.filter((_, i) => state.checkedItems[`${dayId}-${state.selectedTier}-${i}`]).length;
    return Math.round((done / ex.items.length) * 100);
  };

  const resetWeek = () => {
    const completed = WEEK_DAYS.filter((d) => getDayProgress(d.id) === 100).length;
    update((s) => {
      const hist =
        completed > 0
          ? [
              {
                date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
                tier: s.selectedTier,
                completedDays: completed,
                totalDays: 7,
              },
              ...(s.weekHistory || []),
            ].slice(0, 20)
          : s.weekHistory;
      return { ...s, checkedItems: {}, weekHistory: hist };
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

  const addProtein = (amt) => update((s) => ({ ...s, protein: { ...s.protein, [d]: Math.max(0, (s.protein?.[d] || 0) + amt) } }));
  const addWater = (amt) => update((s) => ({ ...s, water: { ...s.water, [d]: Math.max(0, Math.min(20, (s.water?.[d] || 0) + amt)) } }));
  const setSleep = (val) => update((s) => ({ ...s, sleep: { ...s.sleep, [d]: val } }));
  const setGoal = (type, val) => update((s) => ({ ...s, [`${type}Goal`]: val }));

  const currentSchedule = state.customSchedule || defaultState.customSchedule;
  const currentRoutineId = currentSchedule[activeDay];
  const currentWorkout = WORKOUT_LIBRARY[currentRoutineId];
  const currentExercises = currentWorkout.exercises[state.selectedTier];
  const rank = getRank();
  const nextRank = getNextRank();

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
              return (
                <button
                  key={day.id}
                  onClick={() => setActiveDay(i)}
                  style={{
                    ...styles.dayPill,
                    background: act ? `${dayRoutine.color}14` : done ? "#0d1a0d" : "#111118",
                    borderColor: act ? dayRoutine.color : done ? "#2EC4B633" : "#1a1a28",
                  }}
                >
                  {done && <span style={styles.doneCheck}>✓</span>}
                  <span style={{ fontSize: 16 }}>{dayRoutine.emoji}</span>
                  <span style={{ ...styles.dayPillLabel, color: act ? dayRoutine.color : "#555" }}>{day.shortDay}</span>
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
            <button 
              onClick={() => setIsEditingSchedule(true)} 
              style={{ background: "transparent", border: `1px solid ${currentWorkout.color}55`, color: currentWorkout.color, padding: "4px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "'JetBrains Mono'", letterSpacing: 1 }}
            >
              🔄 GANTI
            </button>
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
                      fontSize: 14,
                      fontWeight: 500,
                      color: checked ? "#666" : "#ddd",
                      textDecoration: checked ? "line-through" : "none",
                      textDecorationColor: `${currentWorkout.color}55`,
                      textAlign: "left",
                    }}
                  >
                    {ex}
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
      {tab === "nutrition" && (
        <div style={styles.page}>
          <div style={{ ...styles.header, paddingBottom: 12 }}>
            <div>
              <div style={styles.headerLabel}>DAILY TRACKER</div>
              <h1
                style={{
                  ...styles.headerTitle,
                  background: "linear-gradient(135deg, #2EC4B6, #fff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                FUEL
              </h1>
            </div>
            <div style={{ fontSize: 11, color: "#555", fontFamily: "'JetBrains Mono'" }}>
              {new Date().toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
            </div>
          </div>

          <div style={{ padding: "0 20px 120px" }}>
            {/* Protein Card */}
            <TrackerCard
              title="PROTEIN"
              icon="🥩"
              value={proteinToday}
              goal={state.proteinGoal}
              unit="g"
              color="#FF6B35"
              onAdd={(a) => addProtein(a)}
              buttons={[10, 20, 30, 50]}
              canSubtract
              onEditGoal={() => setEditingGoal(editingGoal === "protein" ? null : "protein")}
              isEditing={editingGoal === "protein"}
              goalValue={state.proteinGoal}
              onSetGoal={(v) => {
                setGoal("protein", v);
                setEditingGoal(null);
              }}
            />

            {/* Water Card */}
            <div style={{ ...styles.trackerCard, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -50, right: -50, width: 100, height: 100, background: '#3b82f6', filter: 'blur(60px)', opacity: 0.15, borderRadius: '50%' }} />
              
              <div style={styles.trackerHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 24, background: `#3b82f615`, padding: 8, borderRadius: 12 }}>💧</div>
                  <span style={{ ...styles.trackerTitle, fontSize: 16 }}>HYDRATION</span>
                </div>
                <button onClick={() => setEditingGoal(editingGoal === "water" ? null : "water")} style={{ ...styles.goalEditBtn, background: '#1a1a28', border: '1px solid #333' }}>
                  {waterToday}/{state.waterGoal}
                  <span style={{ fontSize: 10, color: '#888', marginLeft: 4 }}>gelas</span>
                </button>
              </div>
              
              {editingGoal === "water" && (
                <GoalEditor
                  current={state.waterGoal}
                  unit="gelas"
                  onSave={(v) => {
                    setGoal("water", v);
                    setEditingGoal(null);
                  }}
                />
              )}
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                  {Array.from({ length: state.waterGoal }, (_, i) => {
                    const isFilled = i < waterToday;
                    return (
                      <button
                        key={i}
                        onClick={() =>
                          update((s) => ({
                            ...s,
                            water: { ...s.water, [d]: isFilled ? i : i + 1 },
                          }))
                        }
                        style={{
                          width: 32,
                          height: 40,
                          borderRadius: '12px 12px 16px 16px',
                          border: `1px solid ${isFilled ? '#3b82f6' : '#222'}`,
                          background: isFilled ? 'linear-gradient(180deg, #60a5fa, #3b82f6)' : '#111118',
                          boxShadow: isFilled ? '0 4px 12px rgba(59, 130, 246, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: isFilled ? 'scale(1.05) translateY(-2px)' : 'scale(1)',
                        }}
                      />
                    );
                  })}
                </div>
                <div style={{ fontSize: 40, fontWeight: 900, color: '#3b82f6', fontFamily: "'Outfit'", textShadow: '0 0 20px rgba(59, 130, 246, 0.4)', marginLeft: 16 }}>
                  {waterToday}
                </div>
              </div>
              
              <div style={{ ...styles.barTrack, height: 4, borderRadius: 4, background: '#111118', marginTop: 16 }}>
                <div
                  style={{
                    ...styles.barFill,
                    height: '100%',
                    width: `${Math.min(100, (waterToday / state.waterGoal) * 100)}%`,
                    background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                    boxShadow: "0 0 10px #3b82f688"
                  }}
                />
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
                <button onClick={() => setEditingGoal(editingGoal === "sleep" ? null : "sleep")} style={{ ...styles.goalEditBtn, background: '#1a1a28', border: '1px solid #333' }}>
                  Goal: {state.sleepGoal}h
                </button>
              </div>
              
              {editingGoal === "sleep" && (
                <GoalEditor
                  current={state.sleepGoal}
                  unit="jam"
                  step={0.5}
                  onSave={(v) => {
                    setGoal("sleep", v);
                    setEditingGoal(null);
                  }}
                />
              )}
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, marginTop: 24, marginBottom: 20 }}>
                <button 
                  onClick={() => setSleep(Math.max(0, sleepToday - 0.5))} 
                  style={{ ...styles.circleBtn, width: 48, height: 48, fontSize: 24, background: '#111118', border: '1px solid #333', color: '#888' }}
                >
                  −
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    style={{
                      fontSize: 64,
                      lineHeight: 0.9,
                      fontWeight: 900,
                      color:
                        sleepToday >= state.sleepGoal
                          ? "#2EC4B6"
                          : sleepToday >= state.sleepGoal * 0.75
                          ? "#fbbf24"
                          : "#ef4444",
                      fontFamily: "'Outfit'",
                      textShadow: `0 0 30px ${sleepToday >= state.sleepGoal ? '#2EC4B6' : sleepToday >= state.sleepGoal * 0.75 ? '#fbbf24' : '#ef4444'}66`
                    }}
                  >
                    {sleepToday}
                  </div>
                  <div style={{ fontSize: 12, color: "#666", fontFamily: "'JetBrains Mono'", letterSpacing: 2, marginTop: 8, fontWeight: 600 }}>
                    HOURS
                  </div>
                </div>
                <button 
                  onClick={() => setSleep(Math.min(14, sleepToday + 0.5))} 
                  style={{ ...styles.circleBtn, width: 48, height: 48, fontSize: 24, background: '#111118', border: '1px solid #333', color: '#888' }}
                >
                  +
                </button>
              </div>
              
              <div style={{ ...styles.barTrack, height: 6, borderRadius: 6, background: '#111118' }}>
                <div
                  style={{
                    ...styles.barFill,
                    height: '100%',
                    width: `${Math.min(100, (sleepToday / state.sleepGoal) * 100)}%`,
                    background:
                      sleepToday >= state.sleepGoal
                        ? "linear-gradient(90deg, #2EC4B6, #6ee7b7)"
                        : "linear-gradient(90deg, #ef4444, #fbbf24)",
                    boxShadow: `0 0 12px ${sleepToday >= state.sleepGoal ? '#2EC4B6' : '#fbbf24'}88`,
                    borderRadius: 6
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 10, color: "#555", fontFamily: "'JetBrains Mono'" }}>0h</span>
                <span style={{ fontSize: 10, color: "#555", fontFamily: "'JetBrains Mono'" }}>{state.sleepGoal}h Target</span>
              </div>
            </div>

            {/* Daily summary */}
            <div style={{ ...styles.trackerCard, background: "linear-gradient(135deg, #111118, #161622)" }}>
              <div style={{ ...styles.trackerTitle, marginBottom: 14, letterSpacing: 2 }}>📋 DAILY SUMMARY</div>
              <SummaryRow label="Protein" value={`${proteinToday}/${state.proteinGoal}g`} pct={Math.min(100, (proteinToday / state.proteinGoal) * 100)} color="#FF6B35" />
              <SummaryRow label="Water" value={`${waterToday}/${state.waterGoal}`} pct={Math.min(100, (waterToday / state.waterGoal) * 100)} color="#3b82f6" />
              <SummaryRow label="Sleep" value={`${sleepToday}/${state.sleepGoal}h`} pct={Math.min(100, (sleepToday / state.sleepGoal) * 100)} color="#2EC4B6" />
            </div>
          </div>
        </div>
      )}

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
