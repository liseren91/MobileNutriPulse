import { ArrowRight, Award, BarChart3, Flame } from "lucide-react";
import React, { useMemo } from "react";
import { t } from "../translations";
import { DailyHistoryEntry, Meal, UserProfile } from "../types";

interface InsightsProps {
  history: DailyHistoryEntry[];
  language: "ru" | "en";
  profile?: UserProfile | null;
  meals: Meal[];
}

export const Insights: React.FC<InsightsProps> = ({
  history,
  language,
  profile,
  meals,
}) => {
  const text = t[language].insights;

  // Get today's date in YYYY-MM-DD format (using local time to match user's timezone)
  const getTodayDate = () => {
    const today = new Date();
    // Use local date, not UTC, to match how dates are displayed to the user
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(today.getDate()).padStart(2, "0")}`;
  };

  // Get last 7 days (using local time to match user's timezone)
  const getLast7Days = () => {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      // Use local date, not UTC, to match how dates are displayed to the user
      days.push(
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(date.getDate()).padStart(2, "0")}`
      );
    }
    return days;
  };

  // Calculate streak
  const streak = useMemo(() => {
    if (history.length === 0) return 0;
    const sortedHistory = [...history].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    let streakCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedHistory.length; i++) {
      const entryDate = new Date(sortedHistory[i].date);
      entryDate.setHours(0, 0, 0, 0);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (
        entryDate.getTime() === expectedDate.getTime() &&
        sortedHistory[i].calories > 0
      ) {
        streakCount++;
      } else {
        break;
      }
    }
    return streakCount;
  }, [history]);

  // Get today's data
  // If there are multiple entries for today (shouldn't happen, but protect against it),
  // sum them up
  const todayData = useMemo(() => {
    const today = getTodayDate();
    const todayEntries = history.filter((h) => h.date === today);

    if (todayEntries.length === 0) {
      return {
        date: today,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        meals: [],
      };
    }

    // If multiple entries exist for today, sum them (shouldn't happen, but protect)
    if (todayEntries.length > 1) {
      return {
        date: today,
        calories: todayEntries.reduce((sum, e) => sum + e.calories, 0),
        protein: todayEntries.reduce((sum, e) => sum + e.protein, 0),
        carbs: todayEntries.reduce((sum, e) => sum + e.carbs, 0),
        fat: todayEntries.reduce((sum, e) => sum + e.fat, 0),
        meals: todayEntries.flatMap((e) => e.meals),
      };
    }

    return todayEntries[0];
  }, [history]);

  // Get weekly data
  // If there are multiple entries for a date (shouldn't happen, but protect against it),
  // sum them up
  const weeklyData = useMemo(() => {
    const last7Days = getLast7Days();
    return last7Days.map((date) => {
      const entries = history.filter((h) => h.date === date);

      if (entries.length === 0) {
        return {
          date,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          meals: [],
        };
      }

      // If multiple entries exist for this date, sum them (shouldn't happen, but protect)
      if (entries.length > 1) {
        return {
          date,
          calories: entries.reduce((sum, e) => sum + e.calories, 0),
          protein: entries.reduce((sum, e) => sum + e.protein, 0),
          carbs: entries.reduce((sum, e) => sum + e.carbs, 0),
          fat: entries.reduce((sum, e) => sum + e.fat, 0),
          meals: entries.flatMap((e) => e.meals),
        };
      }

      return entries[0];
    });
  }, [history]);

  // Calculate calorie balance using profile calorieGoal if available, otherwise estimate from goals
  const calorieBalance = useMemo(() => {
    // First priority: use profile calorieGoal
    let baseline: number;
    if (profile?.calorieGoal) {
      baseline = profile.calorieGoal;
    } else {
      // Fallback: estimate from goals
      baseline = profile?.goals?.includes("weightLoss")
        ? 1800
        : profile?.goals?.includes("muscle")
        ? 2200
        : 2000;
    }

    const surplus = todayData.calories - baseline;
    const weeklySurplus =
      weeklyData.reduce((sum, day) => sum + day.calories, 0) - baseline * 7;
    const estimatedWeightChange = weeklySurplus / 7700; // 7700 kcal ≈ 1 kg

    return {
      todaySurplus: surplus,
      weeklySurplus,
      estimatedWeightChange,
    };
  }, [todayData, weeklyData, profile]);

  // Calculate macro percentages
  const macroPercentages = useMemo(() => {
    const total = todayData.calories || 1;
    const proteinPct = ((todayData.protein * 4) / total) * 100;
    const carbsPct = ((todayData.carbs * 4) / total) * 100;
    const fatPct = ((todayData.fat * 9) / total) * 100;
    return { proteinPct, carbsPct, fatPct };
  }, [todayData]);

  // Get max value for weekly charts
  const getMaxValue = (
    data: DailyHistoryEntry[],
    key: keyof DailyHistoryEntry
  ) => {
    const values = data.map((d) => (d[key] as number) || 0);
    return Math.max(...values, 1);
  };

  const maxCalories = getMaxValue(weeklyData, "calories");
  const maxProtein = getMaxValue(weeklyData, "protein");
  const maxCarbs = getMaxValue(weeklyData, "carbs");
  const maxFat = getMaxValue(weeklyData, "fat");

  // Goals derived from user's profile (calorieGoal and macroDistribution).
  // Fallback to plan (day 1) if profile goals not set. Fallback to defaults if missing.
  const goals = useMemo(() => {
    // First priority: use profile settings if available
    if (profile?.calorieGoal) {
      const caloriesTarget = profile.calorieGoal;
      const macroDist = profile.macroDistribution || {
        protein: 30,
        carbs: 40,
        fat: 30,
      };

      const proteinTarget = Math.round(
        (caloriesTarget * macroDist.protein) / 100 / 4
      );
      const carbsTarget = Math.round(
        (caloriesTarget * macroDist.carbs) / 100 / 4
      );
      const fatTarget = Math.round((caloriesTarget * macroDist.fat) / 100 / 9);

      return {
        calories: caloriesTarget,
        protein: proteinTarget,
        carbs: carbsTarget,
        fat: fatTarget,
      };
    }

    // Second priority: derive from user's plan (day 1)
    const PLAN_DAY = 1;
    const dayMeals = meals.filter((m) => m.day === PLAN_DAY);
    const planCalories = dayMeals.reduce(
      (sum, m) => sum + (m.calories || 0),
      0
    );

    if (planCalories > 0) {
      // Use profile macro distribution if available, otherwise default split
      const macroDist = profile?.macroDistribution || {
        protein: 30,
        carbs: 40,
        fat: 30,
      };
      const proteinTarget = Math.round(
        (planCalories * macroDist.protein) / 100 / 4
      );
      const carbsTarget = Math.round(
        (planCalories * macroDist.carbs) / 100 / 4
      );
      const fatTarget = Math.round((planCalories * macroDist.fat) / 100 / 9);

      return {
        calories: planCalories,
        protein: proteinTarget,
        carbs: carbsTarget,
        fat: fatTarget,
      };
    }

    // Fallback: defaults
    const caloriesTarget = 2000;
    const macroDist = profile?.macroDistribution || {
      protein: 30,
      carbs: 40,
      fat: 30,
    };
    const proteinTarget = Math.round(
      (caloriesTarget * macroDist.protein) / 100 / 4
    );
    const carbsTarget = Math.round(
      (caloriesTarget * macroDist.carbs) / 100 / 4
    );
    const fatTarget = Math.round((caloriesTarget * macroDist.fat) / 100 / 9);

    return {
      calories: caloriesTarget,
      protein: proteinTarget,
      carbs: carbsTarget,
      fat: fatTarget,
    };
  }, [meals, profile]);

  const goalData = [
    {
      key: "calories",
      label: text.calories,
      color: "text-red-500",
      ring: "stroke-red-400",
      value: todayData.calories,
      target: goals.calories,
    },
    {
      key: "protein",
      label: text.protein,
      color: "text-orange-500",
      ring: "stroke-orange-400",
      value: todayData.protein,
      target: goals.protein,
    },
    {
      key: "carbs",
      label: text.carbs,
      color: "text-blue-500",
      ring: "stroke-blue-400",
      value: todayData.carbs,
      target: goals.carbs,
    },
    {
      key: "fat",
      label: text.fat,
      color: "text-green-500",
      ring: "stroke-green-400",
      value: todayData.fat,
      target: goals.fat,
    },
  ];

  const renderGoalRing = (
    progress: number,
    ringClass: string,
    size = 44,
    stroke = 6
  ) => {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - Math.min(Math.max(progress, 0), 1));
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={ringClass}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
    );
  };

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-slate-50 pt-safe">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 shadow-sm border-b border-slate-100 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="text-teal-600" />
              {text.title}
            </h1>
            <p className="text-slate-500 text-sm mt-1">{text.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {history.length === 0 ? (
          <div className="p-8 text-center text-slate-500 mt-10">
            <BarChart3 className="mx-auto mb-4 text-slate-300" size={64} />
            <h2 className="text-lg font-semibold text-slate-700">
              {text.noData}
            </h2>
            <p className="mt-2 text-sm">{text.noDataDesc}</p>
          </div>
        ) : (
          <>
            {/* Streak Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-orange-500" />
                  <span className="text-sm font-bold text-slate-700">
                    {text.streak}
                  </span>
                </div>
              </div>
              <p className="text-3xl font-black text-orange-500 mb-1">
                {streak} {text.streakDays}
              </p>
              <p className="text-xs text-slate-500">{text.streakSubtitle}</p>
            </div>

            {/* Goals */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-slate-700">
                  {text.goals}
                </span>
                <ArrowRight size={16} className="text-slate-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {goalData.map((goal) => {
                  const remaining =
                    goal.target > 0 ? Math.max(goal.target - goal.value, 0) : 0;
                  const progress =
                    goal.target > 0 ? Math.min(goal.value / goal.target, 1) : 0;
                  return (
                    <div
                      key={goal.key}
                      className="flex items-center gap-3 bg-slate-50 rounded-2xl px-3 py-3 border border-slate-100"
                    >
                      {renderGoalRing(progress, goal.ring)}
                      <div>
                        <p className={`text-base font-bold ${goal.color}`}>
                          {goal.label}
                        </p>
                        <p className="text-sm text-slate-500">
                          {goal.target > 0 ? (
                            <>
                              {Math.round(remaining)} {text.left}
                            </>
                          ) : (
                            <>{Math.round(goal.value)} / —</>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calorie Balance Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-700">
                  {text.calorieBalance}
                </span>
                <ArrowRight size={16} className="text-slate-400" />
              </div>
              <div className="mb-3">
                <p
                  className={`text-lg font-bold ${
                    calorieBalance.estimatedWeightChange > 0
                      ? "text-red-500"
                      : calorieBalance.estimatedWeightChange < 0
                      ? "text-green-500"
                      : "text-slate-500"
                  }`}
                >
                  {calorieBalance.estimatedWeightChange > 0
                    ? text.estimatedWeightGain
                    : text.estimatedWeightLoss}{" "}
                  {Math.abs(calorieBalance.estimatedWeightChange).toFixed(2)}
                  {text.perWeek}
                </p>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-600">
                    {text.todaySurplus}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      calorieBalance.todaySurplus > 0
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    {calorieBalance.todaySurplus > 0 ? "+" : ""}
                    {Math.round(calorieBalance.todaySurplus)} kcal
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      calorieBalance.todaySurplus > 0
                        ? "bg-red-500"
                        : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        Math.abs((calorieBalance.todaySurplus / 500) * 100),
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Macros Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-slate-700">
                  {text.macros}
                </span>
                <ArrowRight size={16} className="text-slate-400" />
              </div>
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2">{text.today}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-semibold text-slate-700">
                        C {Math.round(todayData.carbs)}g{" "}
                        {Math.round(macroPercentages.carbsPct)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm font-semibold text-slate-700">
                        F {Math.round(todayData.fat)}g{" "}
                        {Math.round(macroPercentages.fatPct)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-sm font-semibold text-slate-700">
                        P {Math.round(todayData.protein)}g{" "}
                        {Math.round(macroPercentages.proteinPct)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Weekly chart */}
              <div className="flex items-end justify-between gap-1 h-16">
                {weeklyData.map((day, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-slate-200 rounded-t transition-all"
                      style={{
                        height: `${(day.calories / maxCalories) * 100}%`,
                      }}
                    ></div>
                    <span className="text-[10px] text-slate-400 mt-1">
                      {text.weekDays[idx]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid: Calories, Protein, Carbs, Fat */}
            <div className="grid grid-cols-2 gap-4">
              {/* Calories */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Flame size={16} className="text-red-500" />
                    <span className="text-sm font-bold text-slate-700">
                      {text.calories}
                    </span>
                  </div>
                  <ArrowRight size={14} className="text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 mb-1">{text.today}</p>
                <p className="text-2xl font-black text-slate-800 mb-3">
                  {Math.round(todayData.calories)} kcal
                </p>
                <div className="flex items-end justify-between gap-1 h-12">
                  {weeklyData.map((day, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-slate-200 rounded-t transition-all"
                      style={{
                        height: `${(day.calories / maxCalories) * 100}%`,
                      }}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Protein */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-orange-500">P</span>
                    <span className="text-sm font-bold text-slate-700">
                      {text.protein}
                    </span>
                  </div>
                  <ArrowRight size={14} className="text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 mb-1">{text.today}</p>
                <p className="text-2xl font-black text-slate-800 mb-3">
                  {Math.round(todayData.protein)}g
                </p>
                <div className="flex items-end justify-between gap-1 h-12">
                  {weeklyData.map((day, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-slate-200 rounded-t transition-all"
                      style={{
                        height: `${(day.protein / maxProtein) * 100}%`,
                      }}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Carbs */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-500">C</span>
                    <span className="text-sm font-bold text-slate-700">
                      {text.carbs}
                    </span>
                  </div>
                  <ArrowRight size={14} className="text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 mb-1">{text.today}</p>
                <p className="text-2xl font-black text-slate-800 mb-3">
                  {Math.round(todayData.carbs)}g
                </p>
                <div className="flex items-end justify-between gap-1 h-12">
                  {weeklyData.map((day, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-slate-200 rounded-t transition-all"
                      style={{
                        height: `${(day.carbs / maxCarbs) * 100}%`,
                      }}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Fat */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-green-500">F</span>
                    <span className="text-sm font-bold text-slate-700">
                      {text.fat}
                    </span>
                  </div>
                  <ArrowRight size={14} className="text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 mb-1">{text.today}</p>
                <p className="text-2xl font-black text-slate-800 mb-3">
                  {Math.round(todayData.fat)}g
                </p>
                <div className="flex items-end justify-between gap-1 h-12">
                  {weeklyData.map((day, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-slate-200 rounded-t transition-all"
                      style={{
                        height: `${(day.fat / maxFat) * 100}%`,
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
