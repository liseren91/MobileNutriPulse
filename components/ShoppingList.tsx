import {
  Ban,
  CheckSquare,
  Copy,
  RefreshCw,
  ShoppingBag,
  Square,
  Trash2,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { t } from "../translations";
import { Ingredient } from "../types";

interface ShoppingListProps {
  items: Ingredient[];
  toggleItem: (idx: number) => void;
  clearAll: () => void;
  onRegenerate: (exclusions: string) => void;
  isRegenerating: boolean;
  currentExclusions?: string;
  language: "ru" | "en";
}

export const ShoppingList: React.FC<ShoppingListProps> = ({
  items,
  toggleItem,
  clearAll,
  onRegenerate,
  isRegenerating,
  currentExclusions,
  language,
}) => {
  const [showRegenerate, setShowRegenerate] = useState(false);
  const [exclusions, setExclusions] = useState(currentExclusions || "");
  const [copied, setCopied] = useState(false);
  const text = t[language].shopping;

  const completedCount = items.filter((i) => i.checked).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  const handleCopy = () => {
    const textStr = items
      .map((i) => `${i.checked ? "[x]" : "[ ]"} ${i.item} (${i.amount})`)
      .join("\n");
    navigator.clipboard.writeText(textStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateClick = () => {
    if (exclusions.trim()) {
      onRegenerate(exclusions);
      setShowRegenerate(false);
    }
  };

  if (items.length === 0 && !isRegenerating) {
    return (
      <div className="p-8 text-center text-slate-500 mt-10 max-w-lg mx-auto">
        <ShoppingBag className="mx-auto mb-4 text-slate-300" size={64} />
        <h2 className="text-lg font-semibold text-slate-700">{text.empty}</h2>
        <p>{text.emptyDesc}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-slate-50 pt-safe">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-slate-100 p-6 pt-safe">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{text.title}</h1>
            <p className="text-slate-500 text-sm">
              {isRegenerating
                ? text.updating
                : `${text.left}: ${items.length - completedCount}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="text-teal-600 p-2 hover:bg-teal-50 rounded-full transition-colors relative"
              title={text.copy}
            >
              <Copy size={20} />
              {copied && (
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] bg-slate-800 text-white px-2 py-1 rounded whitespace-nowrap">
                  {text.copied}
                </span>
              )}
            </button>
            <button
              onClick={clearAll}
              className="text-rose-500 p-2 hover:bg-rose-50 rounded-full transition-colors"
              title={text.clear}
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
        {isRegenerating ? (
          <div className="py-20 flex flex-col items-center text-slate-400 animate-pulse">
            <RefreshCw className="animate-spin mb-4" size={40} />
            <p>{text.regenerating}</p>
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100">
              {items
                .map((item, originalIdx) => ({ item, originalIdx }))
                .sort((a, b) => {
                  // Неотмеченные товары (checked === false) идут первыми
                  if (a.item.checked !== b.item.checked) {
                    return a.item.checked ? 1 : -1;
                  }
                  // Сохраняем исходный порядок для товаров с одинаковым статусом
                  return a.originalIdx - b.originalIdx;
                })
                .map(({ item, originalIdx }) => (
                  <div
                    key={originalIdx}
                    onClick={() => toggleItem(originalIdx)}
                    className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${
                      item.checked ? "bg-slate-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`text-slate-400 ${
                        item.checked ? "text-teal-500" : ""
                      }`}
                    >
                      {item.checked ? (
                        <CheckSquare size={24} />
                      ) : (
                        <Square size={24} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          item.checked
                            ? "text-slate-400 line-through"
                            : "text-slate-800"
                        }`}
                      >
                        {item.item}
                      </p>
                      {item.amount && (
                        <p className="text-xs text-slate-500">{item.amount}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {/* Regenerate / Exclude Section */}
            <div className="pt-4">
              {!showRegenerate ? (
                <button
                  onClick={() => setShowRegenerate(true)}
                  className="w-full py-3 px-4 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Ban size={16} />
                  {text.excludeBtn}
                </button>
              ) : (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 animate-fade-in">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-slate-800">
                      {text.excludeTitle}
                    </h3>
                    <button
                      onClick={() => setShowRegenerate(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    {text.excludeDesc}
                  </p>
                  <textarea
                    value={exclusions}
                    onChange={(e) => setExclusions(e.target.value)}
                    placeholder={text.excludePlaceholder}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-teal-500 outline-none resize-none h-20 mb-3"
                  />
                  <button
                    onClick={handleRegenerateClick}
                    disabled={!exclusions.trim()}
                    className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-teal-700 disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    <RefreshCw size={16} />
                    {text.regenerate}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
