import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  MessageCircle,
  ShoppingCart,
} from "lucide-react";
import React from "react";
import { t } from "../translations";
import { ViewState } from "../types";

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  language: "ru" | "en";
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  setView,
  language,
}) => {
  const text = t[language].nav;

  const navItems = [
    { view: ViewState.DASHBOARD, icon: LayoutDashboard, label: text.status },
    { view: ViewState.MEALS, icon: CalendarDays, label: text.plan },
    { view: ViewState.SHOPPING, icon: ShoppingCart, label: text.list },
    { view: ViewState.STATS, icon: BarChart3, label: text.stats },
    { view: ViewState.CHAT, icon: MessageCircle, label: text.coach },
  ];

  return (
    <>
      {/* Gradient Fade for content below nav */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent pointer-events-none z-40"></div>

      <div className="fixed bottom-6 left-4 right-4 z-50 pb-safe">
        <nav className="glass rounded-full shadow-2xl shadow-slate-200/50 max-w-lg mx-auto p-2">
          <div className="flex justify-around items-center h-14">
            {navItems.map((item) => {
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => setView(item.view)}
                  className={`group relative flex flex-col items-center justify-center w-full h-full rounded-full transition-all duration-300 ${
                    isActive ? "" : "hover:bg-slate-50"
                  }`}
                >
                  {/* Active Indicator Background */}
                  {isActive && (
                    <span className="absolute inset-0 bg-slate-900 rounded-full scale-75 transition-transform duration-300 -z-10"></span>
                  )}

                  <div
                    className={`transition-all duration-300 transform ${
                      isActive
                        ? "-translate-y-0 text-white"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  >
                    <item.icon
                      size={22}
                      strokeWidth={isActive ? 2.5 : 2}
                      fill={isActive ? "currentColor" : "none"}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
};
