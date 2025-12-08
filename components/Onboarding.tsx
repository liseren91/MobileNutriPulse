import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ArrowRight, Check, Moon, Sun, Globe } from 'lucide-react';
import { t } from '../translations';
import { Mascot } from './Mascot';

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
    setGoal(''); 
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-teal-50 to-transparent -z-10"></div>
      
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl shadow-teal-900/5 relative border border-white">
        <button 
          onClick={toggleLang} 
          className="absolute top-8 right-8 text-slate-400 hover:text-teal-600 flex items-center gap-1 text-sm font-bold bg-slate-100 px-3 py-1 rounded-full transition-colors"
        >
          <Globe size={14} />
          {lang.toUpperCase()}
        </button>

        {/* Progress */}
        <div className="mb-8 flex flex-col gap-2">
           <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
          <span className="text-xs font-bold text-slate-400 text-right">{text.step} {step} {text.of} 4</span>
        </div>

        {/* Mascot Center Stage */}
        <div className="flex justify-center mb-6">
           {/* @ts-ignore */}
           <Mascot mood={step === 1 ? 'happy' : step === 2 ? 'thinking' : step === 3 ? 'excited' : 'sleepy'} size={120} />
        </div>

        {step === 1 && (
          <div className="animate-fade-in text-center">
            <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">{text.welcome}</h1>
            <p className="text-slate-500 mb-8 font-medium">{text.subtitle}</p>
            
            <div className="text-left">
              <label className="block mb-2 text-sm font-bold text-slate-700 ml-1">{text.nameLabel}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100 outline-none transition-all font-semibold text-lg text-slate-800 placeholder:text-slate-300"
                placeholder={text.namePlaceholder}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-black text-slate-800 mb-6 text-center">{text.goalsTitle}</h2>
            
            <label className="block mb-2 text-sm font-bold text-slate-700 ml-1">{text.mainGoalLabel}</label>
            <div className="relative mb-6">
                <select 
                value={goal} 
                onChange={(e) => setGoal(e.target.value)}
                className="w-full p-4 bg-slate-50 rounded-2xl border-transparent focus:border-teal-400 focus:bg-white outline-none appearance-none font-semibold text-slate-700"
                >
                <option value={goals.weightLoss}>{goals.weightLoss}</option>
                <option value={goals.muscle}>{goals.muscle}</option>
                <option value={goals.habits}>{goals.habits}</option>
                <option value={goals.energy}>{goals.energy}</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
            </div>

            <label className="block mb-2 text-sm font-bold text-slate-700 ml-1">{text.dietLabel}</label>
            <textarea
              value={diet}
              onChange={(e) => setDiet(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100 outline-none h-24 resize-none font-medium text-slate-700 placeholder:text-slate-300"
              placeholder={text.dietPlaceholder}
            />
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-black text-slate-800 mb-2 text-center">{text.intervalsTitle}</h2>
            <p className="text-slate-400 text-sm mb-6 text-center font-medium">{text.intervalsSubtitle}</p>
            
            <div className="space-y-3">
              {[3, 4, 5].map((h) => (
                <button
                  key={h}
                  onClick={() => setFreq(h)}
                  className={`w-full p-5 rounded-2xl border-2 flex justify-between items-center transition-all group ${
                    freq === h 
                      ? 'border-teal-400 bg-teal-50 text-teal-800 shadow-lg shadow-teal-100' 
                      : 'border-slate-100 bg-white hover:border-teal-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold">{text.every} {h} {text.hours}</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${freq === h ? 'bg-teal-400 text-white' : 'bg-slate-100 text-slate-300'}`}>
                    <Check size={14} strokeWidth={4} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-black text-slate-800 mb-2 text-center">{text.scheduleTitle}</h2>
            <p className="text-slate-400 text-sm mb-8 text-center font-medium">{text.scheduleSubtitle}</p>
            
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="block mb-2 text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Moon size={18} className="text-indigo-500" /> {text.bedtime}
                </label>
                <select 
                  value={sleepTime} 
                  onChange={(e) => setSleepTime(Number(e.target.value))}
                  className="w-full bg-transparent font-bold text-lg text-slate-800 outline-none"
                >
                  {hours.map(h => (
                    <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="block mb-2 text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Sun size={18} className="text-orange-500" /> {text.wakeTime}
                </label>
                <select 
                  value={wakeTime} 
                  onChange={(e) => setWakeTime(Number(e.target.value))}
                  className="w-full bg-transparent font-bold text-lg text-slate-800 outline-none"
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
          className="w-full mt-8 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-slate-300 active:scale-95"
        >
          {step === 4 ? text.start : text.next}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};