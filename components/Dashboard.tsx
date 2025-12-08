import React, { useEffect, useState, useRef } from 'react';
import { UserProfile } from '../types';
import { Clock, Battery, BatteryMedium, BatteryLow, AlertCircle, Play, Bell, BellOff, RefreshCw, Moon, Sun } from 'lucide-react';

interface DashboardProps {
  profile: UserProfile;
  updateLastMeal: () => void;
  onRequestPlan: () => void;
  hasPlan: boolean;
  isLoadingPlan: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  profile, 
  updateLastMeal, 
  onRequestPlan, 
  hasPlan,
  isLoadingPlan 
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [progress, setProgress] = useState(100);
  const [status, setStatus] = useState<'Good' | 'Hungry' | 'Urgent' | 'Night'>('Good');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const hasNotifiedRef = useRef(false);

  // Dynamic user settings with fallbacks
  const SLEEP_START_HOUR = profile.sleepStartHour ?? 22;
  const BREAKFAST_HOUR = profile.breakfastHour ?? 8;
  // We treat the time before breakfast as "sleep/night" mode for notifications
  const SLEEP_END_HOUR = BREAKFAST_HOUR; 

  // Request Notification Permission on Mount
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(perm => {
          setNotificationsEnabled(perm === 'granted');
        });
      }
    }
  }, []);

  // Reset notification state when user logs a meal
  useEffect(() => {
    hasNotifiedRef.current = false;
  }, [profile.lastMealTime]);

  useEffect(() => {
    if (!profile.lastMealTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const currentHour = new Date(now).getHours();

      // 1. Check if it's currently night time based on user settings
      let isNightNow = false;
      if (SLEEP_START_HOUR > SLEEP_END_HOUR) {
        // Standard case: Sleep 23:00, Wake 08:00
        isNightNow = currentHour >= SLEEP_START_HOUR || currentHour < SLEEP_END_HOUR;
      } else {
        // Edge case: Sleep 01:00, Wake 08:00 (Night Owl)
        isNightNow = currentHour >= SLEEP_START_HOUR && currentHour < SLEEP_END_HOUR;
      }

      // 2. Calculate Raw Next Meal Time
      let nextMealTime = profile.lastMealTime! + (profile.eatingFrequencyHours * 60 * 60 * 1000);
      const nextMealDate = new Date(nextMealTime);
      const nextMealHour = nextMealDate.getHours();

      // 3. Smart Reschedule Logic
      let isOvernight = false;
      let shouldReschedule = false;

      if (SLEEP_START_HOUR > SLEEP_END_HOUR) {
         shouldReschedule = nextMealHour >= SLEEP_START_HOUR || nextMealHour < SLEEP_END_HOUR;
      } else {
         shouldReschedule = nextMealHour >= SLEEP_START_HOUR && nextMealHour < SLEEP_END_HOUR;
      }

      if (shouldReschedule) {
        const rescheduledDate = new Date(nextMealTime);
        // If the meal falls in the PM night part (e.g. 23:00), move to next day
        // If it falls in the AM night part (e.g. 03:00), it's already "today" relative to wake up, but we just set hour.
        // Actually, if meal is at 23:00 today, rescheduled is 08:00 tomorrow.
        // If meal is at 02:00 tomorrow, rescheduled is 08:00 tomorrow.
        
        if (nextMealHour >= SLEEP_START_HOUR && SLEEP_START_HOUR > SLEEP_END_HOUR) {
           rescheduledDate.setDate(rescheduledDate.getDate() + 1);
        }
        rescheduledDate.setHours(BREAKFAST_HOUR, 0, 0, 0); 
        nextMealTime = rescheduledDate.getTime();
        isOvernight = true;
      }

      const diff = nextMealTime - now;
      
      // Calculate total duration for progress bar
      const totalDuration = nextMealTime - profile.lastMealTime!;

      if (isNightNow && diff > 0) {
        // Special UI for night
        setStatus('Night');
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        setTimeLeft(`${hours}ч ${minutes}м`);
        setProgress(100); 
      } else if (diff <= 0) {
        // Time expired
        setTimeLeft('00:00:00');
        setProgress(0);
        
        // If it's night now, stay in Night mode (don't alarm)
        if (isNightNow) {
            setStatus('Night');
        } else {
            setStatus('Urgent');
            // Trigger Browser Notification ONLY if not night
            if (notificationsEnabled && !hasNotifiedRef.current) {
              try {
                new Notification("NutriPulse: Пора есть! 🍽️", {
                  body: `Заправься! Пришло время поесть, чтобы поддержать метаболизм.`,
                  requireInteraction: true,
                  silent: false
                });
                hasNotifiedRef.current = true;
              } catch (e) {
                console.error("Notification failed", e);
              }
            }
        }
      } else {
        // Normal countdown
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        
        const pct = (diff / totalDuration) * 100;
        setProgress(pct);
        
        if (isOvernight) {
            setStatus('Good'); 
        } else {
            if (pct < 20) setStatus('Urgent');
            else if (pct < 50) setStatus('Hungry');
            else setStatus('Good');
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [profile, notificationsEnabled]);

  const requestAccess = () => {
    Notification.requestPermission().then(perm => setNotificationsEnabled(perm === 'granted'));
  };

  const getStatusColor = () => {
    if (status === 'Night') return 'bg-indigo-900';
    if (status === 'Good') return 'bg-emerald-500';
    if (status === 'Hungry') return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="p-6 space-y-6 pb-24 max-w-lg mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Привет, {profile.name}</h1>
          <p className="text-slate-500">Поддерживаем уровень энергии.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={requestAccess}
            className={`p-2 rounded-full transition-colors ${notificationsEnabled ? 'text-teal-500 bg-teal-50' : 'text-slate-400 bg-slate-100'}`}
            title={notificationsEnabled ? "Уведомления включены" : "Включить уведомления"}
          >
            {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
          </button>
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></div>
        </div>
      </header>

      {/* Main Timer Card */}
      <div className={`rounded-3xl p-8 shadow-sm border flex flex-col items-center text-center relative overflow-hidden transition-colors duration-500 ${
          status === 'Night' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
      }`}>
        <div className={`absolute top-0 left-0 h-1 transition-all duration-1000 ${getStatusColor()}`} style={{ width: `${progress}%` }}></div>
        
        <div className="mb-4">
          {status === 'Night' && <Moon className="text-indigo-300" size={48} />}
          {status === 'Good' && <Battery className="text-emerald-500" size={48} />}
          {status === 'Hungry' && <BatteryMedium className="text-amber-500" size={48} />}
          {status === 'Urgent' && <BatteryLow className="text-rose-500" size={48} />}
        </div>
        
        <h2 className={`text-sm font-medium uppercase tracking-wider mb-2 ${status === 'Night' ? 'text-slate-400' : 'text-slate-400'}`}>
            {status === 'Night' ? 'Завтрак через' : 'Следующий прием пищи'}
        </h2>
        <div className={`text-5xl font-mono font-bold mb-6 tracking-tight ${status === 'Night' ? 'text-white' : 'text-slate-800'}`}>
          {timeLeft}
        </div>

        <button 
          onClick={updateLastMeal}
          className={`${status === 'Night' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-900 hover:bg-slate-800'} active:scale-95 transition-all text-white px-8 py-3 rounded-full font-semibold shadow-lg flex items-center gap-2`}
        >
          {status === 'Night' ? <Sun size={18} /> : <Clock size={18} />}
          {status === 'Night' ? 'Я позавтракал(а)' : 'Я поел(а)'}
        </button>
        
        {status === 'Urgent' && (
          <p className="mt-4 text-rose-500 text-sm font-medium flex items-center gap-1">
            <AlertCircle size={14} /> Пожалуйста, перекусите сейчас!
          </p>
        )}
        {status === 'Night' && (
          <p className="mt-4 text-indigo-300 text-sm font-medium">
            Отдыхайте. До встречи утром!
          </p>
        )}
      </div>

      {/* Quick Action / Suggestion */}
      {!hasPlan ? (
        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-6 text-center">
          <h3 className="text-teal-900 font-semibold mb-2">Нет активного плана</h3>
          <p className="text-teal-700 text-sm mb-4">Создайте план на 3 дня с рецептами по 5-10 минут.</p>
          <button 
            onClick={onRequestPlan}
            disabled={isLoadingPlan}
            className="w-full bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700 disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {isLoadingPlan ? 'Создаем...' : (
               <>
                 <Play size={18} fill="currentColor" /> Создать план
               </>
            )}
          </button>
        </div>
      ) : (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
           <div className="text-center sm:text-left">
             <h3 className="text-indigo-900 font-semibold mb-1">План активен</h3>
             <p className="text-indigo-700 text-sm">У вас есть готовые рецепты и список продуктов.</p>
           </div>
           
           <button 
             onClick={onRequestPlan}
             disabled={isLoadingPlan}
             className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-xl font-semibold shadow-sm border border-indigo-100 hover:bg-indigo-50 active:scale-95 transition-all text-xs sm:text-sm whitespace-nowrap"
           >
             {isLoadingPlan ? (
                'Создаем...' 
             ) : (
                <>
                  <RefreshCw size={16} /> Новый план (3 дня)
                </>
             )}
           </button>
        </div>
      )}

      {/* Motivation Mini-Card */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
          <span className="text-2xl block mb-1">🔥</span>
          <span className="text-orange-900 text-xs font-bold uppercase">Серия</span>
          <p className="text-orange-800 font-bold text-lg">2 дня</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
           <span className="text-2xl block mb-1">💧</span>
           <span className="text-blue-900 text-xs font-bold uppercase">Вода</span>
           <p className="text-blue-800 font-bold text-lg">В норме</p>
        </div>
      </div>
    </div>
  );
};