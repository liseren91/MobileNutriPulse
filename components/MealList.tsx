import React, { useState, useEffect } from 'react';
import { Meal } from '../types';
import { Clock, ChevronDown, ChevronUp, ChefHat, Flame, Calendar } from 'lucide-react';
import { t } from '../translations';

interface MealListProps {
  meals: Meal[];
  language: 'ru' | 'en';
}

export const MealList: React.FC<MealListProps> = ({ meals, language }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState<number>(1);
  const text = t[language].meals;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Group by day
  const mealsByDay = meals.reduce((acc, meal) => {
    if (!acc[meal.day]) acc[meal.day] = [];
    acc[meal.day].push(meal);
    return acc;
  }, {} as Record<number, Meal[]>);

  const availableDays = Object.keys(mealsByDay).map(Number).sort((a, b) => a - b);

  useEffect(() => {
    if (availableDays.length > 0 && !availableDays.includes(activeDay)) {
      setActiveDay(availableDays[0]);
    }
  }, [availableDays, activeDay]);

  const translateMealType = (type: string) => {
    return text.types[type as keyof typeof text.types] || type;
  };

  if (meals.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 mt-10">
        <ChefHat className="mx-auto mb-4 text-slate-300" size={64} />
        <h2 className="text-lg font-semibold text-slate-700">{text.noPlan}</h2>
        <p className="mt-2 text-sm">{text.noPlanDesc}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-slate-50">
      {/* Header & Tabs */}
      <div className="bg-white sticky top-0 z-10 shadow-sm border-b border-slate-100">
        <div className="p-6 pb-2">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-teal-600" /> 
            {text.title}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{text.subtitle}</p>
        </div>
        
        <div className="flex px-4 gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {availableDays.map(day => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border ${
                activeDay === day
                  ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {text.day} {day}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {mealsByDay[activeDay]?.map((meal) => (
          <div 
            key={meal.id} 
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300"
          >
            <div 
              onClick={() => toggleExpand(meal.id)}
              className="p-4 flex justify-between items-center cursor-pointer active:bg-slate-50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${
                    meal.type === 'Breakfast' ? 'bg-orange-50 text-orange-600' :
                    meal.type === 'Lunch' ? 'bg-blue-50 text-blue-600' :
                    meal.type === 'Dinner' ? 'bg-indigo-50 text-indigo-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {translateMealType(meal.type)}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={12} /> {meal.prepTime}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-800 leading-tight">{meal.name}</h3>
              </div>
              {expandedId === meal.id ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
            </div>

            {expandedId === meal.id && (
              <div className="px-4 pb-6 bg-slate-50/50 border-t border-slate-100 animate-fade-in">
                <p className="text-sm text-slate-600 mt-3 mb-4 italic">"{meal.description}"</p>
                
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase mb-2 flex items-center gap-1">
                    {text.ingredients}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {meal.ingredients.map((ing, idx) => (
                      <span key={idx} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-600 shadow-sm">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase mb-2">{text.instructions}</h4>
                  <ol className="relative border-l border-slate-200 ml-2 space-y-4">
                    {meal.instructions.map((step, idx) => (
                      <li key={idx} className="pl-4 relative">
                         <div className="absolute -left-1 top-1.5 w-2 h-2 rounded-full bg-teal-400 ring-4 ring-slate-50"></div>
                         <p className="text-sm text-slate-700">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>

                {meal.calories && (
                  <div className="mt-4 pt-4 border-t border-slate-200/50 flex items-center gap-1 text-xs text-slate-400 font-medium justify-end">
                    <Flame size={14} className="text-orange-400" /> {text.calories.replace('{cal}', meal.calories.toString())}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        
        {(!mealsByDay[activeDay] || mealsByDay[activeDay].length === 0) && (
           <div className="text-center py-10 text-slate-400">
             <p>{text.noMeals}</p>
           </div>
        )}
      </div>
    </div>
  );
};