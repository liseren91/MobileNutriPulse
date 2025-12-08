import React, { useEffect, useState, useRef } from 'react';
import { UserProfile } from '../types';
import { Clock, AlertCircle, Play, Bell, BellOff, RefreshCw, Sun } from 'lucide-react';
import { t } from '../translations';
import { Mascot } from './Mascot';

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
  isLoadingPlan,
}) => {
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00");
  const [progress, setProgress] = useState(100);
  const [status, setStatus] = useState<"Good" | "Hungry" | "Urgent" | "Night">(
    "Good"
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const hasNotifiedRef = useRef(false);

  const lang = profile.language || "ru";
  const text = t[lang].dashboard;

  const SLEEP_START_HOUR = profile.sleepStartHour ?? 22;
  const BREAKFAST_HOUR = profile.breakfastHour ?? 8;
  const SLEEP_END_HOUR = BREAKFAST_HOUR;

  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        setNotificationsEnabled(true);
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((perm) => {
          setNotificationsEnabled(perm === "granted");
        });
      }
    }
  }, []);

  useEffect(() => {
    hasNotifiedRef.current = false;
  }, [profile.lastMealTime]);

  useEffect(() => {
    if (!profile.lastMealTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const currentHour = new Date(now).getHours();

      let isNightNow = false;
      if (SLEEP_START_HOUR > SLEEP_END_HOUR) {
        isNightNow =
          currentHour >= SLEEP_START_HOUR || currentHour < SLEEP_END_HOUR;
      } else {
        isNightNow =
          currentHour >= SLEEP_START_HOUR && currentHour < SLEEP_END_HOUR;
      }

      let nextMealTime =
        profile.lastMealTime! + profile.eatingFrequencyHours * 60 * 60 * 1000;
      const nextMealDate = new Date(nextMealTime);
      const nextMealHour = nextMealDate.getHours();

      let isOvernight = false;
      let shouldReschedule = false;

      if (SLEEP_START_HOUR > SLEEP_END_HOUR) {
        shouldReschedule =
          nextMealHour >= SLEEP_START_HOUR || nextMealHour < SLEEP_END_HOUR;
      } else {
        shouldReschedule =
          nextMealHour >= SLEEP_START_HOUR && nextMealHour < SLEEP_END_HOUR;
      }

      if (shouldReschedule) {
        const rescheduledDate = new Date(nextMealTime);
        if (
          nextMealHour >= SLEEP_START_HOUR &&
          SLEEP_START_HOUR > SLEEP_END_HOUR
        ) {
          rescheduledDate.setDate(rescheduledDate.getDate() + 1);
        }
        rescheduledDate.setHours(BREAKFAST_HOUR, 0, 0, 0);
        nextMealTime = rescheduledDate.getTime();
        isOvernight = true;
      }

      const diff = nextMealTime - now;
      const totalDuration = nextMealTime - profile.lastMealTime!;

      if (isNightNow && diff > 0) {
        setStatus("Night");
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        setTimeLeft(`${hours}h ${minutes}m`);
        setProgress(100);
      } else if (diff <= 0) {
        setTimeLeft("00:00:00");
        setProgress(0);

        if (isNightNow) {
          setStatus("Night");
        } else {
          setStatus("Urgent");
          if (notificationsEnabled && !hasNotifiedRef.current) {
            try {
              new Notification(
                lang === "ru"
                  ? "NutriPulse: Пора есть! 🍽️"
                  : "NutriPulse: Time to eat! 🍽️",
                {
                  body: text.urgent,
                  requireInteraction: true,
                  silent: false,
                }
              );
              hasNotifiedRef.current = true;
            } catch (e) {
              console.error("Notification failed", e);
            }
          }
        }
      } else {
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft(
          `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );

        const pct = (diff / totalDuration) * 100;
        setProgress(pct);

        if (isOvernight) {
          setStatus("Good");
        } else {
          if (pct < 20) setStatus("Urgent");
          else if (pct < 50) setStatus("Hungry");
          else setStatus("Good");
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [profile, notificationsEnabled, lang, text]);

  const requestAccess = () => {
    Notification.requestPermission().then((perm) =>
      setNotificationsEnabled(perm === "granted")
    );
  };

  const getStatusVisuals = () => {
    if (status === 'Night') return { mood: 'sleepy', bg: 'from-indigo-900 to-slate-900', text: 'text-indigo-100', accent: 'bg-indigo-600' };
    if (status === 'Good') return { mood: 'happy', bg: 'from-teal-400 to-emerald-500', text: 'text-white', accent: 'bg-white/20' };
    if (status === 'Hungry') return { mood: 'thinking', bg: 'from-amber-300 to-orange-400', text: 'text-white', accent: 'bg-white/20' };
    return { mood: 'sad', bg: 'from-rose-400 to-red-500', text: 'text-white', accent: 'bg-white/20' };
  };

  const visuals = getStatusVisuals();

  return (
    <div className="p-6 space-y-6 pb-24 max-w-lg mx-auto relative z-10">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">{text.hello}, {profile.name}</h1>
          <p className="text-slate-500 font-medium">{text.subtitle}</p>
        </div>
        <button 
          onClick={requestAccess}
          className={`p-3 rounded-full transition-all shadow-sm active:scale-95 ${notificationsEnabled ? 'text-teal-600 bg-teal-50 border border-teal-100' : 'text-slate-400 bg-white border border-slate-200'}`}
        >
          {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
        </button>
      </header>

      {/* Main Timer Card */}
      <div className={`relative rounded-[2.5rem] p-8 shadow-xl shadow-teal-900/5 overflow-hidden transition-all duration-700 bg-gradient-to-br ${visuals.bg}`}>
        {/* Decorative Background Circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>

        <div className="relative z-10 flex flex-col items-center text-center">
           <div className="mb-6 transform transition-all duration-500 hover:scale-110">
              {/* @ts-ignore */}
              <Mascot mood={visuals.mood} size={140} />
           </div>

           <h2 className={`text-sm font-bold uppercase tracking-widest mb-1 opacity-80 ${visuals.text}`}>
               {status === 'Night' ? text.breakfastIn : text.nextMeal}
           </h2>
           
           <div className={`text-6xl font-black mb-8 tracking-tighter drop-shadow-sm font-mono ${visuals.text}`}>
             {timeLeft}
           </div>

           <button 
             onClick={updateLastMeal}
             className={`group relative overflow-hidden bg-white text-slate-900 px-10 py-4 rounded-full font-bold shadow-lg shadow-black/10 active:scale-95 transition-all flex items-center gap-3`}
           >
             <span className="absolute inset-0 bg-slate-100 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
             <span className="relative flex items-center gap-2">
               {status === 'Night' ? <Sun size={20} className="text-amber-500" /> : <Clock size={20} className="text-teal-500" />}
               {status === 'Night' ? text.iAteBreakfast : text.iAte}
             </span>
           </button>
           
           {status === 'Urgent' && (
             <p className="mt-6 text-white font-bold bg-white/20 px-4 py-1 rounded-full text-sm flex items-center gap-2 animate-pulse">
               <AlertCircle size={16} /> {text.urgent}
             </p>
           )}
           {status === 'Night' && (
             <p className="mt-6 text-indigo-200 font-medium">
               {text.night}
             </p>
           )}
        </div>

        {/* Progress Bar Background */}
        <div className="absolute bottom-0 left-0 h-2 bg-black/10 w-full">
           <div className="h-full bg-white/40 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Plan Card */}
      {!hasPlan ? (
        <div className="glass rounded-3xl p-6 text-center border-2 border-dashed border-teal-100 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <h3 className="text-slate-800 font-bold text-lg mb-2">{text.noPlan}</h3>
            <p className="text-slate-500 text-sm mb-6">{text.noPlanDesc}</p>
            <button 
              onClick={onRequestPlan}
              disabled={isLoadingPlan}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 disabled:opacity-50 flex justify-center items-center gap-2 transition-all shadow-lg shadow-slate-200"
            >
              {isLoadingPlan ? text.creating : (
                 <>
                   <Play size={20} fill="currentColor" /> {text.createPlan}
                 </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="glass rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
           <div className="text-center sm:text-left">
             <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
               <div className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></div>
               <h3 className="text-slate-800 font-bold">{text.planActive}</h3>
             </div>
             <p className="text-slate-500 text-sm">{text.planActiveDesc}</p>
           </div>
           
           <button 
             onClick={onRequestPlan}
             disabled={isLoadingPlan}
             className="flex items-center gap-2 bg-slate-50 text-slate-600 px-5 py-3 rounded-xl font-semibold border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all text-sm whitespace-nowrap"
           >
             {isLoadingPlan ? (
                text.creating
             ) : (
                <>
                  <RefreshCw size={18} /> {text.newPlan}
                </>
             )}
           </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2">
          <span className="text-3xl filter drop-shadow-md">🔥</span>
          <div className="text-center">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">{text.streak}</span>
            <p className="text-slate-800 font-black text-xl">2 {text.days}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2">
           <span className="text-3xl filter drop-shadow-md">💧</span>
           <div className="text-center">
             <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">{text.water}</span>
             <p className="text-slate-800 font-black text-xl">{text.waterNorm}</p>
           </div>
        </div>
      </div>
    </div>
  );
};
