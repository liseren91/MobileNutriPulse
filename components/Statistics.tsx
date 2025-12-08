import { BarChart3, Calendar, Flame, TrendingUp } from "lucide-react";
import React, { useMemo } from "react";
import { t } from "../translations";
import { Meal, OffPlanMealEntry } from "../types";

interface StatisticsProps {
  meals: Meal[];
  offPlanMeals: OffPlanMealEntry[];
  language: "ru" | "en";
}

export const Statistics: React.FC<StatisticsProps> = ({
  meals,
  offPlanMeals,
  language,
}) => {
  const text = t[language].stats;

  // Calculate completion stats by day
  const completionStats = useMemo(() => {
    const stats: Record<number, { total: number; completed: number }> = {};

    // Group meals by day
    meals.forEach((meal) => {
      if (!stats[meal.day]) {
        stats[meal.day] = { total: 0, completed: 0 };
      }
      stats[meal.day].total++;
      if (meal.completedAt) {
        stats[meal.day].completed++;
      }
    });

    return stats;
  }, [meals]);

  // Calculate calories by day
  const caloriesByDay = useMemo(() => {
    const calories: Record<number, { planned: number; offPlan: number }> = {};

    // Calculate planned meal calories
    meals.forEach((meal) => {
      if (!calories[meal.day]) {
        calories[meal.day] = { planned: 0, offPlan: 0 };
      }
      if (meal.completedAt && meal.calories) {
        calories[meal.day].planned += meal.calories;
      }
    });

    // Calculate off-plan meal calories
    offPlanMeals.forEach((offPlan) => {
      const day = offPlan.day || 1;
      if (!calories[day]) {
        calories[day] = { planned: 0, offPlan: 0 };
      }
      if (offPlan.estimatedCalories) {
        calories[day].offPlan += offPlan.estimatedCalories;
      }
    });

    return calories;
  }, [meals, offPlanMeals]);

  // Get available days
  const availableDays = useMemo(() => {
    const days = new Set<number>();
    meals.forEach((m) => days.add(m.day));
    return Array.from(days).sort((a, b) => a - b);
  }, [meals]);

  // Calculate total stats
  const totalStats = useMemo(() => {
    let totalMeals = 0;
    let completedMeals = 0;
    let totalPlannedCalories = 0;
    let totalOffPlanCalories = 0;

    meals.forEach((meal) => {
      totalMeals++;
      if (meal.completedAt) {
        completedMeals++;
        if (meal.calories) {
          totalPlannedCalories += meal.calories;
        }
      }
    });

    offPlanMeals.forEach((offPlan) => {
      if (offPlan.estimatedCalories) {
        totalOffPlanCalories += offPlan.estimatedCalories;
      }
    });

    return {
      totalMeals,
      completedMeals,
      completionRate: totalMeals > 0 ? (completedMeals / totalMeals) * 100 : 0,
      totalPlannedCalories,
      totalOffPlanCalories,
      totalCalories: totalPlannedCalories + totalOffPlanCalories,
    };
  }, [meals, offPlanMeals]);

  if (meals.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 mt-10">
        <BarChart3 className="mx-auto mb-4 text-slate-300" size={64} />
        <h2 className="text-lg font-semibold text-slate-700">{text.noData}</h2>
        <p className="mt-2 text-sm">{text.noDataDesc}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-slate-50 pt-safe">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 shadow-sm border-b border-slate-100 p-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="text-teal-600" />
          {text.title}
        </h1>
        <p className="text-slate-500 text-sm mt-1">{text.subtitle}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
        {/* Overall Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} className="text-teal-600" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {text.completion}
              </span>
            </div>
            <p className="text-3xl font-black text-slate-800">
              {Math.round(totalStats.completionRate)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {totalStats.completedMeals} / {totalStats.totalMeals} {text.meals}
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Flame size={20} className="text-orange-500" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {text.totalCalories}
              </span>
            </div>
            <p className="text-3xl font-black text-slate-800">
              {Math.round(totalStats.totalCalories)}
            </p>
            <p className="text-xs text-slate-500 mt-1">{text.kcal}</p>
          </div>
        </div>

        {/* Completion Chart */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="text-teal-600" size={20} />
            {text.completionChart}
          </h2>
          <div className="space-y-4">
            {availableDays.map((day) => {
              const stats = completionStats[day];
              const percentage = stats
                ? (stats.completed / stats.total) * 100
                : 0;
              return (
                <div key={day} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-700">
                      {text.day} {day}
                    </span>
                    <span className="text-sm text-slate-500">
                      {stats?.completed || 0} / {stats?.total || 0}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Calories Breakdown */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Flame className="text-orange-500" size={20} />
            {text.caloriesBreakdown}
          </h2>
          <div className="space-y-4">
            {availableDays.map((day) => {
              const dayCalories = caloriesByDay[day] || {
                planned: 0,
                offPlan: 0,
              };
              const total = dayCalories.planned + dayCalories.offPlan;
              return (
                <div key={day} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-700">
                      {text.day} {day}
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {Math.round(total)} {text.kcal}
                    </span>
                  </div>
                  {dayCalories.planned > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                      <span className="text-slate-600">
                        {text.planned}: {Math.round(dayCalories.planned)}{" "}
                        {text.kcal}
                      </span>
                    </div>
                  )}
                  {dayCalories.offPlan > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span className="text-slate-600">
                        {text.offPlan}: {Math.round(dayCalories.offPlan)}{" "}
                        {text.kcal}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Off-plan meals list */}
        {offPlanMeals.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              {text.offPlanMeals}
            </h2>
            <div className="space-y-2">
              {offPlanMeals
                .slice(-5)
                .reverse()
                .map((meal) => (
                  <div
                    key={meal.id}
                    className="flex justify-between items-start p-3 bg-slate-50 rounded-xl"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        {meal.description}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(meal.timestamp).toLocaleDateString(
                          language === "ru" ? "ru-RU" : "en-US",
                          {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                    {meal.estimatedCalories && (
                      <div className="text-sm font-semibold text-orange-600 ml-3">
                        ~{meal.estimatedCalories} {text.kcal}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
