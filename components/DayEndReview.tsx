import { CheckCircle2, X, XCircle } from "lucide-react";
import React from "react";
import { t } from "../translations";
import { Meal, UserProfile } from "../types";
import { Mascot } from "./Mascot";

interface DayEndReviewProps {
  profile: UserProfile;
  meals: Meal[];
  day: number;
  onClose: () => void;
}

export const DayEndReview: React.FC<DayEndReviewProps> = ({
  profile,
  meals,
  day,
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
