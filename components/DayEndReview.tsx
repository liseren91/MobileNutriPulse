import { CheckCircle2, Flame, X, XCircle } from "lucide-react";
import React, { useMemo } from "react";
import { t } from "../translations";
import { DailyHistoryEntry, EatenMealEntry, Meal, UserProfile } from "../types";
import { Mascot } from "./Mascot";

interface DayEndReviewProps {
  profile: UserProfile;
  meals: Meal[];
  day: number;
  dailyHistory: DailyHistoryEntry[];
  eatenMeals?: EatenMealEntry[];
  onClose: () => void;
}

export const DayEndReview: React.FC<DayEndReviewProps> = ({
  profile,
  meals,
  day,
  dailyHistory,
  eatenMeals = [],
  onClose,
}) => {
  const lang = profile.language || "ru";
  const text = t[lang].dayEndReview;

  // Get meals for this day
  const dayMeals = meals.filter((m) => m.day === day);
  const completedMeals = dayMeals.filter((m) => m.completedAt);
  const allCompleted =
    dayMeals.length > 0 && completedMeals.length === dayMeals.length;
  const missedCount = dayMeals.length - completedMeals.length;

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(today.getDate()).padStart(2, "0")}`;
  };

  // Get today's data from history or eatenMeals
  const todayData = useMemo(() => {
    const today = getTodayDate();

    // First, try to get data from dailyHistory
    const todayEntries = dailyHistory.filter((h) => h.date === today);

    if (todayEntries.length > 0) {
      // Sum all entries for today (shouldn't be multiple, but protect)
      return {
        calories: todayEntries.reduce((sum, e) => sum + e.calories, 0),
        protein: todayEntries.reduce((sum, e) => sum + e.protein, 0),
        carbs: todayEntries.reduce((sum, e) => sum + e.carbs, 0),
        fat: todayEntries.reduce((sum, e) => sum + e.fat, 0),
      };
    }

    // If no data in dailyHistory, calculate from eatenMeals for today
    if (eatenMeals.length > 0) {
      const todayEatenMeals = eatenMeals.filter((meal) => {
        const mealDate = new Date(meal.timestamp);
        const mealDateStr = `${mealDate.getFullYear()}-${String(
          mealDate.getMonth() + 1
        ).padStart(2, "0")}-${String(mealDate.getDate()).padStart(2, "0")}`;
        return mealDateStr === today;
      });

      if (todayEatenMeals.length > 0) {
        return {
          calories: todayEatenMeals.reduce(
            (sum, m) => sum + (m.calories || 0),
            0
          ),
          protein: todayEatenMeals.reduce(
            (sum, m) => sum + (m.macronutrients?.protein || 0),
            0
          ),
          carbs: todayEatenMeals.reduce(
            (sum, m) => sum + (m.macronutrients?.carbs || 0),
            0
          ),
          fat: todayEatenMeals.reduce(
            (sum, m) => sum + (m.macronutrients?.fat || 0),
            0
          ),
        };
      }
    }

    // Default to zero if no data found
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };
  }, [dailyHistory, eatenMeals]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                allCompleted
                  ? "bg-teal-50 border border-teal-100"
                  : "bg-orange-50 border border-orange-100"
              }`}
            >
              {/* @ts-ignore */}
              <Mascot mood={allCompleted ? "happy" : "thinking"} size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {text.title.replace("{day}", day.toString())}
              </h2>
              <p className="text-sm text-slate-500">{text.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {allCompleted ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center">
                    <CheckCircle2 size={40} className="text-teal-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                  {text.congratulations}
                </h3>
                <p className="text-slate-700 leading-relaxed">
                  {text.allMealsCompleted}
                </p>
              </div>

              <div className="space-y-2">
                {dayMeals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center gap-3 bg-slate-50 rounded-xl p-3"
                  >
                    <CheckCircle2
                      size={20}
                      className="text-teal-600 shrink-0"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800 text-sm">
                        {meal.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {text.types[meal.type as keyof typeof text.types]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-6">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    {/* @ts-ignore */}
                    <Mascot mood="thinking" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 mb-2">
                      {text.missedMealsTitle}
                    </h3>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {text.missedMealsMessage
                        .replace("{missed}", missedCount.toString())
                        .replace("{total}", dayMeals.length.toString())}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700 mb-2">
                  {text.mealsStatus}
                </p>
                {dayMeals.map((meal) => {
                  const isCompleted = !!meal.completedAt;
                  return (
                    <div
                      key={meal.id}
                      className={`flex items-center gap-3 rounded-xl p-3 ${
                        isCompleted ? "bg-teal-50" : "bg-slate-50"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2
                          size={20}
                          className="text-teal-600 shrink-0"
                        />
                      ) : (
                        <XCircle
                          size={20}
                          className="text-slate-300 shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <p
                          className={`font-semibold text-sm ${
                            isCompleted ? "text-slate-800" : "text-slate-400"
                          }`}
                        >
                          {meal.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {text.types[meal.type as keyof typeof text.types]}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Daily Summary - Итоги дня */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-5 mt-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {lang === "ru" ? "Итоги дня" : "Daily Summary"}
            </h3>
            <div className="space-y-3">
              {/* Calories */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame size={18} className="text-red-500" />
                  <span className="text-sm font-semibold text-slate-700">
                    {lang === "ru" ? "Калории" : "Calories"}
                  </span>
                </div>
                <span className="text-lg font-bold text-slate-800">
                  {Math.round(todayData.calories)}{" "}
                  {lang === "ru" ? "ккал" : "kcal"}
                </span>
              </div>

              {/* Macros */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                <div className="text-center">
                  <div className="text-xs text-slate-500 mb-1">
                    {lang === "ru" ? "Белки" : "Protein"}
                  </div>
                  <div className="text-sm font-bold text-orange-600">
                    {Math.round(todayData.protein)}g
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-500 mb-1">
                    {lang === "ru" ? "Углеводы" : "Carbs"}
                  </div>
                  <div className="text-sm font-bold text-blue-600">
                    {Math.round(todayData.carbs)}g
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-500 mb-1">
                    {lang === "ru" ? "Жиры" : "Fat"}
                  </div>
                  <div className="text-sm font-bold text-green-600">
                    {Math.round(todayData.fat)}g
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-semibold hover:bg-slate-800 transition-colors"
          >
            {text.close}
          </button>
        </div>
      </div>
    </div>
  );
};
