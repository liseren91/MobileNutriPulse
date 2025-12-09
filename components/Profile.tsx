import { ArrowLeft, Calendar, Edit2, Save, Trophy, X } from "lucide-react";
import React, { useState } from "react";
import { t } from "../translations";
import {
  DailyHistoryEntry,
  EatenMealEntry,
  MacroDistribution,
  Meal,
  UserProfile,
} from "../types";

interface ProfileProps {
  profile: UserProfile;
  meals: Meal[];
  eatenMeals: EatenMealEntry[];
  dailyHistory: DailyHistoryEntry[];
  onProfileUpdate: (updatedProfile: UserProfile) => void;
  onBack: () => void;
}

export const Profile: React.FC<ProfileProps> = ({
  profile,
  meals,
  eatenMeals,
  dailyHistory,
  onProfileUpdate,
  onBack,
}) => {
  const lang = profile.language || "ru";
  const text = t[lang].profile;

  const [isEditing, setIsEditing] = useState(false);
  const [preferredIngredients, setPreferredIngredients] = useState(
    profile.preferredIngredients || ""
  );
  const [excludedIngredients, setExcludedIngredients] = useState(
    profile.excludedIngredients || ""
  );
  const [calorieGoal, setCalorieGoal] = useState(
    profile.calorieGoal?.toString() || ""
  );
  const [macroDistribution, setMacroDistribution] = useState<MacroDistribution>(
    profile.macroDistribution || { protein: 30, carbs: 40, fat: 30 }
  );
  const [activePlanDay, setActivePlanDay] = useState(
    profile.activePlanDay || 1
  );

  // Calculate tracking days
  const trackingDays = profile.trackingStartDate
    ? Math.floor(
        (Date.now() - profile.trackingStartDate) / (1000 * 60 * 60 * 24)
      ) + 1
    : dailyHistory.length > 0
    ? dailyHistory.length
    : 0;

  const handleSave = () => {
    const updated: UserProfile = {
      ...profile,
      preferredIngredients: preferredIngredients.trim() || undefined,
      excludedIngredients: excludedIngredients.trim() || undefined,
      calorieGoal: calorieGoal ? parseInt(calorieGoal, 10) : undefined,
      macroDistribution,
      activePlanDay,
    };
    onProfileUpdate(updated);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setPreferredIngredients(profile.preferredIngredients || "");
    setExcludedIngredients(profile.excludedIngredients || "");
    setCalorieGoal(profile.calorieGoal?.toString() || "");
    setMacroDistribution(
      profile.macroDistribution || { protein: 30, carbs: 40, fat: 30 }
    );
    setActivePlanDay(profile.activePlanDay || 1);
    setIsEditing(false);
  };

  // Ensure macro distribution sums to 100
  const updateMacro = (type: "protein" | "carbs" | "fat", value: number) => {
    const newMacro = { ...macroDistribution };
    newMacro[type] = Math.max(0, Math.min(100, value));

    // Normalize to 100%
    const total = newMacro.protein + newMacro.carbs + newMacro.fat;
    if (total > 0) {
      const factor = 100 / total;
      newMacro.protein = Math.round(newMacro.protein * factor);
      newMacro.carbs = Math.round(newMacro.carbs * factor);
      newMacro.fat = Math.round(newMacro.fat * factor);
    }

    setMacroDistribution(newMacro);
  };

  const trophies = profile.trophies || [];

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-slate-50 pt-safe">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white shadow-sm border-b border-slate-100 p-6 pt-safe">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-slate-100 active:scale-95 transition-all"
          >
            <ArrowLeft size={24} className="text-slate-700" />
          </button>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex-1">
            {text.title}
          </h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-full hover:bg-slate-100 active:scale-95 transition-all"
            >
              <Edit2 size={20} className="text-slate-600" />
            </button>
          )}
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
        {/* Tracking Days Card */}
        <div className="glass rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <Calendar size={24} className="text-teal-600" />
            <div>
              <h3 className="text-slate-800 font-bold text-lg">
                {text.trackingDays}
              </h3>
              <p className="text-slate-500 text-sm">
                {text.trackingDaysSubtitle}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-4xl font-black text-teal-600">{trackingDays}</p>
          </div>
        </div>

        {/* Settings Section */}
        <div className="glass rounded-3xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-slate-800 font-bold text-lg mb-4">
            {text.settings}
          </h2>

          <div className="space-y-4">
            {/* Preferred Ingredients */}
            <div>
              <label className="block text-slate-700 font-semibold text-sm mb-2">
                {text.preferences}
              </label>
              {isEditing ? (
                <textarea
                  value={preferredIngredients}
                  onChange={(e) => setPreferredIngredients(e.target.value)}
                  placeholder={text.preferencesPlaceholder}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
                  rows={2}
                />
              ) : (
                <p className="text-slate-600 p-3 rounded-xl bg-slate-50 min-h-[3rem]">
                  {preferredIngredients || (
                    <span className="text-slate-400 italic">
                      {text.preferencesPlaceholder}
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Dislikes */}
            <div>
              <label className="block text-slate-700 font-semibold text-sm mb-2">
                {text.dislikes}
              </label>
              {isEditing ? (
                <textarea
                  value={excludedIngredients}
                  onChange={(e) => setExcludedIngredients(e.target.value)}
                  placeholder={text.dislikesPlaceholder}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
                  rows={2}
                />
              ) : (
                <p className="text-slate-600 p-3 rounded-xl bg-slate-50 min-h-[3rem]">
                  {excludedIngredients || (
                    <span className="text-slate-400 italic">
                      {text.dislikesPlaceholder}
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Calorie Goal */}
            <div>
              <label className="block text-slate-700 font-semibold text-sm mb-2">
                {text.calorieGoal}
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={calorieGoal}
                  onChange={(e) => setCalorieGoal(e.target.value)}
                  placeholder={text.calorieGoalPlaceholder}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                />
              ) : (
                <p className="text-slate-600 p-3 rounded-xl bg-slate-50">
                  {profile.calorieGoal ? (
                    `${profile.calorieGoal} ${text.calorieGoalPlaceholder}`
                  ) : (
                    <span className="text-slate-400 italic">
                      {text.calorieGoalPlaceholder}
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Macro Distribution */}
            <div>
              <label className="block text-slate-700 font-semibold text-sm mb-2">
                {text.macroDistribution}
              </label>
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-600">
                        {text.protein}
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {macroDistribution.protein}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={macroDistribution.protein}
                      onChange={(e) =>
                        updateMacro("protein", parseInt(e.target.value, 10))
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-600">
                        {text.carbs}
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {macroDistribution.carbs}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={macroDistribution.carbs}
                      onChange={(e) =>
                        updateMacro("carbs", parseInt(e.target.value, 10))
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-600">{text.fat}</span>
                      <span className="text-sm font-bold text-slate-800">
                        {macroDistribution.fat}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={macroDistribution.fat}
                      onChange={(e) =>
                        updateMacro("fat", parseInt(e.target.value, 10))
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{text.protein}:</span>
                    <span className="font-bold text-slate-800">
                      {profile.macroDistribution?.protein || 30}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-600">{text.carbs}:</span>
                    <span className="font-bold text-slate-800">
                      {profile.macroDistribution?.carbs || 40}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-600">{text.fat}:</span>
                    <span className="font-bold text-slate-800">
                      {profile.macroDistribution?.fat || 30}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Active Plan Day */}
            <div>
              <label className="block text-slate-700 font-semibold text-sm mb-2">
                {text.activePlanDay}
              </label>
              {isEditing ? (
                <select
                  value={activePlanDay}
                  onChange={(e) =>
                    setActivePlanDay(parseInt(e.target.value, 10))
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                >
                  <option value={1}>{text.day} 1</option>
                  <option value={2}>{text.day} 2</option>
                  <option value={3}>{text.day} 3</option>
                </select>
              ) : (
                <p className="text-slate-600 p-3 rounded-xl bg-slate-50">
                  {text.day} {profile.activePlanDay || 1}
                </p>
              )}
            </div>
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {text.save}
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-300 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <X size={18} />
                {text.cancel}
              </button>
            </div>
          )}
        </div>

        {/* Trophies Section */}
        <div className="glass rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <Trophy size={24} className="text-amber-500" />
            <div>
              <h2 className="text-slate-800 font-bold text-lg">
                {text.trophies}
              </h2>
              <p className="text-slate-500 text-sm">{text.trophiesSubtitle}</p>
            </div>
          </div>

          {trophies.length === 0 ? (
            <div className="text-center py-8">
              <Trophy size={48} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-semibold mb-1">
                {text.noTrophies}
              </p>
              <p className="text-slate-400 text-sm">{text.noTrophiesDesc}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {trophies
                .slice()
                .reverse()
                .map((trophy) => (
                  <div
                    key={trophy.id}
                    className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-500 rounded-full p-3 flex-shrink-0">
                        <Trophy size={24} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-800">
                            {trophy.title}
                          </h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              trophy.grade === "excellent"
                                ? "bg-green-100 text-green-700"
                                : trophy.grade === "good"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {text.grade[trophy.grade]}
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm mb-2">
                          {trophy.description}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {text.period}: {trophy.threeDayPeriod.startDate} -{" "}
                          {trophy.threeDayPeriod.endDate}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
