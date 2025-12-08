import { Loader2, Send, X } from "lucide-react";
import React, { useState } from "react";
import { analyzeOffPlanMeal } from "../services/geminiService";
import { t } from "../translations";
import { UserProfile } from "../types";
import { Mascot } from "./Mascot";

interface OffPlanMealProps {
  profile: UserProfile;
  onClose: () => void;
  onMealAnalyzed?: () => void;
}

export const OffPlanMeal: React.FC<OffPlanMealProps> = ({
  profile,
  onClose,
  onMealAnalyzed,
}) => {
  const lang = profile.language || "ru";
  const text = t[lang].offPlanMeal || t[lang].chat; // Fallback to chat translations

  const [mealDescription, setMealDescription] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!mealDescription.trim() || isLoading) return;

    setIsLoading(true);
    setFeedback(null);

    try {
      const analysis = await analyzeOffPlanMeal(mealDescription, profile);
      setFeedback(analysis);
      if (onMealAnalyzed) {
        onMealAnalyzed();
      }
    } catch (error) {
      console.error(error);
      setFeedback(
        lang === "ru"
          ? "Извините, не удалось проанализировать еду. Попробуйте еще раз."
          : "Sorry, couldn't analyze the meal. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center">
              {/* @ts-ignore */}
              <Mascot mood="thinking" size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {lang === "ru" ? "Что вы съели?" : "What did you eat?"}
              </h2>
              <p className="text-sm text-slate-500">
                {lang === "ru"
                  ? "Опишите еду вне плана"
                  : "Describe food outside your plan"}
              </p>
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
          {!feedback ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {lang === "ru"
                    ? "Опишите, что вы съели"
                    : "Describe what you ate"}
                </label>
                <textarea
                  value={mealDescription}
                  onChange={(e) => setMealDescription(e.target.value)}
                  placeholder={
                    lang === "ru"
                      ? "Например: Бургер из Макдональдса, пицца, шаурма..."
                      : "E.g., McDonald's burger, pizza, shawarma..."
                  }
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none h-32"
                  disabled={isLoading}
                />
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!mealDescription.trim() || isLoading}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 flex justify-center items-center gap-2 transition-all shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    {lang === "ru" ? "Анализируем..." : "Analyzing..."}
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    {lang === "ru" ? "Получить обратную связь" : "Get feedback"}
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                    {/* @ts-ignore */}
                    <Mascot mood="happy" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 mb-2">
                      {lang === "ru" ? "Обратная связь" : "Feedback"}
                    </h3>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {feedback}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setFeedback(null);
                    setMealDescription("");
                  }}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  {lang === "ru" ? "Новая еда" : "New meal"}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors"
                >
                  {lang === "ru" ? "Закрыть" : "Close"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
