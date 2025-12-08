import { Camera, Image, Loader2, Send, X } from "lucide-react";
import React, { useRef, useState } from "react";
import {
  analyzeOffPlanMeal,
  analyzeOffPlanMealFromPhoto,
  estimateMealCalories,
  estimateMealCaloriesFromPhoto,
  identifyMealFromPhoto,
} from "../services/geminiService";
import { t } from "../translations";
import { OffPlanMealEntry, UserProfile } from "../types";
import { Mascot } from "./Mascot";

interface OffPlanMealProps {
  profile: UserProfile;
  onClose: () => void;
  onMealAnalyzed?: () => void;
  onMealSaved?: (meal: OffPlanMealEntry) => void;
}

export const OffPlanMeal: React.FC<OffPlanMealProps> = ({
  profile,
  onClose,
  onMealAnalyzed,
  onMealSaved,
}) => {
  const lang = profile.language || "ru";
  const text = t[lang].offPlanMeal || t[lang].chat; // Fallback to chat translations

  const [inputType, setInputType] = useState<"text" | "photo">("text");
  const [mealDescription, setMealDescription] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<{
    base64: string;
    mimeType: string;
  } | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      // Reset input if no file selected
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert(
        lang === "ru"
          ? "Пожалуйста, выберите изображение"
          : "Please select an image file"
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert(
        lang === "ru"
          ? "Размер файла должен быть меньше 10 МБ"
          : "File size must be less than 10 MB"
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    try {
      const base64 = await convertFileToBase64(file);
      // Determine MIME type, default to image/jpeg
      const mimeType = file.type || "image/jpeg";
      setSelectedPhoto({ base64, mimeType });
      setPhotoPreview(URL.createObjectURL(file));
    } catch (error) {
      console.error("Failed to convert image", error);
      alert(
        lang === "ru"
          ? "Не удалось загрузить фото. Пожалуйста, попробуйте еще раз."
          : "Failed to load photo. Please try again."
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSelectedPhoto(null);
      setPhotoPreview(null);
    }
  };

  const handleAnalyze = async () => {
    if (inputType === "text" && !mealDescription.trim()) return;
    if (inputType === "photo" && !selectedPhoto) return;
    if (isLoading) return;

    setIsLoading(true);
    setFeedback(null);

    try {
      let description = mealDescription;
      let analysis: string;
      let calories: number | null;

      if (inputType === "photo" && selectedPhoto) {
        // Analyze photo
        const [identifiedMeal, photoAnalysis, photoCalories] =
          await Promise.all([
            identifyMealFromPhoto(
              selectedPhoto.base64,
              selectedPhoto.mimeType,
              profile
            ),
            analyzeOffPlanMealFromPhoto(
              selectedPhoto.base64,
              selectedPhoto.mimeType,
              profile
            ),
            estimateMealCaloriesFromPhoto(
              selectedPhoto.base64,
              selectedPhoto.mimeType,
              profile
            ),
          ]);
        description = identifiedMeal;
        analysis = photoAnalysis;
        calories = photoCalories;
      } else {
        // Analyze text
        [analysis, calories] = await Promise.all([
          analyzeOffPlanMeal(mealDescription, profile),
          estimateMealCalories(mealDescription, profile),
        ]);
      }

      setFeedback(analysis);

      // Save the off-plan meal entry
      if (onMealSaved) {
        const mealEntry: OffPlanMealEntry = {
          id: Date.now().toString(),
          description: description,
          timestamp: Date.now(),
          estimatedCalories: calories || undefined,
          day: 1, // For MVP, default to day 1
        };
        onMealSaved(mealEntry);
      }

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
              {/* Input Type Selector */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    setInputType("text");
                    setSelectedPhoto(null);
                    setPhotoPreview(null);
                  }}
                  className={`flex-1 py-2 px-4 rounded-xl font-semibold text-sm transition-all ${
                    inputType === "text"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {lang === "ru" ? "Текст" : "Text"}
                </button>
                <button
                  onClick={() => {
                    setInputType("photo");
                    setMealDescription("");
                    fileInputRef.current?.click();
                  }}
                  className={`flex-1 py-2 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    inputType === "photo"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Camera size={16} />
                  {lang === "ru" ? "Фото" : "Photo"}
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />

              {inputType === "text" ? (
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
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {lang === "ru" ? "Загрузите фото еды" : "Upload food photo"}
                  </label>
                  {photoPreview ? (
                    <div className="space-y-3">
                      <div className="relative rounded-xl overflow-hidden border-2 border-slate-200">
                        <img
                          src={photoPreview}
                          alt="Food preview"
                          className="w-full h-64 object-cover"
                        />
                        <button
                          onClick={() => {
                            setSelectedPhoto(null);
                            setPhotoPreview(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <Image size={18} />
                        {lang === "ru" ? "Изменить фото" : "Change photo"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-12 px-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl hover:bg-slate-100 hover:border-slate-400 transition-colors flex flex-col items-center justify-center gap-3"
                    >
                      <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                        <Camera size={24} className="text-slate-500" />
                      </div>
                      <span className="text-sm font-semibold text-slate-600">
                        {lang === "ru"
                          ? "Нажмите, чтобы выбрать фото"
                          : "Tap to select photo"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {lang === "ru"
                          ? "или сделайте снимок"
                          : "or take a picture"}
                      </span>
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={
                  (inputType === "text" && !mealDescription.trim()) ||
                  (inputType === "photo" && !selectedPhoto) ||
                  isLoading
                }
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
                    setSelectedPhoto(null);
                    setPhotoPreview(null);
                    setInputType("text");
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
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
