import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ArrowRight, Check, Moon, Sun, Globe } from 'lucide-react';
import { t } from '../translations';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [lang, setLang] = useState<'ru' | 'en'>('ru');
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [diet, setDiet] = useState('');
  const [freq, setFreq] = useState(4);
  const [sleepTime, setSleepTime] = useState(23);
  const [wakeTime, setWakeTime] = useState(8);

  const text = t[lang].onboarding;
  const goals = t[lang].onboarding.goals;

  // Set default goal if empty
  if (!goal) setGoal(goals.weightLoss);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      onComplete({
        name,
        goals: goal,
        dietaryPreferences: diet || 'None',
        eatingFrequencyHours: freq,
        lastMealTime: Date.now(),
        sleepStartHour: sleepTime,
        breakfastHour: wakeTime,
        language: lang
      });
    }
  };

  const toggleLang = () => {
    setLang(prev => prev === 'ru' ? 'en' : 'ru');
    // Reset goal to match new language default
    setGoal(''); 
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 max-w-md mx-auto">
      <div className="w-full bg-white p-8 rounded-3xl shadow-xl relative">
        <button 
          onClick={toggleLang} 
          className="absolute top-8 right-8 text-slate-400 hover:text-teal-600 flex items-center gap-1 text-sm font-medium transition-colors"
        >
          <Globe size={16} />
          {lang.toUpperCase()}
        </button>

        <div className="mb-6 flex justify-between items-center">
          <span className="text-sm font-semibold text-teal-600">{text.step} {step} {text.of} 4</span>
          <div className="h-1 flex-1 bg-slate-100 ml-4 rounded-full">
            <div 
              className="h-full bg-teal-500 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {step === 1 && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">{text.welcome}</h1>
            <p className="text-slate-500 mb-6">{text.subtitle}</p>
            
            <label className="block mb-2 text-sm font-medium text-slate-700">{text.nameLabel}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all mb-4"
              placeholder={text.namePlaceholder}
            />
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-slate-800 mb-4">{text.goalsTitle}</h2>
            
            <label className="block mb-2 text-sm font-medium text-slate-700">{text.mainGoalLabel}</label>
            <select 
              value={goal} 
              onChange={(e) => setGoal(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4 outline-none"
            >
              <option value={goals.weightLoss}>{goals.weightLoss}</option>
              <option value={goals.muscle}>{goals.muscle}</option>
              <option value={goals.habits}>{goals.habits}</option>
              <option value={goals.energy}>{goals.energy}</option>
            </select>

            <label className="block mb-2 text-sm font-medium text-slate-700">{text.dietLabel}</label>
            <textarea
              value={diet}
              onChange={(e) => setDiet(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none h-24 resize-none"
              placeholder={text.dietPlaceholder}
            />
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-slate-800 mb-4">{text.intervalsTitle}</h2>
            <p className="text-slate-500 text-sm mb-6">{text.intervalsSubtitle}</p>
            
            <div className="space-y-3">
              {[3, 4, 5].map((h) => (
                <button
                  key={h}
                  onClick={() => setFreq(h)}
                  className={`w-full p-4 rounded-xl border flex justify-between items-center transition-all ${
                    freq === h 
                      ? 'border-teal-500 bg-teal-50 text-teal-700' 
                      : 'border-slate-200 hover:border-teal-300'
                  }`}
                >
                  <span>{text.every} {h} {text.hours}</span>
                  {freq === h && <Check size={18} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-slate-800 mb-4">{text.scheduleTitle}</h2>
            <p className="text-slate-500 text-sm mb-6">{text.scheduleSubtitle}</p>
            
            <div className="space-y-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Moon size={16} className="text-indigo-500" /> {text.bedtime}
                </label>
                <select 
                  value={sleepTime} 
                  onChange={(e) => setSleepTime(Number(e.target.value))}
                  className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                >
                  {hours.map(h => (
                    <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Sun size={16} className="text-orange-500" /> {text.wakeTime}
                </label>
                <select 
                  value={wakeTime} 
                  onChange={(e) => setWakeTime(Number(e.target.value))}
                  className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                >
                  {hours.map(h => (
                    <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={step === 1 && !name}
          className="w-full mt-8 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          {step === 4 ? text.start : text.next}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};